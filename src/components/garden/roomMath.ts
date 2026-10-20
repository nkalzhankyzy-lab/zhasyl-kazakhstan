import { dirLabel, plantById, roomLight, type Light } from "@/data/indoor-plants";
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
      `- ${r.name}${r.floor !== null ? `, ${r.floor}-қабат` : ""}: ${r.lengthM}×${r.widthM}×${r.heightM} м, көлемі ${Math.round(roomVolume(r))} м³, терезе: ${dirLabel(r.windowDir)}${r.windows ? ` (${r.windows} терезе)` : ""}. Гүл саны ${plantCount(r)}, 10 м²-ге ${plantsPer10m2(r).toFixed(1)}. Гүлдер: ${plants || "жоқ"}.${r.notes ? ` Ескертпе: ${r.notes}` : ""}`,
    );
  }
  return lines.join("\n");
}
