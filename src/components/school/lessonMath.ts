import { roomLight } from "@/data/indoor-plants";
import type { Lesson, Room } from "@/lib/types";
import { lightFit, plantCount, plantsPer10m2, roomVolume } from "../garden/roomMath";
import { absHumidity, co2At } from "./Co2Estimator";

export const VENT_LABEL: Record<Lesson["ventilation"], string> = {
  closed: "Терезе жабық",
  vent: "Форточка ашық",
  break: "Үзілісте желдетілді",
};

const CO2_L_H = 18; // бір оқушы, л/сағ
const WATER_G_H = 40; // бір оқушы, г/сағ
const ACH: Record<Lesson["ventilation"], number> = { closed: 0.5, vent: 2, break: 0.5 };

export type Co2Source = "measured" | "humidity" | "model";
export const CO2_SOURCE_LABEL: Record<Co2Source, string> = {
  measured: "өлшенген",
  humidity: "ылғалдылық арқылы",
  model: "көлем мен желдету арқылы",
};

/** Сабақ соңындағы CO₂: өлшенген → ылғалдылық арқылы → көлем мен желдету моделі */
export function lessonCo2(l: Lesson, room: Room | undefined): { value: number; source: Co2Source } | null {
  if (l.co2End !== null) return { value: l.co2End, source: "measured" };
  if (!room) return null;
  const v = roomVolume(room);
  const t = l.durationMin / 60;
  const c0 = l.co2Start ?? (l.ventilation === "break" ? 420 : 550);
  if (l.tStart !== null && l.rhStart !== null && l.tEnd !== null && l.rhEnd !== null) {
    const added = (absHumidity(l.tEnd, l.rhEnd) - absHumidity(l.tStart, l.rhStart)) * v;
    const expected = l.pupils * WATER_G_H * t;
    if (added > 0) {
      const share = Math.min(added / expected, 1);
      const sealed = co2At(t, { n: l.pupils, g: CO2_L_H, v, c0: 0, ach: 0 });
      return { value: Math.round(c0 + share * sealed), source: "humidity" };
    }
  }
  return { value: Math.round(co2At(t, { n: l.pupils, g: CO2_L_H, v, c0, ach: ACH[l.ventilation] })), source: "model" };
}

export interface Score {
  total: number;
  air: number;
  humidity: number;
  plants: number;
  care: number;
  lessons: number;
  avgCo2: number | null;
  avgRh: number | null;
  okAirShare: number | null;
  okRhShare: number | null;
}

/** Жасыл ұпай (100): ауа 40, ылғалдылық 20, гүлдер 25, күтім 15 */
export function greenScore(room: Room, lessons: Lesson[]): Score {
  const ls = lessons.filter((l) => l.roomId === room.id);
  const co2 = ls.map((l) => lessonCo2(l, room)?.value).filter((v): v is number => v !== undefined);
  const rh = ls.map((l) => l.rhEnd).filter((v): v is number => v !== null);
  const okAirShare = co2.length ? co2.filter((v) => v <= 1000).length / co2.length : null;
  const rhPts = rh.map((v) => (v >= 40 && v <= 60 ? 1 : v >= 30 && v <= 70 ? 0.5 : 0));
  const okRhShare = rh.length ? rhPts.reduce((a: number, b) => a + b, 0) / rh.length : null;
  const air = okAirShare === null ? 0 : 40 * okAirShare;
  const humidity = okRhShare === null ? 0 : 20 * okRhShare;
  const light = roomLight(room.windowDir);
  const known = room.plants.filter((p) => lightFit(p, light) !== "unknown");
  const fitShare = known.length ? known.filter((p) => lightFit(p, light) === "ok").length / known.length : 0;
  const plants = 15 * Math.min(plantsPer10m2(room) / 3, 1) + 10 * fitShare;
  const n = plantCount(room);
  const careW = room.plants.reduce((a, p) => a + p.count * (p.condition === "good" ? 1 : p.condition === "fair" ? 0.5 : 0), 0);
  const care = n ? 15 * (careW / n) : 0;
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    total: Math.round(air + humidity + plants + care),
    air: r1(air),
    humidity: r1(humidity),
    plants: r1(plants),
    care: r1(care),
    lessons: ls.length,
    avgCo2: co2.length ? Math.round(co2.reduce((a, b) => a + b, 0) / co2.length) : null,
    avgRh: rh.length ? Math.round(rh.reduce((a, b) => a + b, 0) / rh.length) : null,
    okAirShare,
    okRhShare,
  };
}

export function lessonsContext(rooms: Room[], lessons: Lesson[]): string {
  if (!rooms.length) return "";
  const lines = ["ЭКОПАСПОРТ (мұғалім енгізген сабақ журналы; CO₂ көбіне ылғалдылық немесе көлем арқылы БАҒАЛАНҒАН, өлшенбеген):"];
  for (const r of rooms) {
    const s = greenScore(r, lessons);
    lines.push(
      `- ${r.name}: жасыл ұпай ${s.total}/100 (ауа ${s.air}/40, ылғалдылық ${s.humidity}/20, гүлдер ${s.plants}/25, күтім ${s.care}/15); ${s.lessons} сабақ; орташа CO₂ сабақ соңында ${s.avgCo2 ?? "—"} ppm; орташа ылғалдылық ${s.avgRh ?? "—"}%; гүл ${plantCount(r)}.`,
    );
    for (const l of lessons.filter((x) => x.roomId === r.id).slice(-6)) {
      const c = lessonCo2(l, r);
      lines.push(
        `  · ${l.date} ${l.time}, ${l.subject}, ${l.className}, ${l.pupils} оқушы, ${l.durationMin} мин, ${VENT_LABEL[l.ventilation]}; T ${l.tStart ?? "—"}→${l.tEnd ?? "—"} °C, RH ${l.rhStart ?? "—"}→${l.rhEnd ?? "—"}%; CO₂ ≈ ${c?.value ?? "—"} ppm (${c ? CO2_SOURCE_LABEL[c.source] : "—"})`,
      );
    }
  }
  return lines.join("\n");
}
