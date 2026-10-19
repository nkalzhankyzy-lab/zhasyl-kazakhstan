"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatValue, metricMeta, summarize } from "@/lib/metrics";
import { formatDateTime, formatDayKey, formatTime, localDayKey } from "@/lib/time";
import type { MetricKey, SensorReading, VentilationEvent } from "@/lib/types";
import { Badge, DemoBadge } from "../ui/Badge";

interface Props {
  readings: SensorReading[];
  events: VentilationEvent[];
  metric: MetricKey;
  day: string;
  mode: "demo" | "user";
  height?: number;
  showSummary?: boolean;
}

interface Pt {
  t: number;
  v: number | null;
}

/** Уақыттық график: бос мәндер нөл болып сызылмайды, үзілістер көрсетіледі */
export function SensorChart({ readings, events, metric, day, mode, height = 300, showSummary = true }: Props) {
  const m = metricMeta(metric);
  const dayReadings = useMemo(() => readings.filter((r) => localDayKey(r.timestamp) === day), [readings, day]);

  const { data, gaps } = useMemo(() => {
    const pts: Pt[] = dayReadings.map((r) => ({ t: Date.parse(r.timestamp), v: r[metric] }));
    const diffs = pts.slice(1).map((p, i) => p.t - pts[i].t).sort((a, b) => a - b);
    const median = diffs.length ? diffs[Math.floor(diffs.length / 2)] : 0;
    const limit = Math.max(median * 2.5, 15 * 60_000);
    const out: Pt[] = [];
    const gapAreas: [number, number][] = [];
    pts.forEach((p, i) => {
      if (i > 0 && p.t - pts[i - 1].t > limit) {
        out.push({ t: pts[i - 1].t + 1, v: null });
        gapAreas.push([pts[i - 1].t, p.t]);
      }
      out.push(p);
    });
    return { data: out, gaps: gapAreas };
  }, [dayReadings, metric]);

  // Бір ғана өлшем болса — осьті ±30 минутқа кеңейтеміз
  const ts = data.map((d) => d.t);
  const tMin = ts.length ? Math.min(...ts) : 0;
  const tMax = ts.length ? Math.max(...ts) : 0;
  const xDomain: [number, number] = tMax - tMin < 10 * 60_000 ? [tMin - 30 * 60_000, tMax + 30 * 60_000] : [tMin, tMax];
  const dayEvents = events.filter((e) => localDayKey(e.timestamp) === day);
  const sum = summarize(dayReadings.map((r) => r[metric]));
  const hasValues = sum.count > 0;
  const fewPoints = sum.count < 40;

  return (
    <figure className="flex flex-col gap-2" aria-label={`${m.label} графигі, ${formatDayKey(day)}`}>
      <figcaption className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-ink">
          {m.label}, {m.unit}
        </span>
        <span className="text-muted">· {formatDayKey(day)}</span>
        {mode === "demo" ? <DemoBadge /> : <Badge tone="user">Мен енгізген өлшемдер</Badge>}
        {dayEvents.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <span className="inline-block h-3 w-0.5 bg-sky-600" aria-hidden /> желдету оқиғасы
          </span>
        )}
        {gaps.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <span className="inline-block h-3 w-4 rounded-sm bg-stone-300/70" aria-hidden /> дерек үзілісі
          </span>
        )}
      </figcaption>
      <div className="relative w-full rounded-2xl border border-line bg-white p-2" style={{ height }}>
        {mode === "demo" && (
          <span className="pointer-events-none absolute right-3 top-2 z-10 rounded-md bg-amber-100/90 px-2 py-0.5 text-[11px] font-bold text-amber-900">ДЕМО</span>
        )}
        {hasValues ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 18, right: 14, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#ece4d1" strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={xDomain}
                allowDataOverflow
                tickFormatter={(t: number) => formatTime(new Date(t).toISOString())}
                tick={{ fontSize: 12, fill: "#56634f" }}
                minTickGap={28}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#56634f" }}
                width={52}
                domain={["auto", "auto"]}
              />
              {gaps.map(([a, b]) => (
                <ReferenceArea key={a} x1={a} x2={b} fill="#d6d3cd" fillOpacity={0.55} label={{ value: "Дерек жоқ", fontSize: 11, fill: "#57534e", position: "insideTop" }} />
              ))}
              {dayEvents.map((e) => (
                <ReferenceLine
                  key={e.id}
                  x={Date.parse(e.timestamp)}
                  stroke="#0284c7"
                  strokeDasharray="4 3"
                  label={{ value: "Желдету", fontSize: 11, fill: "#0369a1", position: "top" }}
                />
              ))}
              <Tooltip
                labelFormatter={(t) => formatDateTime(new Date(Number(t)).toISOString())}
                formatter={(v) => [v === null || v === undefined ? "өлшем жоқ" : `${formatValue(Number(v), metric)} ${m.unit}`, m.label]}
                contentStyle={{ borderRadius: 12, borderColor: "#e2d8c0" }}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke="#1f4a2c"
                strokeWidth={2.2}
                dot={fewPoints ? { r: 3, fill: "#1f4a2c" } : false}
                activeDot={{ r: 5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">Бұл күні {m.label} бойынша өлшем енгізілмеген</div>
        )}
      </div>
      {showSummary && (
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {[
            ["Ең төмен", sum.min],
            ["Ең жоғары", sum.max],
            ["Орташа", sum.avg],
          ].map(([label, v]) => (
            <div key={label as string} className="rounded-xl bg-mint/60 px-3 py-2">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="font-semibold">{v === null ? "—" : `${formatValue(v as number, metric)} ${m.unit}`}</dd>
            </div>
          ))}
          <div className="rounded-xl bg-mint/60 px-3 py-2">
            <dt className="text-xs text-muted">Өлшем саны</dt>
            <dd className="font-semibold">{sum.count}</dd>
          </div>
        </dl>
      )}
    </figure>
  );
}
