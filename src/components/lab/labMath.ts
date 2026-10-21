import type { Co2Sample, LabResult, Room } from "@/lib/types";
import { plantCount } from "../garden/roomMath";

export const SAMPLE_LABEL: Record<Co2Sample, string> = {
  start: "Сабақ басы",
  end: "Сабақ соңы",
  outdoor: "Сыртқы ауа",
  breath: "Дем (үрлеу)",
};

const OUTDOOR_PPM = 420;

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/**
 * Индикатор әдісі: ерітіндідегі сілті тұрақты, сондықтан түс өзгергенге дейін керек CO₂ мөлшері тұрақты.
 * Демек басу саны × CO₂ ≈ const, яғни CO₂ ≈ 420 × (сыртқы ауаның басу саны ÷ сынаманың басу саны).
 */
export function co2FromPushes(pushes: number, outdoorPushes: number | null) {
  return outdoorPushes && pushes > 0 ? (OUTDOOR_PPM * outdoorPushes) / pushes : null;
}

export function co2Summary(results: LabResult[], rooms: Room[]) {
  const co2 = results.filter((r) => r.kind === "co2" && r.pushes);
  const outdoor = mean(co2.filter((r) => r.sample === "outdoor").map((r) => r.pushes!));
  const byRoom = rooms
    .map((room) => {
      const rs = co2.filter((r) => r.roomId === room.id);
      const start = mean(rs.filter((r) => r.sample === "start").map((r) => r.pushes!));
      const end = mean(rs.filter((r) => r.sample === "end").map((r) => r.pushes!));
      return {
        room,
        n: rs.length,
        start,
        end,
        ratio: start && end ? start / end : null,
        ppmStart: start ? co2FromPushes(start, outdoor) : null,
        ppmEnd: end ? co2FromPushes(end, outdoor) : null,
      };
    })
    .filter((x) => x.n > 0);
  return { outdoor, byRoom };
}

/** Бір гүлдің тәулігіне буландыратын суы, г */
export const gPerDay = (r: LabResult) => (r.m1 != null && r.m2 != null && r.hours ? ((r.m1 - r.m2) / r.hours) * 24 : null);

export function transpirationSummary(results: LabResult[], rooms: Room[]) {
  const list = results.filter((r) => r.kind === "transpiration").map((r) => ({ r, g: gPerDay(r) })).filter((x): x is { r: LabResult; g: number } => x.g !== null && x.g > 0);
  const perPot = mean(list.map((x) => x.g));
  return {
    list,
    perPot,
    /** Бір гүл, г/сағ — CO₂ формуласына беріледі */
    perPotGph: perPot !== null ? perPot / 24 : null,
    byRoom: rooms.map((room) => ({ room, plants: plantCount(room), gDay: perPot !== null ? perPot * plantCount(room) : null })),
  };
}

export function labContext(results: LabResult[], rooms: Room[]): string {
  if (!results.length) return "";
  const lines = ["ЗЕРТХАНА ТӘЖІРИБЕЛЕРІ (оқушылар жасаған):"];
  const c = co2Summary(results, rooms);
  if (c.byRoom.length)
    lines.push(
      "CO₂ индикатор әдісі (шприц басу саны; аз болса — CO₂ көп): " +
        (c.outdoor ? `сыртқы ауа ${c.outdoor.toFixed(1)} рет; ` : "") +
        c.byRoom.map((x) => `${x.room.name}: басы ${x.start?.toFixed(1) ?? "—"}, соңы ${x.end?.toFixed(1) ?? "—"}${x.ppmEnd ? ` (≈ ${Math.round(x.ppmEnd)} ppm)` : ""}`).join("; "),
    );
  const t = transpirationSummary(results, rooms);
  if (t.perPot !== null) lines.push(`Гүлдің су буландыруы: бір гүл орташа ${t.perPot.toFixed(0)} г/тәулік (${t.list.length} өлшем). ` + t.byRoom.filter((x) => x.plants).map((x) => `${x.room.name}: ≈ ${Math.round(x.gDay!)} г/тәулік`).join("; "));
  const st = results.filter((r) => r.kind === "stomata" && r.stomata);
  if (st.length) lines.push("Лептесік саны (көру алаңында): " + st.map((r) => `${r.plant}: ${r.stomata} (×${r.mag ?? "?"})`).join("; "));
  return lines.join("\n");
}
