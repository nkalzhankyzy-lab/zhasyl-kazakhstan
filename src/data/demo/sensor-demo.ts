// ДЕМО — нақты өлшем емес.
// Алдын ала есептелген, әр ашқанда бірдей болатын көрсетілім сценарийі:
// сабақ кезінде CO₂ өседі, үзілісте және желдету оқиғасынан кейін төмендейді.
// Кездейсоқ сан қолданылмайды; «шу» детерминирленген синус функциясымен жасалады.

import { localPartsToIso } from "@/lib/time";
import type { SensorReading, VentilationState } from "@/lib/types";
import { MAIN_CLASSROOM } from "../schools";

export const DEMO_SCENARIO_TEXT =
  "Көрсетілім сценарийі: 6 сабақтық оқу күні, 5 минут сайынғы жазба. Сабақ кезінде CO₂ өседі, белгіленген уақытта терезе ашылып (желдету оқиғасы), көрсеткіш төмендейді. 13 қазандағы 12:10–12:35 аралығында дерек үзілісі әдейі қалдырылған.";

interface Period {
  from: string;
  to: string;
  occupants: number;
  vent: VentilationState;
  event?: boolean;
}

interface DaySpec {
  date: [number, number, number];
  students: number;
  gaps: [string, string][];
  periods: Period[];
}

const lesson = (from: string, to: string, n: number): Period => ({ from, to, occupants: n, vent: "closed" });
const brk = (from: string, to: string, vent: VentilationState = "door", event = false): Period => ({ from, to, occupants: 3, vent, event });

const DAYS: DaySpec[] = [
  {
    date: [2026, 10, 13],
    students: 24,
    gaps: [["12:10", "12:35"]],
    periods: [
      lesson("08:00", "08:45", 24),
      brk("08:45", "08:55"),
      lesson("08:55", "09:40", 24),
      brk("09:40", "09:50"),
      lesson("09:50", "10:35", 22),
      brk("10:35", "10:55", "window_door", true),
      lesson("10:55", "11:40", 24),
      brk("11:40", "11:50"),
      lesson("11:50", "12:35", 25),
      brk("12:35", "12:45"),
      lesson("12:45", "13:30", 20),
    ],
  },
  {
    date: [2026, 10, 14],
    students: 26,
    gaps: [],
    periods: [
      lesson("08:00", "08:45", 26),
      brk("08:45", "08:55", "window", true),
      lesson("08:55", "09:40", 26),
      brk("09:40", "09:50"),
      lesson("09:50", "10:35", 26),
      brk("10:35", "10:55", "window_door", true),
      lesson("10:55", "11:40", 25),
      brk("11:40", "11:50", "window", true),
      lesson("11:50", "12:35", 26),
      brk("12:35", "12:45"),
      lesson("12:45", "13:30", 23),
    ],
  },
];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const OUTDOOR_CO2 = 420;
const ROOM_M3 = 180;
const CO2_M3_PER_H_PER_STUDENT = 0.0155; // ~15,5 л/сағ — оқу сценарийі үшін шартты шама
const AIR_CHANGE: Record<VentilationState, number> = { closed: 0.7, door: 2.2, window: 5, window_door: 7 };

function buildDay(spec: DaySpec, dayIndex: number): SensorReading[] {
  const res: SensorReading[] = [];
  let co2 = 460;
  let temp = 20.6 + dayIndex * 0.4;
  let hum = 36;
  const start = toMin(spec.periods[0].from);
  const end = toMin(spec.periods[spec.periods.length - 1].to);
  const stepMin = 5;
  for (let t = start; t <= end; t += stepMin) {
    const p = spec.periods.find((x) => t >= toMin(x.from) && t < toMin(x.to)) ?? spec.periods[spec.periods.length - 1];
    const ach = AIR_CHANGE[p.vent];
    const h = stepMin / 60;
    // Қарапайым бір камералы масса балансы
    co2 = co2 + h * ((p.occupants * CO2_M3_PER_H_PER_STUDENT * 1e6) / ROOM_M3 - ach * (co2 - OUTDOOR_CO2));
    temp = temp + h * (p.occupants * 0.045 - (ach - 0.7) * 0.35);
    hum = hum + h * (p.occupants * 0.18 - (ach - 0.7) * 1.4);
    const i = t / stepMin + dayIndex * 31;
    const noise = (a: number, f: number, ph: number) => a * Math.sin(i * f + ph);
    const hhmm = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    const inGap = spec.gaps.some(([a, b]) => t >= toMin(a) && t < toMin(b));
    if (inGap) continue;
    const ts = localPartsToIso(spec.date[0], spec.date[1], spec.date[2], Math.floor(t / 60), t % 60)!;
    const eventStart = !!p.event && t === toMin(p.from);
    res.push({
      id: `demo-${spec.date.join("")}-${hhmm.replace(":", "")}`,
      classroomId: MAIN_CLASSROOM.id,
      status: "demo",
      timestamp: ts,
      co2Ppm: Math.round(co2 + noise(18, 1.7, 0.3) + noise(9, 0.37, 1.1)),
      temperatureC: Math.round((temp + noise(0.12, 0.9, 0.5)) * 10) / 10,
      humidityPct: Math.round(hum + noise(0.8, 0.6, 2.0)),
      pm25UgM3: Math.round((7.5 + (p.occupants < 5 ? 3.5 : 0) + (p.vent === "window" || p.vent === "window_door" ? 2 : 0) + noise(1.2, 1.3, 0.7) + noise(0.8, 0.29, 0)) * 10) / 10,
      occupants: p.occupants,
      ventilation: p.vent,
      ventilationEvent: eventStart,
      note: eventStart ? "Демо: үзілісте терезе ашылды" : "",
      source: "demo-scenario",
    });
  }
  return res;
}

export const DEMO_READINGS: SensorReading[] = DAYS.flatMap((d, i) => buildDay(d, i));
