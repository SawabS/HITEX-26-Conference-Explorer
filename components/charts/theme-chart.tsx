"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { days } from "@/lib/data";
import { topicStats } from "@/lib/insights";

const contentDays = days.filter((d) => d.track !== "opening");
const COLOR: Record<string, string> = { economy: "var(--t-economy)", technology: "var(--t-technology)", content: "var(--t-content)" };

type Row = { id: string; label: string; [date: string]: string | number };

/** Sessions per theme, stacked by day. Recharts, theme-aware through CSS variables. */
export default function ThemeChart({ metric, onSelect }: { metric: "count" | "minutes"; onSelect?: (id: string) => void }) {
  const data: Row[] = topicStats.map((t) => {
    const row: Row = { id: t.id, label: t.short };
    for (const d of contentDays) row[d.date] = metric === "count" ? t.byDay[d.date].count : t.byDay[d.date].minutes;
    return row;
  }).sort((a, b) => contentDays.reduce((s, d) => s + Number(b[d.date]), 0) - contentDays.reduce((s, d) => s + Number(a[d.date]), 0));

  return (
    <div style={{ height: data.length * 30 + 40 }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }} barCategoryGap={7}>
          <CartesianGrid horizontal={false} stroke="var(--line)" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (metric === "minutes" ? `${Math.round(v / 6) / 10}h` : String(v))}
          />
          <YAxis type="category" dataKey="label" width={104} tick={{ fill: "var(--fg-2)", fontSize: 12.5 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] shadow-2">
                  <p className="mb-1 font-semibold">{label}</p>
                  {payload.map((p) => (
                    <p key={String(p.dataKey)} className="flex items-center justify-between gap-4">
                      <span className="text-muted">{contentDays.find((d) => d.date === p.dataKey)?.label}</span>
                      <span className="mono">{metric === "minutes" ? `${p.value} min` : p.value}</span>
                    </p>
                  ))}
                </div>
              ) : null
            }
          />
          {contentDays.map((d, i) => (
            <Bar
              key={d.date}
              dataKey={d.date}
              stackId="a"
              fill={COLOR[d.track]}
              radius={i === contentDays.length - 1 ? [0, 4, 4, 0] : 0}
              onClick={(row) => onSelect?.((row as unknown as { payload: Row }).payload.id)}
              style={{ cursor: onSelect ? "pointer" : undefined }}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
