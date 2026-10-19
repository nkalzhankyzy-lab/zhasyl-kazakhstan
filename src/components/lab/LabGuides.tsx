"use client";

import {
  ChevronDown,
  Droplets,
  FlaskConical,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { parseOptionalNumber } from "@/lib/metrics";

interface Guide {
  id: string;
  icon: ReactNode;
  title: string;
  goal: string;
  tools: string[];
  steps: string[];
  read: string[];
  math: string;
}

const GUIDES: Guide[] = [
  {
    id: "ph",
    icon: <FlaskConical size={22} aria-hidden />,
    title: "Топырақтың pH-ын өлшеу",
    goal: "Топырақтың қышқыл, бейтарап немесе сілтілі екенін анықтау.",
    tools: [
      "Кептірілген, ұсақталған топырақ үлгісі",
      "Дистилденген су",
      "Таразы, өлшеуіш цилиндр, стақан",
      "Шыны таяқша",
      "pH индикатор қағазы немесе pH-метр",
    ],
    steps: [
      "10 г топырақ өлшеп, таза стақанға салыңыз.",
      "Үстіне 50 мл дистилденген су құйыңыз (топырақ пен судың қатынасы 1:5).",
      "5 минут араластырып, 30 минут тұндырыңыз.",
      "Үстіңгі мөлдір бөлігіне pH қағазын батырыңыз немесе pH-метрдің электродын салыңыз.",
      "Нәтижені және әдісті («1:5 су сүзіндісі») платформаға енгізіңіз.",
    ],
    read: [
      "pH 6,5-тен төмен — қышқыл",
      "pH 6,5–7,5 — бейтарап",
      "pH 7,5-тен жоғары — сілтілі. Карбонатты және тұзданған топырақтарда жиі кездеседі.",
    ],
    math: "Қатынас: 10 г топыраққа 50 мл су. Егер 25 г топырақ алсаңыз, қанша су керек? 25 × 5 = 125 мл.",
  },
  {
    id: "ec",
    icon: <Zap size={22} aria-hidden />,
    title: "Тұздылықты бағалау (электрөткізгіштік, ЭӨ)",
    goal: "Суда еріген тұздардың салыстырмалы мөлшерін бағалау: тұз көп болса, ерітінді электр тогын жақсы өткізеді.",
    tools: [
      "pH өлшеуге дайындалған 1:5 топырақ сүзіндісі",
      "EC-метр (кондуктометр)",
      "Дистилденген су (электродты шаю үшін)",
    ],
    steps: [
      "pH өлшегендей 1:5 топырақ сүзіндісін дайындаңыз.",
      "EC-метрдің электродын дистилденген сумен шайып, сүзіндіге батырыңыз.",
      "Көрсеткіш тұрақтанғанда мәнін және бірлігін жазыңыз (мкСм/см немесе мСм/см).",
      "Әр үлгіні бірдей әдіспен өлшеңіз, тек сонда оларды салыстыруға болады.",
    ],
    read: [
      "ЭӨ мәні жоғары болған сайын, ерітіндіде тұз көп.",
      "Әр түрлі әдіспен (1:5 сүзінді, қаныққан паста) алынған мәндерді тікелей салыстыруға болмайды.",
      "Беттегі ақ қабыршақ — тұздың көзге көрінетін белгісі.",
    ],
    math: "Бірлікті ауыстыру: 1 мСм/см = 1000 мкСм/см. Мысалы, 850 мкСм/см = 850 ÷ 1000 = 0,85 мСм/см.",
  },
  {
    id: "moisture",
    icon: <Droplets size={22} aria-hidden />,
    title: "Топырақ ылғалдылығы (салмақ әдісі)",
    goal: "Топырақтағы судың үлесін кептіріп, салмақ айырмасы арқылы есептеу.",
    tools: [
      "Қақпағы бар ыдыс (бюкс)",
      "Таразы (0,1 г дәлдікпен)",
      "Кептіргіш шкаф (105 °C) немесе жылы, құрғақ орын",
    ],
    steps: [
      "Бос ыдысты өлшеңіз: m₀.",
      "Жаңа алынған топырақты ыдысқа салып, қайта өлшеңіз: m₁.",
      "Кептіргіш шкафта 105 °C-та 24 сағат кептіріңіз (мұғалімнің бақылауымен). Шкаф болмаса, салмағы өзгермей қалғанша жылы жерде бірнеше күн кептіріңіз.",
      "Кепкен топырағы бар ыдысты өлшеңіз: m₂.",
      "Төмендегі формуламен есептеп, бірлігін «% (салмақтық)» деп енгізіңіз.",
    ],
    read: [
      "Ылғалдылық = (m₁ − m₂) ÷ (m₂ − m₀) × 100%",
      "Құмды топырақ суды тез жоғалтады, сазды топырақ ұзақ ұстайды.",
    ],
    math: "Мысалы: m₀ = 20 г, m₁ = 70 г, m₂ = 62 г. Су: 70 − 62 = 8 г. Құрғақ топырақ: 62 − 20 = 42 г. Ылғалдылық: 8 ÷ 42 × 100 ≈ 19%.",
  },
];

function MoistureCalc() {
  const [v, setV] = useState({ m0: "", m1: "", m2: "" });
  const m0 = parseOptionalNumber(v.m0);
  const m1 = parseOptionalNumber(v.m1);
  const m2 = parseOptionalNumber(v.m2);
  let result: string | null = null;
  let error: string | null = null;
  if (m0 !== null && m1 !== null && m2 !== null) {
    if ([m0, m1, m2].some(Number.isNaN)) error = "Сан енгізіңіз";
    else if (!(m1 > m2 && m2 > m0)) error = "Дұрыс реті: m₁ > m₂ > m₀";
    else
      result = `${(((m1 - m2) / (m2 - m0)) * 100).toFixed(1).replace(".", ",")}%`;
  }
  return (
    <div className="mt-3 rounded-xl border border-line bg-white p-3">
      <p className="text-sm font-semibold text-forest">Калькулятор</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(
          [
            ["m0", "m₀, бос ыдыс, г"],
            ["m1", "m₁, ылғал топырақпен, г"],
            ["m2", "m₂, кепкеннен кейін, г"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="text-xs text-muted">
            {label}
            <input
              className="input mt-1 !min-h-10"
              inputMode="decimal"
              value={v[k]}
              onChange={(e) => setV({ ...v, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <p className="mt-2 text-[15px]" aria-live="polite">
        {error ? (
          <span className="text-alert">{error}</span>
        ) : result ? (
          <>
            Ылғалдылық: <b>{result}</b>
          </>
        ) : (
          <span className="text-muted">Үш мәнді енгізіңіз</span>
        )}
      </p>
    </div>
  );
}

export function LabGuides() {
  const [open, setOpen] = useState<string | null>("ph");
  return (
    <section aria-labelledby="guides-title" className="mt-6">
      <h2
        id="guides-title"
        className="font-serif text-2xl font-bold text-forest"
      >
        Тәжірибе нұсқаулықтары
      </h2>
      <p className="mt-1 text-muted">
        Топырақ үлгісін зерттеудің қадамдық әдістемесі. Нәтижені «Зерттеу
        күнделігіндегі» топырақ үлгісіне енгізіңіз.
      </p>
      <p className="mt-2 flex items-start gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-900">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" aria-hidden />
        Тәжірибені мұғалімнің бақылауымен жасаңыз: қолғап киіңіз, кептіргіш
        шкафпен абай болыңыз, топырақпен жұмыстан кейін қолды жуыңыз.
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {GUIDES.map((g) => {
          const isOpen = open === g.id;
          return (
            <li key={g.id} className="card overflow-hidden p-0">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`guide-${g.id}`}
                onClick={() => setOpen(isOpen ? null : g.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-mint/50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-forest">
                  {g.icon}
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-ink">
                    {g.title}
                  </span>
                  <span className="block text-sm text-muted">{g.goal}</span>
                </span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-muted transition ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {isOpen && (
                <div
                  id={`guide-${g.id}`}
                  className="grid gap-4 border-t border-line px-4 py-4 md:grid-cols-2"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-forest">
                      Құралдар
                    </h3>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[15px]">
                      {g.tools.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                    <h3 className="mt-3 text-sm font-semibold text-forest">
                      Қадамдар
                    </h3>
                    <ol className="mt-1 list-decimal space-y-1 pl-5 text-[15px]">
                      {g.steps.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-forest">
                      Нәтижені түсіну
                    </h3>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[15px]">
                      {g.read.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                    <p className="mt-3 rounded-xl bg-sand-2/60 px-3 py-2 text-sm text-bark">
                      <b>Математика:</b> {g.math}
                    </p>
                    {g.id === "moisture" && <MoistureCalc />}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
