"""
Builds data/podcasts.generated.json and public/podcasts/*.mp3 from the
NotebookLM day briefings.

Inputs (per episode): the original audio and <name>.tokens.json written by
transcribe.py (NVIDIA Parakeet TDT 0.6B v2 via sherpa-onnx, token timestamps).
Outputs: word-timed transcript (names corrected to the official agenda
spelling), sentence ranges, chapters linked to agenda sessions, and a 30 fps
loudness/band envelope that drives the visualiser and waveform scrubber.

Usage: python3 build.py <asr_dir> <project_root> [day2 day3 day4]
When episode names are supplied, other existing episodes are preserved.
"""
import base64, json, re, subprocess, sys
import numpy as np, soundfile as sf

ASR, ROOT = sys.argv[1], sys.argv[2]
FPS = 30

EPISODES = [
    {"date": "2026-10-07", "name": "day2", "src": "HITEX_Day_2.m4a", "wrap": "Catch"},
    {"date": "2026-10-08", "name": "day3", "src": "HITEX_Day_3.m4a", "wrap": "Don't miss"},
    {"date": "2026-10-09", "name": "day4", "src": "HITEX_Day_4.m4a", "wrap": "You know, today"},
]

# Spoken form -> official agenda spelling. Matching is case-insensitive on whole words.
FIX = [
    ('Karam Al-Shakur', 'Karam Alshukur'),
    ('Hiwa Afandi', 'Hiwa Afandy'),
    ('KRD Pass', 'KRDPass'),
    ('Stoan Abil', 'Doaa Nabeel'),
    ('Shamal Al-Juhoki', 'Shamal Al-Duhoki'),
    ('Trekhan Faraj Hamid', 'Chrakhan Faraj Hamid'),
    ('Shakar Tayyab Nouri', 'Shkar Taib Noori'),
    ('Ryan Suwar Suleiman', 'Rayan Swar Sulaiman'),
    ('Sarmad Aimajid', 'Sarmad I. Majeed'),
    ('ProTech', 'PROTEX'),
    ('Sarkout Shaban', 'Sarkawt Shaban'),
    ('Noor Abdul Kader', 'Noor Abdulqader'),
    ('Heman Ibrahim', 'Hemin Ibrahim'),
    ('Hawaz Aouni Ahmed', 'Hawraz Auny Ahmad'),
    ('Havi Khosrawi', 'Hevi Khosrawi'),
    ('Mohamed Al-Sada', 'Mohammed Alsada'),
    ('Donna Mahmoud', 'Dana Mahmood'),
    ('15.05', '15:05'),

    ("Hitex", "HITEX"), ("Hitech", "HITEX"), ("Herbal", "Erbil"), ("Erbil Time", "Erbil time"),
    ("Mazan Mahmoud Bayad", "Mazen Mahmoud Bayadh"), ("Maivon Hassan", "Mevan Hassan"),
    ("Allah Ibrahim Mousa", "Ala Ibrahim Musa"), ("Isra Saifullah Mustafa", "Israa Saefulla Mustafa"),
    ("Rakhbar Omer", "Rahbar Omer"), ("Dania Kawafayk", "Danya Kawa Faeq"), ("Fireside Chat", "fireside chat"),
    ("H.R. Manas", "HR Mahnaz"), ("Delban", "Delband"), ("E. V. Maul's", "EV Mall's"),
    ("Harish Sabah Nouri", "Herish Sabah Nori"), ("Mohammad Alaf", "Mohammed Allaf"),
    ("Barkhar Azad", "Barkar Azad"), ("Barzanji", "Barznjy"), ("Baywar Latif", "Bewar Lateef"),
    ("Fast Pays", "FastPay's"), ("Wissam S. Haider", "Wisam S. Hayder"), ("Sarah Ibrahim", "Sara Ibrahim"),
    ("Awanya", "Ovanya"), ("Bigard Sarbast Yassin", "Begard Sarbast Yasin"), ("Botan Lukban", "Botan Luqman"),
    ("Mihabad Araf Hassan", "Mihabad Aref Hassan"), ("T V", "TV"), ("Kazan Abdullah", "Kazhan Abdulwahab"),
    ("Talat Tahir", "Talaat Tahir"), ("Yusuf A. Al-Khazraghi", "Yousif A Al-Kazragy"), ("Evan Asso", "Evin Aso"),
    ("Lana Mohammad Tahir", "Lana Mohammed Tahir"), ("Rasko Yadgar Garib", "Rastgo Yadgar Gharib"),
    ("Zina Jabbari", "Zina Jabbary"), ("Bilal Syed Farage", "Bilal Saeed Faraj"), ("Miran Safini", "Miran Safiny"),
    ("Agoravision", "Agora Vision"), ("Hirsch Sek Omar", "Hersh Sekh Omar"), ("Influence chat", "influence chat"),
    ("Kurdcoin", "Kurdcoin"),
]

def words_from_tokens(tokens, duration):
    words = []
    for tok, ts in tokens:
        if tok.startswith(" ") or not words:
            words.append([tok.strip(), ts])
        else:
            words[-1][0] += tok
    words = [w for w in words if w[0]]
    out = []
    for i, (w, s) in enumerate(words):
        e = words[i + 1][1] if i + 1 < len(words) else min(duration, s + 0.6)
        out.append({"w": w, "s": round(s, 2), "e": round(min(e, s + 1.2), 2)})
    return out

norm = lambda w: re.sub(r"[^\w.'-]", "", w).lower().rstrip(".,?!")
def trail(w):
    m = re.search(r"[.,?!:;]+$", w)
    return m.group(0) if m else ""

def apply_fixes(words):
    for spoken, official in FIX:
        pat = [norm(x) for x in spoken.split()]
        rep = official.split()
        i = 0
        while i <= len(words) - len(pat):
            if [norm(w["w"]) for w in words[i:i + len(pat)]] == pat:
                span = words[i:i + len(pat)]
                t = trail(span[-1]["w"]) if not trail(rep[-1]) else ""
                s0, e1 = span[0]["s"], span[-1]["e"]
                step = (e1 - s0) / len(rep)
                new = [{"w": r + (t if k == len(rep) - 1 else ""), "s": round(s0 + k * step, 2), "e": round(s0 + (k + 1) * step, 2)} for k, r in enumerate(rep)]
                words[i:i + len(pat)] = new
                i += len(rep)
            else:
                i += 1
    for w in words:  # spoken clock times: "1400" -> "14:00", bare hour after "At" handled below
        m = re.fullmatch(r"(1\d)([0-5]\d)([.,?]?)", w["w"])
        if m:
            w["w"] = f"{m.group(1)}:{m.group(2)}{m.group(3)}"
    return words

def sentences(words):
    out, start = [], 0
    for i, w in enumerate(words):
        if re.search(r"[.?!]$", w["w"]) and not re.fullmatch(r"(A|S|E|V|H\.R|Dr|vs)\.", w["w"]):
            out.append([start, i]); start = i + 1
    if start < len(words): out.append([start, len(words) - 1])
    return out

def clock(w):
    m = re.fullmatch(r"(\d{1,2})(?::(\d\d))?[.,?]?", w)
    if not m: return None
    h = int(m.group(1))
    return f"{h:02d}:{m.group(2) or '00'}" if 10 <= h <= 19 else None

def chapters(words, sessions, wrap):
    chs = [{"title": "Introduction", "w": 0, "session": None}]
    used = set()
    for i, w in enumerate(words):
        c = clock(w["w"])
        hit = next((s for s in sessions if s["start"] == c and s["id"] not in used), None) if c else None
        if not hit: continue
        j = i
        while j > 0 and words[j - 1]["w"].lower() in ("at", "by", "after", "right"):
            j -= 1
        if j > 0 and words[j - 1]["w"].lower().rstrip(",") in ("then,", "then"): j -= 1
        used.add(hit["id"])
        chs.append({"title": hit["title"], "w": j, "session": hit["id"]})
    wp = wrap.split()
    for i in range(len(words)):
        if [x["w"] for x in words[i:i + len(wp)]] == wp:
            chs.append({"title": "Wrap-up", "w": i, "session": None}); break
    chs.sort(key=lambda c: c["w"])
    return chs

def envelope(path):
    a, sr = sf.read(path, dtype="float32")
    if a.ndim > 1: a = a.mean(axis=1)
    hop = sr // FPS; n = 2048
    win = np.hanning(n)
    freqs = np.fft.rfftfreq(n, 1 / sr)
    bands = [(70, 300), (300, 2000), (2000, 8000)]
    rows = []
    for k in range(0, len(a) - hop, hop):
        seg = a[k:k + n]
        if len(seg) < n: seg = np.pad(seg, (0, n - len(seg)))
        spec = np.abs(np.fft.rfft(seg * win))
        rms = np.sqrt(np.mean(a[k:k + hop] ** 2))
        b = [spec[(freqs >= lo) & (freqs < hi)].mean() for lo, hi in bands]
        sel = (freqs > 80) & (freqs < 4000)
        cen = (spec[sel] * freqs[sel]).sum() / (spec[sel].sum() + 1e-9)
        rows.append([rms, *b, cen])
    m = np.array(rows)
    out = np.zeros_like(m)
    for c in range(4):
        col = np.log1p(m[:, c] / (np.percentile(m[:, c], 50) + 1e-9))
        out[:, c] = np.clip(col / np.percentile(col, 98), 0, 1)
    out[:, 4] = np.clip((m[:, 4] - 300) / 1700, 0, 1) * (out[:, 0] > 0.15)
    q = (out * 255).round().astype(np.uint8)
    return base64.b64encode(q.tobytes()).decode(), len(q)

official = json.load(open(f"{ROOT}/data/hitex-2026.official.json"))
selected = set(sys.argv[3:])
if selected - {e["name"] for e in EPISODES}:
    raise SystemExit("Unknown episode name")
eps = json.load(open(f"{ROOT}/data/podcasts.generated.json"))["episodes"] if selected else []
for ep in EPISODES:
    if selected and ep["name"] not in selected:
        continue
    eps = [e for e in eps if e["date"] != ep["date"]]
    day = next(d for d in official["days"] if d["date"] == ep["date"])
    sessions = [{"id": s["id"], "title": s["title"]["en"].rstrip("."), "start": s["start"]} for s in day["sessions"]]
    tj = json.load(open(f"{ASR}/{ep['name']}.tokens.json"))
    words = apply_fixes(words_from_tokens(tj["tokens"], tj["duration"]))
    wav = f"{ASR}/{ep['name']}.wav"
    env, frames = envelope(wav)
    out_audio = f"{ROOT}/public/podcasts/{ep['date']}.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{ASR}/{ep['src']}", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "96k", out_audio], check=True)
    eps.append({
        "date": ep["date"], "dayNumber": day["dayNumber"], "duration": round(tj["duration"], 2),
        "words": [[w["w"], int(w["s"] * 1000), int(w["e"] * 1000)] for w in words],
        "sentences": sentences(words), "chapters": chapters(words, sessions, ep["wrap"]),
        "envelope": {"fps": FPS, "channels": ["rms", "low", "mid", "high", "pitch"], "frames": frames, "data": env},
    })
    print(ep["date"], len(words), "words", len(eps[-1]["sentences"]), "sentences", [(c["title"][:24], c["w"]) for c in eps[-1]["chapters"]])
json.dump({"generator": "scripts/podcasts/build.py", "asr": "NVIDIA Parakeet TDT 0.6B v2 (int8, sherpa-onnx)", "episodes": sorted(eps, key=lambda e: e["date"])}, open(f"{ROOT}/data/podcasts.generated.json", "w"), separators=(",", ":"))
