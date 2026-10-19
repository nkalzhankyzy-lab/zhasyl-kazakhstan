import type { Metadata } from "next";
import { ResearchJournal } from "@/components/journal/ResearchJournal";
import { STORAGE_WHERE } from "@/lib/supabase/client";

export const metadata: Metadata = { title: "Зерттеу күнделігі" };

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">Зерттеу күнделігі</h1>
      <p className="mb-5 mt-1 text-muted">Сұрақ → болжам → бақылау → әрекет → қорытынды. Деректер {STORAGE_WHERE} сақталады.</p>
      <ResearchJournal />
    </div>
  );
}
