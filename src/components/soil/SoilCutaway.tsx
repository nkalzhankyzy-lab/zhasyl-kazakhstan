"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "../ui/Badge";

type Horizon = { key: string; name: string; text: string; top: number };

const HORIZONS: Horizon[] = [
  { key: "A", name: "Жоғарғы қабат", text: "Өсімдік тамырлары мен органикалық заттар көп шоғырланатын қабат.", top: 38 },
  { key: "B", name: "Аралық қабат", text: "Жоғарыдан шайылған заттар жиналуы мүмкін қабат.", top: 58 },
  { key: "C", name: "Аналық жыныс", text: "Топырақ түзілетін, аз өзгерген тау жынысы немесе шөгінді.", top: 76 },
];

/** Сортаң (тұзды) нұсқа: беттегі тұз қабығы және тұз жиналған қабат */
const SALINE_HORIZONS: Horizon[] = [
  { key: "Т", name: "Тұз қабығы", text: "Грунт суы капиллярмен көтеріліп буланғанда, тұзы бетте ақ қабыршақ болып қалады. Арал маңы мен Сырдария атырауына тән.", top: 24 },
  { key: "A", name: "Жоғарғы қабат", text: "Тамырлар мен органикалық зат бар, бірақ тұз көп болса, өсімдік суды нашар сіңіреді.", top: 42 },
  { key: "S", name: "Тұз жиналған қабат", text: "Ақ тамырлар мен кристалдар — еріген тұздар (NaCl, Na₂SO₄) жиналған жер. Күріш алқаптарында суару грунт суын көтеріп, осы қабатты күшейтеді.", top: 62 },
  { key: "C", name: "Аналық жыныс", text: "Өзен мен теңіз шөгінділері (саз, құм).", top: 80 },
];

/** Топырақ кесіндісінің оқу моделі: көлемді қисайту және жалпы қабаттар */
export function SoilCutaway({ saline = false }: { saline?: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const [salty, setSalty] = useState(saline);
  const horizons = salty ? SALINE_HORIZONS : HORIZONS;
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  return (
    <section aria-labelledby="cutaway-title">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="cutaway-title" className="font-serif text-lg font-bold text-forest">
          Топырақ кесіндісі
        </h3>
        <Badge tone="illustration">Оқу моделі</Badge>
      </div>
      {saline && (
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Кесінді түрі">
          {[
            { v: true, label: "Сортаң (тұзды) — Қызылорда" },
            { v: false, label: "Қалыпты топырақ" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={salty === o.v}
              onClick={() => {
                setSalty(o.v);
                setActive(null);
              }}
              className={`min-h-9 rounded-full border px-3 text-sm font-semibold ${salty === o.v ? "border-forest bg-forest text-white" : "border-line bg-white hover:bg-mint"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <div
          className="relative aspect-square [perspective:700px]"
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse") return;
            const r = e.currentTarget.getBoundingClientRect();
            setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -10, y: ((e.clientX - r.left) / r.width - 0.5) * 14 });
          }}
          onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        >
          <div
            className="relative h-full w-full overflow-hidden rounded-2xl bg-[#fbf6ea] shadow-soft transition-transform duration-200 [transform-style:preserve-3d]"
            style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
          >
            <Image
              src={salty ? "/images/soil-cutaway-saline.png" : "/images/soil-cutaway.png"}
              alt={salty ? "Беті ақ тұз қабығымен жабылған, ортасында тұз жиналған қабаты бар сортаң топырақ кесіндісі" : "Өсімдік тамырлары көрінетін топырақ кесіндісінің көлемді оқу моделі"} fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover" />
            {/* Қабат белгілері — жалпы оқу схемасы */}
            {horizons.map((h) => (
              <button
                key={h.key}
                type="button"
                onClick={() => setActive(active === h.key ? null : h.key)}
                aria-pressed={active === h.key}
                aria-label={`${h.key} — ${h.name}`}
                className={`absolute right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold shadow ${
                  active === h.key ? "border-white bg-forest text-white" : "border-forest bg-white/90 text-forest"
                }`}
                style={{ top: `${h.top}%` }}
              >
                {h.key}
              </button>
            ))}
          </div>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm">
          {horizons.map((h) => (
            <li key={h.key}>
              <button
                type="button"
                onClick={() => setActive(active === h.key ? null : h.key)}
                className={`w-full rounded-xl border px-2.5 py-1.5 text-left transition ${active === h.key ? "border-forest bg-mint" : "border-line bg-white hover:bg-mint/60"}`}
              >
                <span className="font-semibold text-forest">
                  {h.key} · {h.name}
                </span>
                {active === h.key && <span className="mt-0.5 block text-[13px] text-ink/80">{h.text}</span>}
              </button>
            </li>
          ))}
          <li className="text-xs text-muted">{salty ? "Тұзды нұсқа — түпнұсқа суретке тұз қосылған оқу иллюстрациясы." : "Жалпы оқу моделі: қабаттардың қалыңдығы мен құрамы нақты жерге байланысты өзгереді."}</li>
        </ul>
      </div>
    </section>
  );
}
