"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RoomCheck, type Lang } from "./RoomCheck";

/** «Өз бөлмеңді тексер» беті: қазақша / орысша ауыстырғышпен (?lang=ru) */
export function CheckPage() {
  const sp = useSearchParams();
  const [chosen, setChosen] = useState<Lang | null>(null);
  const lang: Lang = chosen ?? (sp.get("lang") === "ru" ? "ru" : "kk");
  useEffect(() => {
    document.documentElement.lang = lang === "ru" ? "ru" : "kk";
  }, [lang]);
  function choose(l: Lang) {
    setChosen(l);
    const u = new URL(window.location.href);
    u.searchParams.set("lang", l);
    window.history.replaceState(null, "", u.toString());
  }
  const ru = lang === "ru";
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{ru ? "Страница открывается по QR-коду" : "QR-код арқылы ашылатын бет"}</p>
          <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">{ru ? "Проверь свою комнату" : "Өз бөлмеңді тексер"}</h1>
        </div>
        <div role="radiogroup" aria-label="Тіл / Язык" className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-line">
          {(["kk", "ru"] as const).map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={lang === l}
              onClick={() => choose(l)}
              className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${lang === l ? "bg-forest text-white" : "hover:bg-mint"}`}
            >
              {l === "kk" ? "Қазақша" : "Русский"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 max-w-3xl text-[17px] text-ink/85">
        {ru ? (
          <>Введите размеры класса, зала или комнаты и число людей. Сайт оценит, как быстро накапливается CO₂, подскажет, сколько и каких растений поставить, а ИИ даст совет. Методы расчёта и мировые исследования — на странице{" "}</>
        ) : (
          <>Сынып, зал немесе үй бөлмесінің өлшемін және ондағы адам санын енгізіңіз. Сайт CO₂ қаншалықты тез жиналатынын бағалап, қанша және қандай гүл керегін есептейді, ЖИ кеңес береді. Есептеу әдістері мен әлемдік зерттеулер{" "}</>
        )}
        <Link href="/lab#research" className="font-semibold text-forest underline underline-offset-2">
          {ru ? "Лаборатория" : "Зертхана"}
        </Link>
        {ru ? "." : " бетінде."}
      </p>
      <div className="mt-5">
        <RoomCheck qrSrc="/images/qr-tekser.svg" lang={lang} />
      </div>
    </div>
  );
}
