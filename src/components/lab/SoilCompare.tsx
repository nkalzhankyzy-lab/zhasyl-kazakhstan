"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { regionById } from "@/data/regions";
import { useCollection, useHydrated } from "@/lib/storage/hooks";
import { repositories } from "@/lib/storage/repositories";
import { formatDate } from "@/lib/time";
import type { Measurement } from "@/lib/types";
import { useDataMode } from "../Providers";
import { DataModeSwitch } from "../sensors/DataModeSwitch";
import { DemoBadge } from "../ui/Badge";

interface Row {
  id: string;
  name: string;
  region: string;
  date: string;
  ph: number | null;
  moisture: Measurement | null;
  ec: Measurement | null;
}

// ДЕМО — салыстыру қалай көрінетінін көрсету үшін ойдан алынған мәндер, нақты өлшем емес.
const DEMO_ROWS: Row[] = [
  {
    id: "c1",
    name: "Демо: жайылмадағы сортаң",
    region: "Қызылорда облысы",
    date: "2026-10-01",
    ph: 8.4,
    moisture: { value: 22, unit: "% (салмақтық)", method: "" },
    ec: { value: 4.2, unit: "мСм/см", method: "" },
  },
  {
    id: "c2",
    name: "Демо: мектеп ауласы, құмдақ",
    region: "Қызылорда облысы",
    date: "2026-10-03",
    ph: 7.8,
    moisture: { value: 6, unit: "% (салмақтық)", method: "" },
    ec: { value: 0.35, unit: "мСм/см", method: "" },
  },
  {
    id: "c3",
    name: "Демо: тақыр",
    region: "Қызылорда облысы",
    date: "2026-10-05",
    ph: 8.6,
    moisture: { value: 11, unit: "% (салмақтық)", method: "" },
    ec: { value: 1.6, unit: "мСм/см", method: "" },
  },
];

type Key = "ph" | "moisture" | "ec";
const METRICS: { key: Key; label: string; unit: string }[] = [
  { key: "ph", label: "pH", unit: "" },
  { key: "moisture", label: "Ылғалдылық", unit: "%" },
  { key: "ec", label: "ЭӨ (тұздылық)", unit: "мСм/см" },
];

/** Графикке ортақ бірлікпен шығару: ЭӨ → мСм/см, ылғалдылық тек пайызбен */
function valueOf(r: Row, k: Key): number | null {
  if (k === "ph") return r.ph;
  if (k === "moisture")
    return r.moisture && r.moisture.unit.startsWith("%")
      ? r.moisture.value
      : null;
  if (!r.ec) return null;
  return r.ec.unit === "мкСм/см" ? r.ec.value / 1000 : r.ec.value;
}

const COLORS = [
  "#2c6239",
  "#a6784a",
  "#6fa9cf",
  "#5b8f3e",
  "#6b4b2f",
  "#c89b67",
];
const num = (n: number) =>
  n.toLocaleString("ru-RU", { maximumFractionDigits: 2 });

export function SoilCompare() {
  const { mode } = useDataMode();
  const user = useCollection(repositories.soilSamples);
  const hydrated = useHydrated();
  const [metric, setMetric] = useState<Key>("ph");
  const rows: Row[] = useMemo(
    () =>
      mode === "demo"
        ? DEMO_ROWS
        : user
            .filter(
              (s) =>
                s.status === "user" && (s.ph !== null || s.moisture || s.ec),
            )
            .sort((a, b) => a.collectedAt.localeCompare(b.collectedAt))
            .map((s) => ({
              id: s.id,
              name: s.name,
              region: regionById(s.regionId)?.nameKk ?? "",
              date: s.collectedAt,
              ph: s.ph,
              moisture: s.moisture,
              ec: s.ec,
            })),
    [mode, user],
  );
  const m = METRICS.find((x) => x.key === metric)!;
  const chart = rows
    .map((r) => ({
      name: r.name.replace(/^Демо:\s*/, ""),
      v: valueOf(r, metric),
    }))
    .filter((d) => d.v !== null);
  const skipped = rows.length - chart.length;

  return (
    <section
      aria-labelledby="compare-title"
      className="mt-8 flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="compare-title"
            className="font-serif text-2xl font-bold text-forest"
          >
            Үлгілерді салыстыру
          </h2>
          <p className="text-muted">
            Енгізілген топырақ үлгілерінің өлшемдері қатар.
          </p>
        </div>
        <DataModeSwitch />
      </div>
      {mode === "demo" && <DemoBadge className="self-start" />}

      {!hydrated ? (
        <p className="text-muted">Жүктелуде…</p>
      ) : rows.length === 0 ? (
        <p className="card p-5 text-muted">
          Әзірге өлшемі бар топырақ үлгісі жоқ. «Зерттеу күнделігінде» үлгі
          қосып, pH, ылғалдылық немесе ЭӨ мәнін енгізіңіз.
        </p>
      ) : (
        <div className="card grid gap-4 p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 pr-2 font-semibold">Үлгі</th>
                  <th className="py-2 pr-2 font-semibold">pH</th>
                  <th className="py-2 pr-2 font-semibold">Ылғалдылық</th>
                  <th className="py-2 font-semibold">ЭӨ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line/70 align-top">
                    <td className="py-2 pr-2">
                      <span className="font-semibold">{r.name}</span>
                      <span className="block text-xs text-muted">
                        {formatDate(r.date)}
                        {r.region ? ` · ${r.region}` : ""}
                      </span>
                    </td>
                    <td className="py-2 pr-2">{r.ph !== null ? num(r.ph) : "—"}</td>
                    <td className="py-2 pr-2">
                      {r.moisture
                        ? `${num(r.moisture.value)} ${r.moisture.unit}`
                        : "—"}
                    </td>
                    <td className="py-2">
                      {r.ec ? `${num(r.ec.value)} ${r.ec.unit}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div
              role="radiogroup"
              aria-label="Салыстыру көрсеткіші"
              className="inline-flex flex-wrap rounded-xl bg-mint p-0.5 text-sm"
            >
              {METRICS.map((x) => (
                <button
                  key={x.key}
                  type="button"
                  role="radio"
                  aria-checked={metric === x.key}
                  onClick={() => setMetric(x.key)}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${metric === x.key ? "bg-white text-forest shadow-sm" : "text-muted"}`}
                >
                  {x.label}
                </button>
              ))}
            </div>
            {chart.length ? (
              <div className="mt-2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chart}
                    margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
                  >
                    <CartesianGrid
                      stroke="#e2d8c0"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#56634f" }}
                      interval={0}
                      tickFormatter={(s: string) =>
                        s.length > 14 ? s.slice(0, 13) + "…" : s
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#56634f" }}
                      domain={metric === "ph" ? [0, 14] : [0, "auto"]}
                    />
                    <Tooltip
                      formatter={(v) => [
                        `${num(Number(v))}${m.unit ? " " + m.unit : ""}`,
                        m.label,
                      ]}
                    />
                    <Bar
                      dataKey="v"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={false}
                    >
                      {chart.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Бұл көрсеткіш бойынша өлшем жоқ.
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              {metric === "ec" &&
                "ЭӨ мСм/см-ге келтірілген. Әр түрлі әдіспен өлшенген мәндерді тікелей салыстырмаңыз. "}
              {metric === "moisture" &&
                "Тек пайызбен берілген өлшемдер көрсетіледі. "}
              {skipped > 0 && `${skipped} үлгіде бұл көрсеткіш жоқ.`}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
