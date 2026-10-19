"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "../ui/Badge";

const HORIZONS = [
  { key: "A", name: "Жоғарғы қабат", text: "Өсімдік тамырлары мен органикалық заттар көп шоғырланатын қабат." },
  { key: "B", name: "Аралық қабат", text: "Жоғарыдан шайылған заттар жиналуы мүмкін қабат." },
  { key: "C", name: "Аналық жыныс", text: "Топырақ түзілетін, аз өзгерген тау жынысы немесе шөгінді." },
];

/** Топырақ кесіндісінің оқу моделі: көлемді қисайту және жалпы қабаттар */
export function SoilCutaway() {
  const [active, setActive] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  return (
    <section aria-labelledby="cutaway-title">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="cutaway-title" className="font-serif text-lg font-bold text-forest">
          Топырақ кесіндісі
        </h3>
        <Badge tone="illustration">Оқу моделі</Badge>
      </div>
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
            <Image src="/images/soil-cutaway.png" alt="Өсімдік тамырлары көрінетін топырақ кесіндісінің көлемді оқу моделі" fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover" />
            {/* Қабат белгілері — жалпы оқу схемасы */}
            {HORIZONS.map((h, i) => (
              <button
                key={h.key}
                type="button"
                onClick={() => setActive(active === h.key ? null : h.key)}
                aria-pressed={active === h.key}
                aria-label={`${h.key} — ${h.name}`}
                className={`absolute right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold shadow ${
                  active === h.key ? "border-white bg-forest text-white" : "border-forest bg-white/90 text-forest"
                }`}
                style={{ top: `${[38, 58, 76][i]}%` }}
              >
                {h.key}
              </button>
            ))}
          </div>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm">
          {HORIZONS.map((h) => (
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
          <li className="text-xs text-muted">Жалпы оқу моделі: қабаттардың қалыңдығы мен құрамы нақты жерге байланысты өзгереді.</li>
        </ul>
      </div>
    </section>
  );
}
