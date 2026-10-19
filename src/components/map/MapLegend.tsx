import Link from "next/link";
import { SOIL_SCHEME_DISCLAIMER, SOIL_SCHEME_TITLE, SOIL_SYMBOLS, SOIL_ZONES } from "@/data/soil-scheme";
import type { MapLayer } from "./MapLayerSwitch";

function SymbolSwatch({ k }: { k: string }) {
  return (
    <svg width="34" height="22" viewBox="0 0 34 22" aria-hidden className="shrink-0 rounded-md border border-line">
      {k === "sand" && (
        <>
          <rect width="34" height="22" fill="#e2c48f" />
          {[...Array(12)].map((_, i) => (
            <circle key={i} cx={3 + (i % 6) * 5.5} cy={i < 6 ? 6 : 15} r="1.1" fill="#8a5a22" />
          ))}
        </>
      )}
      {k === "saline" && (
        <>
          <rect width="34" height="22" fill="#eef0f1" />
          <path d="M0 0 L22 22 M8 0 L30 22 M16 0 L34 18 M-8 0 L14 22 M22 0 L0 22 M30 0 L8 22 M34 4 L16 22" stroke="#7d8790" strokeWidth="1" />
        </>
      )}
      {k === "takyr" && (
        <>
          <rect width="34" height="22" fill="#d7b486" />
          <path d="M0 8 L8 10 L12 0 M8 10 L14 18 L24 16 L28 4 M24 16 L26 22 M14 18 L12 22 M28 4 L34 6" fill="none" stroke="#6b4b2f" strokeWidth="1.1" />
        </>
      )}
    </svg>
  );
}

export function MapLegend({ layer }: { layer: MapLayer }) {
  if (layer === "soil") {
    return (
      <section aria-labelledby="legend-soil" className="rounded-2xl border border-line bg-paper/95 p-3 text-sm shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="legend-soil" className="font-semibold text-forest">
            Топырақ: {SOIL_SCHEME_TITLE}
          </h3>
          <Link href="/sources" className="text-xs font-medium text-forest underline underline-offset-2">
            Дереккөздер
          </Link>
        </div>
        <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {SOIL_ZONES.map((z) => (
            <li key={z.key} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-paper text-[11px] font-bold" style={{ borderColor: z.color }}>
                {z.mark}
              </span>
              <span className="h-4 w-6 shrink-0 rounded border border-black/10" style={{ background: z.color }} aria-hidden />
              <span>{z.name}</span>
            </li>
          ))}
          {SOIL_SYMBOLS.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <SymbolSwatch k={s.key} />
              <span>
                {s.name} <span className="text-muted">({s.desc})</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 rounded-xl bg-sand-2 px-3 py-2 text-[13px] leading-snug text-bark">{SOIL_SCHEME_DISCLAIMER}</p>
      </section>
    );
  }
  const items: Record<Exclude<MapLayer, "soil">, { title: string; text: string; marks: { el: React.ReactNode; label: string }[] }> = {
    water: {
      title: "Су нысандары",
      text: "Natural Earth (1:10m көлдер мен өзендер, 1:50m Каспий). Жағалау сызығы уақыт өте өзгереді, әсіресе Арал теңізінде.",
      marks: [
        { el: <span className="block h-1 w-7 rounded bg-[#3f86bd]" />, label: "Өзен" },
        { el: <span className="block h-4 w-7 rounded border border-[#4f8ab4] bg-[#8fc0de]" />, label: "Көл, теңіз" },
      ],
    },
    plants: {
      title: "Өсімдіктер",
      text: "Өсімдіктердің кеңістіктік таралу дерегі әлі қосылмаған — мәлімет толықтырылуда. Облысты таңдап, панельдегі тексерілген сипаттаманы және каталогтың бастапқы нұсқасын қараңыз.",
      marks: [],
    },
    schools: {
      title: "Мектептер",
      text: "Мектеп белгісі қала деңгейінде шамамен қойылған: нақты координат тексерілгеннен кейін жаңартылады.",
      marks: [
        { el: <span className="block h-5 w-5 rounded-full border border-dashed border-[#2f8a3a] bg-[#2f8a3a]/15" />, label: "Шамамен орналасу аймағы" },
      ],
    },
    research: {
      title: "Зерттеулер",
      text: "Координаты енгізілген топырақ үлгілері ғана нүкте ретінде көрсетіледі. Бір үлгі облыстың топырақ түсін өзгертпейді.",
      marks: [
        { el: <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2f8a3a] text-[10px] font-bold text-white">Ү</span>, label: "Пайдаланушы енгізген" },
        { el: <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-[#b7791f] bg-[#fff7e0] text-[10px] font-bold text-[#8a5a12]">Д</span>, label: "Демо үлгі" },
      ],
    },
  };
  const it = items[layer];
  return (
    <section className="rounded-2xl border border-line bg-paper/95 p-3 text-sm shadow-soft" aria-label={`Аңыз: ${it.title}`}>
      <h3 className="font-semibold text-forest">{it.title}</h3>
      {it.marks.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {it.marks.map((m) => (
            <li key={m.label} className="flex items-center gap-2">
              {m.el}
              {m.label}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1.5 text-[13px] text-muted">{it.text}</p>
    </section>
  );
}
