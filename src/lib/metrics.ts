import type { MetricKey, SensorReading, VentilationState } from "./types";

export interface MetricMeta {
  key: MetricKey;
  label: string;
  short: string;
  unit: string;
  decimals: number;
  /** Мүмкін емес мәндер — қате жол */
  hardMin: number;
  hardMax: number;
  /** Күмәнді мәндер — сақталады, бірақ тексеру үшін белгіленеді (қауіпсіздік шегі ЕМЕС) */
  checkBelow?: number;
  checkAbove?: number;
}

export const METRICS: MetricMeta[] = [
  { key: "co2Ppm", label: "CO₂", short: "CO₂", unit: "ppm", decimals: 0, hardMin: 0, hardMax: 40000, checkBelow: 350, checkAbove: 5000 },
  { key: "temperatureC", label: "Температура", short: "Темп.", unit: "°C", decimals: 1, hardMin: -40, hardMax: 60, checkBelow: 5, checkAbove: 40 },
  { key: "humidityPct", label: "Салыстырмалы ылғалдылық", short: "Ылғал.", unit: "%", decimals: 0, hardMin: 0, hardMax: 100, checkBelow: 10, checkAbove: 95 },
  { key: "pm25UgM3", label: "PM2.5", short: "PM2.5", unit: "мкг/м³", decimals: 1, hardMin: 0, hardMax: 2000, checkAbove: 500 },
];

export const metricMeta = (k: MetricKey) => METRICS.find((m) => m.key === k)!;

export const VENTILATION_LABELS: Record<VentilationState, string> = {
  closed: "Терезе мен есік жабық",
  window: "Терезе ашық",
  door: "Есік ашық",
  window_door: "Терезе мен есік ашық",
};

export function formatValue(v: number | null | undefined, k: MetricKey): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return formatNumber(v, metricMeta(k).decimals);
}

/** Қазақша сан пішімі: мыңдықтар бос орынмен, ондық бөлшек үтірмен (браузер локаліне тәуелсіз) */
export function formatNumber(v: number, decimals = 0): string {
  const f = 10 ** decimals;
  const r = Math.round(v * f) / f;
  const [int, frac] = Math.abs(r).toString().split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  return `${r < 0 ? "−" : ""}${grouped}${frac ? "," + frac : ""}`;
}

export type Issue = { field: string; level: "error" | "warning"; message: string };

/** Мәндердің мүмкін екенін және күмәнді-күмәнсізін тексереді. Мәнді ешқашан өзгертпейді. */
export function checkReading(r: Pick<SensorReading, MetricKey | "occupants">): Issue[] {
  const issues: Issue[] = [];
  for (const m of METRICS) {
    const v = r[m.key];
    if (v === null) continue;
    if (v < m.hardMin || v > m.hardMax) {
      issues.push({ field: m.key, level: "error", message: `${m.label}: ${v} ${m.unit} — мүмкін емес мән (${m.hardMin}…${m.hardMax})` });
    } else if ((m.checkBelow !== undefined && v < m.checkBelow) || (m.checkAbove !== undefined && v > m.checkAbove)) {
      issues.push({ field: m.key, level: "warning", message: `${m.label}: ${v} ${m.unit} — әдеттен тыс мән, датчик пен енгізуді тексеріңіз` });
    }
  }
  if (r.occupants !== null) {
    if (r.occupants < 0 || !Number.isInteger(r.occupants)) issues.push({ field: "occupants", level: "error", message: "Оқушы саны — теріс емес бүтін сан болуы керек" });
    else if (r.occupants > 45) issues.push({ field: "occupants", level: "warning", message: `Оқушы саны ${r.occupants} — тексеріңіз` });
  }
  return issues;
}

export interface Summary {
  min: number | null;
  max: number | null;
  avg: number | null;
  count: number;
}

export function summarize(values: (number | null)[]): Summary {
  const xs = values.filter((v): v is number => v !== null && !Number.isNaN(v));
  if (!xs.length) return { min: null, max: null, avg: null, count: 0 };
  return {
    min: Math.min(...xs),
    max: Math.max(...xs),
    avg: xs.reduce((a, b) => a + b, 0) / xs.length,
    count: xs.length,
  };
}

/** Бос жол → null; сан емес → NaN (қате ретінде көрсету үшін). Үтірлі ондық бөлшек қабылданады. */
export function parseOptionalNumber(input: string | undefined | null): number | null {
  if (input === undefined || input === null) return null;
  const v = String(input).trim().replace(/\s/g, "").replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
