import sherpa_onnx, soundfile as sf, json, sys
d = "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8"
rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f"{d}/encoder.int8.onnx", decoder=f"{d}/decoder.int8.onnx", joiner=f"{d}/joiner.int8.onnx", tokens=f"{d}/tokens.txt", model_type="nemo_transducer", num_threads=4)
for name in sys.argv[1:]:
    a, sr = sf.read(f"{name}.wav", dtype="float32")
    # chunk into ~30 s windows on low-energy points to stay within model limits
    import numpy as np
    win = int(sr*0.05); e = np.array([np.sqrt(np.mean(a[i:i+win]**2)) for i in range(0, len(a), win)])
    cuts=[0]; target=25*sr
    while len(a)-cuts[-1] > 35*sr:
        lo=(cuts[-1]+target)//win; hi=(cuts[-1]+target+10*sr)//win
        j=lo+int(np.argmin(e[lo:hi])); cuts.append(j*win)
    cuts.append(len(a))
    toks=[]
    for s,t in zip(cuts,cuts[1:]):
        st=rec.create_stream(); st.accept_waveform(sr, a[s:t]); rec.decode_stream(st); r=st.result
        toks += [(tok, s/sr+ts) for tok,ts in zip(r.tokens, r.timestamps)]
    json.dump({"tokens":toks,"duration":len(a)/sr}, open(f"{name}.tokens.json","w"))
    print(name, "".join(t for t,_ in toks)[:3000], "\n")
