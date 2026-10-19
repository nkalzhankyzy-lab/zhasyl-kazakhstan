import type { GardenPlant } from "@/lib/types";

const DAY = 86_400_000;
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / DAY);

export const sortedLogs = (p: GardenPlant) => [...p.logs].sort((a, b) => a.date.localeCompare(b.date));

/** Биіктік өсімі: бірінші және соңғы өлшем арасындағы айырма, пайыз және күндер саны */
export function growth(p: GardenPlant) {
  const h = sortedLogs(p).filter((l) => l.heightCm !== null);
  if (h.length < 2) return null;
  const first = h[0];
  const last = h[h.length - 1];
  const diff = +(last.heightCm! - first.heightCm!).toFixed(1);
  const days = daysBetween(first.date, last.date);
  return {
    from: first.heightCm!,
    to: last.heightCm!,
    diff,
    pct: first.heightCm! > 0 ? Math.round((diff / first.heightCm!) * 100) : null,
    days,
    perWeek: days > 0 ? +((diff / days) * 7).toFixed(1) : null,
  };
}

export function lastWatered(p: GardenPlant) {
  const w = sortedLogs(p).filter((l) => l.watered);
  return w.length ? w[w.length - 1].date : null;
}
