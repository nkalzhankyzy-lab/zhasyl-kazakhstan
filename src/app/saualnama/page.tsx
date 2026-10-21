import type { Metadata } from "next";
import { SurveyForm } from "@/components/survey/SurveyForm";

export const metadata: Metadata = { title: "Оқушы сауалнамасы" };

export default async function SurveyPage({ searchParams }: { searchParams: Promise<{ room?: string | string[] }> }) {
  const { room } = await searchParams;
  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <p className="text-sm font-semibold text-muted">«Жасыл Қазақстан» зерттеуі</p>
      <h1 className="font-serif text-3xl font-bold text-forest">Кабинет ауасы туралы сауалнама</h1>
      <p className="mt-1 mb-4 text-[17px] text-ink/85">5 сұрақ, 1 минут. Атыңызды жазбайсыз. Сабақ соңында өз сезіміңізге қарап шынайы жауап беріңіз.</p>
      <SurveyForm roomId={typeof room === "string" ? room : undefined} />
    </div>
  );
}
