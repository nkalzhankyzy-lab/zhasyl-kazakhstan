import { dirLabel, INDOOR_PLANTS, LIGHT_LABEL, plantById, roomLight, type Light } from "@/data/indoor-plants";
import type { Room, RoomPlant } from "@/lib/types";

export const roomArea = (r: Room) => r.lengthM * r.widthM;
export const roomVolume = (r: Room) => r.lengthM * r.widthM * r.heightM;
export const plantCount = (r: Room) => r.plants.reduce((a, p) => a + p.count, 0);
/** 10 м² еденге шаққандағы гүл саны */
export const plantsPer10m2 = (r: Room) => (roomArea(r) > 0 ? (plantCount(r) / roomArea(r)) * 10 : 0);

export type Fit = "ok" | "bad" | "unknown";

/** Гүлдің кабинет жарығына сәйкестігі */
export function lightFit(plant: RoomPlant, light: Light | null): Fit {
  const sp = plantById(plant.speciesId);
  if (!sp || !light) return "unknown";
  return sp.light.includes(light) ? "ok" : "bad";
}

export const CONDITION_LABEL: Record<RoomPlant["condition"], string> = { good: "жақсы", fair: "орташа", poor: "нашар" };

/** ЖИ-ге жіберілетін кабинеттер түйіні */
export function roomsContext(rooms: Room[], demo: boolean): string {
  if (!rooms.length) return "Кабинеттер мен олардағы гүлдер әлі енгізілмеген.";
  const lines = [`КАБИНЕТТЕР МЕН ГҮЛДЕР${demo ? " (ДЕМО — нақты деректер емес)" : " (мұғалім енгізген нақты деректер)"}:`];
  for (const r of rooms) {
    const light = roomLight(r.windowDir);
    const plants = r.plants
      .map((p) => {
        const fit = lightFit(p, light);
        return `${p.name} ×${p.count} (күйі: ${CONDITION_LABEL[p.condition]}${p.plantedAt ? `, отырғызылған ${p.plantedAt}` : ""}${fit === "bad" ? ", ЖАРЫҒЫ СӘЙКЕС ЕМЕС" : ""})`;
      })
      .join("; ");
    lines.push(
      `- ${r.name}${r.floor !== null ? `, ${r.floor}-қабат` : ""}${r.pupils ? `, ${r.pupils} оқушы` : ""}: ${r.lengthM}×${r.widthM}×${r.heightM} м, көлемі ${Math.round(roomVolume(r))} м³, терезе: ${dirLabel(r.windowDir)}${r.windows ? ` (${r.windows} терезе)` : ""}. Гүл саны ${plantCount(r)}, 10 м²-ге ${plantsPer10m2(r).toFixed(1)}. Гүлдер: ${plants || "жоқ"}.${r.notes ? ` Ескертпе: ${r.notes}` : ""}`,
    );
  }
  return lines.join("\n");
}

export const DEFAULT_PUPILS = 25;

/** Кабинет нөмірі атауынан («… (№212)»), болмаса реттік нөмір */
export const roomNo = (r: Room, fallback: number) => r.name.match(/№\s*(\d+[а-яәөүұқғңһіА-Я]?)/)?.[1] ?? String(fallback);
const CO2_PER_PUPIL_L_H = 18;

/** Терезе жабық болғанда CO₂ 420-дан 1000 ppm-ге неше минутта жетеді (ауа алмаспайды деп) */
export function minutesTo1000(r: Room) {
  const pupils = r.pupils ?? DEFAULT_PUPILS;
  return ((1000 - 420) * roomVolume(r) * 60) / (pupils * CO2_PER_PUPIL_L_H * 1000);
}

export interface RoomTip {
  tone: "info" | "warn" | "good";
  text: string;
}

const HUMIDIFYING = new Set(["spathiphyllum", "nephrolepis", "chlorophytum", "cyperus"]);

/** Ережеге негізделген кабинет ұсыныстары */
export function roomTips(r: Room, all: Room[], today = new Date()): RoomTip[] {
  const tips: RoomTip[] = [];
  const light = roomLight(r.windowDir);
  const pupils = r.pupils ?? DEFAULT_PUPILS;
  const m = minutesTo1000(r);
  tips.push({
    tone: m < 25 ? "warn" : "info",
    text: `Терезе жабық болса, ${pupils} оқушымен CO₂ шамамен ${Math.round(m)} минутта 1000 ppm-ге жетеді (${Math.round(roomVolume(r))} м³ ÷ ${pupils} оқушы). ${m < 45 ? "Сондықтан әр үзілісте 5–10 минут кең ашып желдету керек." : "Сабақ ортасында қысқа желдету жеткілікті."}`,
  });
  for (const p of r.plants) {
    if (lightFit(p, light) !== "bad") continue;
    const sp = plantById(p.speciesId)!;
    const target = all.find((o) => o.id !== r.id && lightFit(p, roomLight(o.windowDir)) === "ok");
    tips.push({
      tone: "warn",
      text: `${p.name}: бұл кабинеттің жарығы (${LIGHT_LABEL[light!]}) оған сай емес.${target ? ` «${target.name}» кабинетіне (${dirLabel(target.windowDir).toLowerCase()} терезе) ауыстырған дұрыс.` : ""} ${sp.care}`,
    });
  }
  const density = plantsPer10m2(r);
  if (light && density < 1.5) {
    const have = new Set(r.plants.map((p) => p.speciesId));
    const add = INDOOR_PLANTS.filter((p) => p.light.includes(light) && !have.has(p.id)).slice(0, 4).map((p) => p.name);
    tips.push({ tone: "good", text: `Гүл аз: 10 м²-ге ${density.toFixed(1)}. Бұл кабинетке лайық гүлдер: ${add.join(", ")}.` });
  }
  const month = today.getMonth() + 1;
  if (month >= 10 || month <= 4) {
    const hum = r.plants.filter((p) => p.speciesId && HUMIDIFYING.has(p.speciesId)).reduce((a, p) => a + p.count, 0);
    tips.push({
      tone: "info",
      text: `Жылыту маусымында ауа құрғайды (ылғалдылық 20–30%-ға дейін түседі). Көп су буландыратын гүлдер — спатифиллум, хлорофитум, папоротник${hum ? `: мұнда ${hum} дана бар` : ""}. Ылғалдылықты термогигрометрмен өлшеп, басқа кабинетпен салыстырыңыз.`,
    });
  }
  const poor = r.plants.filter((p) => p.condition === "poor").map((p) => p.name);
  if (poor.length) tips.push({ tone: "warn", text: `Күйі нашар: ${poor.join(", ")}. Суаруды, жарықты және құмыраның көлемін тексеріңіз.` });
  const old = r.plants.filter((p) => p.plantedAt && (today.getTime() - new Date(p.plantedAt).getTime()) / 864e5 > 365).map((p) => p.name);
  if (old.length) tips.push({ tone: "good", text: `Бір жылдан асқан гүлдер: ${old.join(", ")}. Көктемде (наурыз–сәуір) үлкенірек құмыраға ауыстырып, топырағын жаңартыңыз.` });
  return tips;
}
