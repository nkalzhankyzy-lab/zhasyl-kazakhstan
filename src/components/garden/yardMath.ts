import { factFor, KIND_LABEL, OPEN_SPOTS, PERSON_CO2_KG_DAY, TREE_CO2_KG_YEAR } from "@/data/school-map";
import type { YardItem } from "@/lib/types";

export const CONDITION_YARD: Record<YardItem["condition"], string> = { good: "жақсы", fair: "орташа", poor: "нашар" };

export function yardTotals(items: YardItem[]) {
  const sum = (k: YardItem["kind"]) => items.filter((i) => i.kind === k).reduce((a, i) => a + i.count, 0);
  const trees = sum("tree");
  const shrubs = sum("shrub");
  const flowers = sum("flowers");
  const co2Kg = trees * TREE_CO2_KG_YEAR;
  const people = co2Kg / (PERSON_CO2_KG_DAY * 365);
  return { trees, shrubs, flowers, total: trees + shrubs + flowers, co2Kg, people };
}

export interface Tip {
  tone: "info" | "warn" | "good";
  text: string;
}

/** Ережеге негізделген ұсыныстар: жасы, күйі, ашық орындар */
export function yardTips(items: YardItem[], year = new Date().getFullYear()): Tip[] {
  const tips: Tip[] = [];
  for (const i of items) {
    const fact = factFor(i.name);
    const age = i.plantedYear ? year - i.plantedYear : null;
    if (i.condition === "poor")
      tips.push({ tone: "warn", text: `${i.name} (${i.count}): күйі нашар. Қураған бұтақтарын кесіп, суаруды тексеріңіз. Қалпына келмесе, жас көшетпен ауыстыруды жоспарлаңыз.` });
    if (fact?.lifespan && age !== null && fact.lifespan > 1 && age >= fact.lifespan * 0.8)
      tips.push({
        tone: "warn",
        text: `${i.name}: ${age} жаста, бұл түр шамамен ${fact.lifespan} жыл өмір сүреді. Ағаштардың күйін тексеріп, жанына жас көшет егуді бастаған дұрыс.`,
      });
  }
  const trees = items.filter((i) => i.kind === "tree");
  const poplar = trees.filter((i) => /терек/i.test(i.name)).reduce((a, i) => a + i.count, 0);
  const allTrees = trees.reduce((a, i) => a + i.count, 0);
  if (allTrees && poplar / allTrees > 0.25)
    tips.push({ tone: "info", text: `Ағаштардың ${Math.round((poplar / allTrees) * 100)}%-ы терек. Олар тез қартаяды; жаңа ағаштарды қарағаш, жиде, ақ акация сияқты ыстық пен тұзға төзімді түрлерден таңдаған жөн.` });
  for (const s of OPEN_SPOTS) tips.push({ tone: "good", text: `Ашық орын — ${s.label}.` });
  return tips;
}

export function yardContext(items: YardItem[]): string {
  if (!items.length) return "Мектеп ауласының өсімдіктері енгізілмеген.";
  const t = yardTotals(items);
  const lines = [
    `МЕКТЕП АУЛАСЫ (Қызылорда, №23 мектеп-лицей; мұғалім енгізген): барлығы ${t.total} өсімдік — ${t.trees} ағаш, ${t.shrubs} бұта, ${t.flowers} гүл.`,
    ...items.map((i) => `- ${KIND_LABEL[i.kind]}: ${i.name} ×${i.count}${i.plantedYear ? `, ${i.plantedYear} ж. егілген` : ""}, күйі ${CONDITION_YARD[i.condition]}${i.notes ? `, ${i.notes}` : ""}`),
    `Аулада футбол алаңы (батыс жақта), спорт алаңы (ішкі аулада), салтанатты жиын алаңы (көше жақта) бар. Ашық орындар: ${OPEN_SPOTS.map((s) => s.label).join("; ")}.`,
  ];
  return lines.join("\n");
}

/** Детерминді кездейсоқ сан (картада белгілерді әр жолы бір орынға қою үшін) */
export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
