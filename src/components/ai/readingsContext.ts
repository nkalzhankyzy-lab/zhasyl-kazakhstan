import { VENTILATION_LABELS } from "@/lib/metrics";
import { formatTime, localDayKey } from "@/lib/time";
import type { SensorReading } from "@/lib/types";

/** Кабинет өлшемдерінің ЖИ-ге жіберілетін қысқа мәтіндік түйіні. */
export function readingsContext(readings: SensorReading[], label: string, demo: boolean): string {
  if (!readings.length) return `${label}: өлшемдер әлі енгізілмеген.`;
  const byDay = new Map<string, SensorReading[]>();
  for (const r of readings) {
    const k = localDayKey(r.timestamp);
    byDay.set(k, [...(byDay.get(k) ?? []), r]);
  }
  const days = [...byDay.keys()].sort();
  const lines = [`${label}${demo ? " (ДЕМО — нақты өлшем емес, көрсетілім сценарийі)" : " (мұғалім енгізген нақты өлшемдер)"}. Барлығы ${readings.length} жазба, ${days.length} күн.`];
  for (const d of days.slice(-5)) {
    const co2 = byDay.get(d)!.map((r) => r.co2Ppm).filter((v): v is number => v !== null);
    if (!co2.length) continue;
    const avg = Math.round(co2.reduce((a, b) => a + b, 0) / co2.length);
    const over = co2.filter((v) => v > 1000).length;
    lines.push(`${d}: CO₂ ең аз ${Math.min(...co2)}, орташа ${avg}, ең көп ${Math.max(...co2)} ppm; 1000 ppm-нен асқан жазба ${over}/${co2.length}.`);
  }
  const last = byDay.get(days[days.length - 1])!;
  const step = Math.max(1, Math.ceil(last.length / 30));
  const series = last
    .filter((_, i) => i % step === 0 || i === last.length - 1)
    .map((r) => {
      const parts = [formatTime(r.timestamp)];
      if (r.co2Ppm !== null) parts.push(`CO₂ ${r.co2Ppm}`);
      if (r.temperatureC !== null) parts.push(`${r.temperatureC}°C`);
      if (r.humidityPct !== null) parts.push(`ылғ. ${r.humidityPct}%`);
      if (r.occupants !== null) parts.push(`${r.occupants} адам`);
      if (r.ventilation) parts.push(VENTILATION_LABELS[r.ventilation]);
      if (r.ventilationEvent) parts.push("ЖЕЛДЕТУ БАСТАЛДЫ");
      return parts.join(", ");
    });
  lines.push(`Соңғы күн (${days[days.length - 1]}) уақыт бойынша:\n${series.join("\n")}`);
  return lines.join("\n");
}
