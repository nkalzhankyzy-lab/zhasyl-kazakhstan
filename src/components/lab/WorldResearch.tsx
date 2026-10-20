"use client";

import { ExternalLink, Globe2 } from "lucide-react";
import { useState } from "react";
import { RESEARCH, TOPIC_LABEL, type ResearchTopic } from "@/data/research";
import { AskAi } from "../ai/AskAi";

const TOPICS = Object.keys(TOPIC_LABEL) as ResearchTopic[];

export function WorldResearch() {
  const [topic, setTopic] = useState<ResearchTopic | "all">("all");
  const list = RESEARCH.filter((r) => topic === "all" || r.topic === topic);
  return (
    <section id="research" aria-labelledby="research-title" className="mt-8 flex flex-col gap-4">
      <div>
        <h2 id="research-title" className="flex items-center gap-2 font-serif text-2xl font-bold text-forest">
          <Globe2 size={24} aria-hidden /> Әлемдік зерттеулер
        </h2>
        <p className="mt-1 max-w-3xl text-muted">
          Кабинет ауасы, ылғалдылық және бөлме гүлдері туралы ғылыми мақалалар. Әр карточкада зерттеудің не тапқаны және біздің жобаға қатысы жазылған. ЖИ кеңес бергенде осы зерттеулерге сілтейді.
        </p>
      </div>
      <div role="tablist" aria-label="Тақырып" className="flex flex-wrap gap-1">
        {(["all", ...TOPICS] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={topic === t}
            onClick={() => setTopic(t)}
            className={`min-h-10 rounded-xl border px-3 text-sm font-semibold ${topic === t ? "border-forest bg-forest text-white" : "border-line bg-white hover:bg-mint"}`}
          >
            {t === "all" ? `Барлығы (${RESEARCH.length})` : TOPIC_LABEL[t]}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {list.map((r) => (
          <li key={r.id} className="card flex min-w-0 flex-col gap-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-leaf">
              {TOPIC_LABEL[r.topic]} · {r.country} · {r.year}
            </p>
            <h3 className="font-semibold leading-snug text-ink">{r.title}</h3>
            <p className="text-sm text-muted">
              {r.authors} — <i>{r.journal}</i>
            </p>
            <p className="text-[15px]">
              <b>Не тапты: </b>
              {r.finding}
            </p>
            <p className="rounded-xl bg-mint px-3 py-2 text-[15px]">
              <b>Біз үшін: </b>
              {r.forUs}
            </p>
            <a href={r.url} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-1 self-start text-sm font-semibold text-forest underline-offset-2 hover:underline">
              Түпнұсқа <ExternalLink size={14} aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <div className="card p-4">
        <AskAi
          label="ЖИ: біздің зерттеуге не үйретеді?"
          question="Әлемдік зерттеулер тізіміне сүйеніп, біздің мектептегі «гүлдер, ылғалдылық және CO₂» зерттеуіне 3 нақты қорытынды мен 2 жаңа тәжірибе идеясын ұсын. Әр ойға (Автор, жыл) түрінде сілте. Қысқа жаз."
          context=""
        />
      </div>
    </section>
  );
}
