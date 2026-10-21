import type { Room, SurveyResponse } from "@/lib/types";

export type SurveyKey = "air" | "energy" | "head" | "dry" | "mood";

/** Сұрақтар: әрқайсысы 1–5, 5 — ең жақсы күй */
export const QUESTIONS: { key: SurveyKey; text: string; short: string; low: string; high: string }[] = [
  { key: "air", text: "Кабинеттегі ауа қандай?", short: "Ауа", low: "Өте ауыр, тымырсық", high: "Өте таза, жеңіл" },
  { key: "energy", text: "Сабақ соңында қаншалықты шаршадың?", short: "Сергектік", low: "Қатты шаршадым", high: "Мүлдем шаршаған жоқпын" },
  { key: "head", text: "Басың ауырды ма, ұйқың келді ме?", short: "Бас, ұйқы", low: "Иә, қатты", high: "Мүлдем жоқ" },
  { key: "dry", text: "Тамағың не көзің құрғады ма?", short: "Құрғақтық", low: "Иә, өте құрғақ", high: "Жоқ, жайлы" },
  { key: "mood", text: "Осы кабинетте көңіл-күйің қандай?", short: "Көңіл-күй", low: "Нашар", high: "Өте жақсы" },
];

export const FACES = ["😣", "🙁", "😐", "🙂", "😄"];

export interface SurveyStats {
  n: number;
  avg: Record<SurveyKey, number | null>;
  total: number | null;
}

export function surveyStats(list: SurveyResponse[]): SurveyStats {
  const avg = {} as Record<SurveyKey, number | null>;
  for (const q of QUESTIONS) avg[q.key] = list.length ? list.reduce((a, r) => a + r[q.key], 0) / list.length : null;
  const vals = QUESTIONS.map((q) => avg[q.key]).filter((v): v is number => v !== null);
  return { n: list.length, avg, total: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
}

export function surveyContext(rooms: Room[], list: SurveyResponse[]): string {
  if (!list.length) return "";
  const lines = ["ОҚУШЫЛАР САУАЛНАМАСЫ (атсыз, 1–5 балл, 5 — ең жақсы):"];
  for (const r of rooms) {
    const s = surveyStats(list.filter((x) => x.roomId === r.id));
    if (!s.n) continue;
    lines.push(`- ${r.name}: ${s.n} жауап; ` + QUESTIONS.map((q) => `${q.short} ${s.avg[q.key]!.toFixed(1)}`).join(", ") + `; орташа ${s.total!.toFixed(2)}.`);
  }
  return lines.join("\n");
}
