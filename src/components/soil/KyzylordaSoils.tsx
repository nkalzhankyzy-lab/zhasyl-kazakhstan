"use client";

import { ArrowRight, Droplets, Leaf, MapPin, Sprout, TestTube } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { KYZYLORDA_PLACES, KYZYLORDA_SOIL_SOURCE_IDS, SALINITY_LABEL, salinityFromEc, type LayerPattern, type SalinityLevel, type SoilPlace } from "@/data/kyzylorda-soils";
import type { KzoGeo } from "@/lib/geoKyzylorda";
import { KZO_H, KZO_W } from "@/lib/geoKyzylorda.shared";
import { SourceList } from "../SourceList";
import { Badge } from "../ui/Badge";

export const SALT_COLORS: Record<SalinityLevel, string> = { 0: "#5f8f4e", 1: "#b5a33a", 2: "#d98a2f", 3: "#c25a2c", 4: "#8e2c2c" };

const fmt = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
const TOP = 34;
const CM = 2.2;
const y = (cm: number) => TOP + cm * CM;

function Patterns({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={`${id}-salt`} width="14" height="12" patternUnits="userSpaceOnUse">
        <path d="M3 3l2-2 2 2-2 2zM10 8l1.5-1.5L13 8l-1.5 1.5z" fill="#ffffff" stroke="#d8d2c4" strokeWidth="0.4" />
      </pattern>
      <pattern id={`${id}-crust`} width="20" height="5" patternUnits="userSpaceOnUse">
        <path d="M0 2.5h20" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.8" />
      </pattern>
      <pattern id={`${id}-crack`} width="40" height="22" patternUnits="userSpaceOnUse">
        <path d="M0 4 L9 2 L14 10 L24 6 L31 12 L40 9 M14 10 L12 22 M31 12 L33 22" fill="none" stroke="#6e5638" strokeWidth="1.1" />
      </pattern>
      <pattern id={`${id}-sand`} width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.9" fill="#a7824c" />
        <circle cx="6" cy="5.5" r="0.7" fill="#fff3d6" />
      </pattern>
      <pattern id={`${id}-gypsum`} width="16" height="14" patternUnits="userSpaceOnUse">
        <path d="M3 3l3 5M11 6l-2 5M13 2l2 3" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
      </pattern>
      <pattern id={`${id}-roots`} width="26" height="30" patternUnits="userSpaceOnUse">
        <path d="M6 0c2 8-3 14 0 22M19 0c-2 6 3 10 1 18" fill="none" stroke="#2f2618" strokeOpacity="0.55" strokeWidth="0.9" />
      </pattern>
      <pattern id={`${id}-shells`} width="22" height="16" patternUnits="userSpaceOnUse">
        <path d="M3 9a3 3 0 0 1 6 0zM14 4a2.5 2.5 0 0 1 5 0z" fill="#efe9dc" stroke="#9a9283" strokeWidth="0.5" />
        <path d="M6 13l1.5-1.5L9 13" fill="none" stroke="#ffffff" strokeWidth="0.8" />
      </pattern>
      <pattern id={`${id}-gley`} width="24" height="20" patternUnits="userSpaceOnUse">
        <ellipse cx="6" cy="6" rx="4" ry="2" fill="#5f7d8c" fillOpacity="0.35" />
        <ellipse cx="17" cy="14" rx="3" ry="1.6" fill="#b5652d" fillOpacity="0.45" />
      </pattern>
      <pattern id={`${id}-layers`} width="30" height="9" patternUnits="userSpaceOnUse">
        <path d="M0 3h30" stroke="#000" strokeOpacity="0.14" strokeWidth="2" />
      </pattern>
    </defs>
  );
}

/** Топырақ кесіндісінің схемасы: қабаттар, грунт суы, тұздың көтерілуі және беттегі өсімдіктер */
export function SoilProfile({ place, active, onLayer }: { place: SoilPlace; active: number | null; onLayer: (i: number | null) => void }) {
  const id = useId().replace(/:/g, "");
  const W = 230;
  const H = y(120) + 4;
  const tufts = [5, 4, 3, 2, 1][place.salinity];
  return (
    <svg viewBox={`0 0 ${W + 44} ${H}`} className="h-auto w-full" role="img" aria-label={`${place.name}: топырақ кесіндісі, ${SALINITY_LABEL[place.salinity]}`}>
      <Patterns id={id} />
      {/* Аспан мен өсімдіктер */}
      <rect x="0" y="0" width={W} height={TOP} fill="#eef5f7" />
      {Array.from({ length: tufts }, (_, i) => {
        const x = 18 + (i * (W - 36)) / Math.max(1, tufts - 1 || 1);
        return (
          <g key={i} stroke="#4f7a3a" strokeWidth="1.6" strokeLinecap="round" fill="none">
            <path d={`M${x} ${TOP} q-3 -10 -8 -14 M${x} ${TOP} q0 -12 1 -18 M${x} ${TOP} q4 -9 9 -12`} />
          </g>
        );
      })}
      {/* Қабаттар */}
      {place.layers.map((l, i) => (
        <g key={l.name} onClick={() => onLayer(active === i ? null : i)} className="cursor-pointer">
          <rect x="0" y={y(l.from)} width={W} height={(l.to - l.from) * CM} fill={l.color} />
          {l.pattern !== "plain" && <rect x="0" y={y(l.from)} width={W} height={(l.to - l.from) * CM} fill={`url(#${id}-${l.pattern as Exclude<LayerPattern, "plain">})`} />}
          {active === i && <rect x="1" y={y(l.from) + 1} width={W - 2} height={(l.to - l.from) * CM - 2} fill="none" stroke="#1f4a2c" strokeWidth="2.5" />}
        </g>
      ))}
      {/* Беттегі ақ тұз қабығы */}
      {place.layers[0].pattern === "salt" && (
        <path
          d={`M0 ${TOP + 3} ${Array.from({ length: 23 }, (_, i) => `L${(i + 0.5) * 10} ${TOP - (i % 3 === 1 ? 5 : i % 2 ? 2 : 3.5)} L${(i + 1) * 10} ${TOP + 1}`).join(" ")} V${TOP + 4} H0z`}
          fill="#ffffff"
          stroke="#cfc8b8"
          strokeWidth="0.6"
          pointerEvents="none"
        />
      )}
      {/* Грунт суы мен тұздың капиллярмен көтерілуі */}
      {place.water !== null && (
        <g pointerEvents="none">
          <rect x="0" y={y(place.water)} width={W} height={H - y(place.water)} fill="#3b7fa3" fillOpacity="0.28" />
          <path d={`M0 ${y(place.water)} ${`q${W / 24} -4 ${W / 12} 0 `.repeat(12)}`} fill="none" stroke="#2a6b8f" strokeWidth="1.6" />
          {[0.22, 0.5, 0.78].map((f) => (
            <g key={f} stroke="#ffffff" strokeWidth="1.6" fill="#ffffff">
              <path d={`M${W * f} ${y(place.water!) - 6} V${TOP + 14}`} strokeDasharray="3 3" />
              <path d={`M${W * f - 4} ${TOP + 20} l4 -7 l4 7z`} stroke="none" />
            </g>
          ))}
          <text x={W / 2} y={y(place.water) + 14} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1d4f6b">
            Грунт суы ≈ {place.water} см
          </text>
        </g>
      )}
      {/* Тереңдік шкаласы */}
      <g fontSize="9" fill="#6b6457">
        {[0, 20, 40, 60, 80, 100, 120].map((cm) => (
          <g key={cm}>
            <path d={`M${W} ${y(cm)}h5`} stroke="#6b6457" />
            <text x={W + 8} y={y(cm) + 3}>
              {cm} см
            </text>
          </g>
        ))}
      </g>
      <rect x="0" y={TOP} width={W} height={H - TOP - 4} fill="none" stroke="#5c4a33" strokeOpacity="0.4" />
    </svg>
  );
}

function SaltScale({ level }: { level: SalinityLevel }) {
  return (
    <div>
      <div className="flex gap-1" aria-hidden>
        {([0, 1, 2, 3, 4] as SalinityLevel[]).map((l) => (
          <span key={l} className={`h-2.5 flex-1 rounded-full ${l <= level ? "" : "opacity-20"}`} style={{ background: SALT_COLORS[l] }} />
        ))}
      </div>
      <p className="mt-1 text-sm font-semibold" style={{ color: SALT_COLORS[level] }}>
        {SALINITY_LABEL[level]}
      </p>
    </div>
  );
}

function PlaceInfo({ place, active, setActive, compact }: { place: SoilPlace; active: number | null; setActive: (i: number | null) => void; compact?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{place.soil}</p>
        <h3 className="font-serif text-xl font-bold text-forest">{place.name}</h3>
      </div>
      <SaltScale level={place.salinity} />
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-mint/70 px-2.5 py-1.5">
          <dt className="text-xs text-muted">ЭӨ (1:5)</dt>
          <dd className="font-semibold">
            {fmt(place.ec[0])}–{fmt(place.ec[1])} <span className="text-xs font-normal">мСм/см</span>
          </dd>
        </div>
        <div className="rounded-xl bg-mint/70 px-2.5 py-1.5">
          <dt className="text-xs text-muted">pH</dt>
          <dd className="font-semibold">
            {fmt(place.ph[0])}–{fmt(place.ph[1])}
          </dd>
        </div>
        <div className="rounded-xl bg-mint/70 px-2.5 py-1.5">
          <dt className="text-xs text-muted">Грунт суы</dt>
          <dd className="font-semibold">{place.water !== null ? `≈ ${fmt(place.water / 100)} м` : "> 1,2 м"}</dd>
        </div>
      </dl>
      <ul className="flex flex-col gap-1.5 text-sm">
        {place.layers.map((l, i) => (
          <li key={l.name}>
            <button
              type="button"
              onClick={() => setActive(active === i ? null : i)}
              aria-pressed={active === i}
              className={`flex w-full items-start gap-2 rounded-xl border px-2.5 py-1.5 text-left transition ${active === i ? "border-forest bg-mint" : "border-line bg-white hover:bg-mint/60"}`}
            >
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-black/15" style={{ background: l.color }} aria-hidden />
              <span className="min-w-0">
                <span className="font-semibold text-forest">
                  {l.name} <span className="font-normal text-muted">· {l.from}–{l.to} см</span>
                </span>
                {active === i && <span className="mt-0.5 block text-[13px] text-ink/80">{l.text}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!compact && (
        <>
          <p className="text-[15px] leading-relaxed">
            <b>Неге осындай? </b>
            {place.why}
          </p>
          <p className="flex flex-wrap items-center gap-1.5 text-sm">
            <Sprout size={16} className="text-leaf" aria-hidden />
            <b>Өсімдіктер:</b> {place.plants.join(", ")}
          </p>
          <p className="flex items-start gap-1.5 rounded-xl bg-sand-2/60 px-3 py-2 text-sm text-bark">
            <Leaf size={16} className="mt-0.5 shrink-0" aria-hidden />
            {place.tip}
          </p>
        </>
      )}
    </div>
  );
}

function KzoMap({ geo, sel, onSel }: { geo: KzoGeo; sel: string; onSel: (id: string) => void }) {
  return (
    <svg viewBox={`0 0 ${KZO_W} ${KZO_H}`} className="h-auto w-full rounded-2xl bg-[#f3ecdf]" role="group" aria-label="Қызылорда облысының картасы: топырақ нүктелері">
      <path d={geo.neighbours} fill="#efe6d4" stroke="#d3c6ac" strokeWidth="0.8" />
      <path d={geo.region} fill="#e9d3a6" stroke="#2f6b3a" strokeWidth="2" />
      {geo.lakes.map((l) => (
        <path key={l.name} d={l.d} fill="#9cc8dc" stroke="#6aa6c2" strokeWidth="0.8" />
      ))}
      <path d={geo.river} fill="none" stroke="#4f97bd" strokeWidth="2.2" strokeLinecap="round" />
      {geo.towns.map((t) => (
        <g key={t.name} pointerEvents="none">
          <circle cx={t.xy[0]} cy={t.xy[1]} r={t.main ? 4.5 : 3} fill="#1f4a2c" stroke="#fff" strokeWidth="1.2" />
          <text x={t.xy[0] + 6} y={t.xy[1] - 5} fontSize={t.main ? 13 : 11} fontWeight={t.main ? 700 : 500} fill="#1f3a26" paintOrder="stroke" stroke="#fffaf0" strokeWidth="3">
            {t.name}
          </text>
        </g>
      ))}
      {KYZYLORDA_PLACES.map((p, i) => {
        const [cx, cy] = geo.places[p.id];
        const on = p.id === sel;
        return (
          <g
            key={p.id}
            role="button"
            tabIndex={0}
            aria-pressed={on}
            aria-label={`${p.name}: ${SALINITY_LABEL[p.salinity]}`}
            onClick={() => onSel(p.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSel(p.id))}
            className="cursor-pointer outline-none"
          >
            {on && <circle cx={cx} cy={cy} r="19" fill={SALT_COLORS[p.salinity]} fillOpacity="0.25" />}
            <circle cx={cx} cy={cy} r={on ? 13 : 11} fill={SALT_COLORS[p.salinity]} stroke="#fff" strokeWidth={on ? 3 : 2} />
            <text x={cx} y={cy + 4.5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" pointerEvents="none">
              {i + 1}
            </text>
          </g>
        );
      })}
      <text x={KZO_W - 16} y={KZO_H - 12} textAnchor="end" fontSize="10" fill="#7a705f">
        Шекаралар: amCharts geodata · нүктелер шамамен
      </text>
    </svg>
  );
}

function EcCheck() {
  const [v, setV] = useState("");
  const [unit, setUnit] = useState<"mS" | "uS">("mS");
  const n = Number(v.replace(",", "."));
  const ec = v.trim() && Number.isFinite(n) && n >= 0 ? (unit === "uS" ? n / 1000 : n) : null;
  const level = ec !== null ? salinityFromEc(ec) : null;
  const like = ec !== null ? KYZYLORDA_PLACES.filter((p) => ec >= p.ec[0] * 0.8 && ec <= p.ec[1] * 1.2) : [];
  return (
    <section aria-labelledby="ec-check" className="card flex flex-col gap-3 p-4 sm:p-5">
      <h3 id="ec-check" className="flex items-center gap-2 font-serif text-xl font-bold text-forest">
        <TestTube size={20} aria-hidden /> Өз үлгіңді салыстыр
      </h3>
      <p className="text-sm text-muted">Зертханада 1:5 топырақ сүзіндісінің ЭӨ-сін өлшеп, мәнін жазыңыз. Сайт тұздылық деңгейін және облыстың қай жеріне ұқсайтынын көрсетеді.</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-muted">
          ЭӨ мәні
          <input className="input mt-1 !min-h-10 w-32" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder="мыс. 1,2" />
        </label>
        <label className="text-xs text-muted">
          Бірлігі
          <select className="input mt-1 !min-h-10" value={unit} onChange={(e) => setUnit(e.target.value as "mS" | "uS")}>
            <option value="mS">мСм/см</option>
            <option value="uS">мкСм/см</option>
          </select>
        </label>
      </div>
      {level !== null && ec !== null && (
        <div className="flex flex-col gap-2">
          {unit === "uS" && <p className="text-sm text-muted">{fmt(n)} мкСм/см = {fmt(ec)} мСм/см</p>}
          <SaltScale level={level} />
          <p className="text-sm">{like.length ? <>Ұқсас жерлер: <b>{like.map((p) => p.short).join(", ")}</b>.</> : "Бұл мән кестедегі жерлердің ешқайсысына дәл келмейді."}</p>
        </div>
      )}
      <p className="text-xs text-muted">Деңгейлер шамамен, саздақ топыраққа арналған бағдар. Құмды топырақта бірдей ЭӨ күштірек тұздануды білдіреді.</p>
    </section>
  );
}

/** Қызылорда облысының топырағы: жерді таңдасаң, кесінді мен тұздылық өзгереді */
export function KyzylordaSoils({ geo, compact }: { geo?: KzoGeo; compact?: boolean }) {
  const [sel, setSel] = useState(KYZYLORDA_PLACES[0].id);
  const [active, setActive] = useState<number | null>(null);
  const place = KYZYLORDA_PLACES.find((p) => p.id === sel)!;
  const choose = (id: string) => {
    setSel(id);
    setActive(null);
  };
  const chips = (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Жерді таңдау">
      {KYZYLORDA_PLACES.map((p, i) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={p.id === sel}
          onClick={() => choose(p.id)}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 text-sm font-semibold ${p.id === sel ? "border-forest bg-forest text-white" : "border-line bg-white hover:bg-mint"}`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-white" style={{ background: SALT_COLORS[p.salinity] }}>
            {i + 1}
          </span>
          {p.short}
        </button>
      ))}
    </div>
  );

  if (compact)
    return (
      <section aria-labelledby="kzo-soil-compact" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id="kzo-soil-compact" className="font-serif text-lg font-bold text-forest">
            Топырақ кесіндісі: жер-жерде
          </h3>
          <Badge tone="illustration">Оқу моделі</Badge>
        </div>
        {chips}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-3">
          <SoilProfile place={place} active={active} onLayer={setActive} />
          <PlaceInfo place={place} active={active} setActive={setActive} compact />
        </div>
        <Link href="/topyraq" className="btn btn-soft !min-h-10 self-start">
          <MapPin size={16} aria-hidden /> Қызылорда топырағы картасы <ArrowRight size={16} aria-hidden />
        </Link>
      </section>
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="card flex min-w-0 flex-col gap-3 p-3 sm:p-4">
          {geo && <KzoMap geo={geo} sel={sel} onSel={choose} />}
          {chips}
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted" aria-label="Тұздылық белгілері">
            {([0, 1, 2, 3, 4] as SalinityLevel[]).map((l) => (
              <li key={l} className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full" style={{ background: SALT_COLORS[l] }} aria-hidden />
                {SALINITY_LABEL[l]}
              </li>
            ))}
            <li className="flex items-center gap-1">
              <Droplets size={13} className="text-[#2a6b8f]" aria-hidden /> ақ жебе — тұздың грунт суымен көтерілуі
            </li>
          </ul>
        </div>
        <div className="card grid min-w-0 grid-cols-1 items-start gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <SoilProfile place={place} active={active} onLayer={setActive} />
          <PlaceInfo place={place} active={active} setActive={setActive} />
        </div>
      </div>
      <EcCheck />
      <div className="rounded-2xl bg-sand-2/50 px-4 py-3 text-sm text-bark">
        <p>
          Бұл ресми топырақ картасы емес. Қабат қалыңдығы, ЭӨ мен pH — оқу мақсатында жалпыланған типтік мәндер; нақты жерде өзгереді. Нүктелердің орны шамамен көрсетілген.
        </p>
        <SourceList ids={KYZYLORDA_SOIL_SOURCE_IDS} className="mt-1" />
      </div>
    </div>
  );
}
