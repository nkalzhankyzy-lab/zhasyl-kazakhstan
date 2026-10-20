"use client";

import { AlertTriangle, CheckCircle2, Info, QrCode } from "lucide-react";
import { useState } from "react";
import { parseOptionalNumber } from "@/lib/metrics";
import { AskAi } from "../ai/AskAi";
import { absHumidity, co2At } from "../school/Co2Estimator";
import { Dialog } from "../ui/Dialog";

const PLACES = ["Сынып", "Акт залы", "Үй бөлмесі", "Кеңсе"] as const;
const WINDOWS = [
  { id: "closed", label: "Терезе мен есік жабық", ach: 0.5 },
  { id: "vent", label: "Форточка ашық", ach: 2 },
  { id: "open", label: "Терезе кең ашық", ach: 5 },
] as const;
type WinId = (typeof WINDOWS)[number]["id"];

const CO2_L_H = 18; // бір адам, л/сағ (отырған ересек/жасөспірім, шамамен)
const WATER_G_H = 40; // бір адам, г/сағ су буы (шамамен)

const fmt = (n: number, d = 0) => n.toLocaleString("ru-RU", { maximumFractionDigits: d, minimumFractionDigits: d });

type Tone = "good" | "warn" | "info";
interface Tip {
  tone: Tone;
  text: string;
}

/** CO₂ 1000 ppm-ге қанша минутта жетеді (жетпесе null) */
function minutesTo(limit: number, p: { n: number; v: number; c0: number; ach: number }) {
  if (p.c0 >= limit) return 0;
  for (let m = 1; m <= 600; m++) if (co2At(m / 60, { ...p, g: CO2_L_H }) >= limit) return m;
  return null;
}

function Field({ id, label, value, onChange, hint, suffix }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string; suffix?: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <input id={id} inputMode="decimal" className="input w-full" value={value} onChange={(e) => onChange(e.target.value)} />
        {suffix && <span className="shrink-0 text-sm text-muted">{suffix}</span>}
      </div>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function RoomCheck({ qrSrc }: { qrSrc: string }) {
  const [place, setPlace] = useState<(typeof PLACES)[number]>("Сынып");
  const [win, setWin] = useState<WinId>("closed");
  const [f, setF] = useState({ a: "8", b: "6", h: "3", n: "25", plants: "3", min: "45", t1: "", rh1: "", t2: "", rh2: "", co2: "" });
  const [qr, setQr] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const num = (k: keyof typeof f) => parseOptionalNumber(f[k]);

  const a = num("a"), b = num("b"), h = num("h"), n = num("n"), plants = num("plants"), min = num("min");
  const t1 = num("t1"), rh1 = num("rh1"), t2 = num("t2"), rh2 = num("rh2"), co2m = num("co2");
  const ok = (x: number | null): x is number => x !== null && Number.isFinite(x) && x > 0;
  const valid = ok(a) && ok(b) && ok(h) && ok(n) && ok(min);
  const ach = WINDOWS.find((w) => w.id === win)!.ach;

  let result: null | {
    area: number;
    v: number;
    perArea: number;
    perVol: number;
    co2End: number;
    to1000: number | null;
    humCo2: number | null;
    plantsPer10: number;
    rhNow: number | null;
    tips: Tip[];
  } = null;

  if (valid) {
    const area = a * b;
    const v = area * h;
    const c0 = 420;
    const t = min / 60;
    const co2End = co2At(t, { n, g: CO2_L_H, v, c0, ach });
    const to1000 = minutesTo(1000, { n, v, c0, ach });
    let humCo2: number | null = null;
    if ([t1, rh1, t2, rh2].every((x) => x !== null && Number.isFinite(x))) {
      const added = (absHumidity(t2!, rh2!) - absHumidity(t1!, rh1!)) * v;
      const expected = n * WATER_G_H * t;
      if (added > 0) humCo2 = c0 + Math.min(added / expected, 1) * co2At(t, { n, g: CO2_L_H, v, c0: 0, ach: 0 });
    }
    const rhNow = rh2 !== null && Number.isFinite(rh2) ? rh2 : rh1 !== null && Number.isFinite(rh1) ? rh1 : null;
    const plantsPer10 = ok(plants) ? (plants / area) * 10 : 0;
    const perArea = area / n;
    const tips: Tip[] = [];
    const final = co2m ?? humCo2 ?? co2End;
    if (final > 1000)
      tips.push({
        tone: "warn",
        text: `${fmt(min)} минуттан кейін CO₂ шамамен ${fmt(final)} ppm болады — 1000 ppm-нен жоғары. ${to1000 !== null ? `Шамамен әр ${Math.max(5, Math.floor(to1000))} минут сайын` : "Үзіліс сайын"} 5–10 минут желдетіңіз. 1000 ppm кезінде шешім қабылдау тестінің нәтижесі төмендеген (Satish, 2012).`,
      });
    else tips.push({ tone: "good", text: `${fmt(min)} минут ішінде CO₂ шамамен ${fmt(final)} ppm-ге дейін көтеріледі. Бұл 1000 ppm-нен төмен, ауа жеткілікті.` });
    if (perArea < 2.5) tips.push({ tone: "warn", text: `Бір адамға ${fmt(perArea, 1)} м² келеді. Сынып үшін жиі қолданылатын бағдар — бір оқушыға кемінде 2,5 м². Бөлме бұл адам санына тар.` });
    else tips.push({ tone: "good", text: `Бір адамға ${fmt(perArea, 1)} м² келеді — бұл 2,5 м² бағдарынан көп.` });
    if (rhNow !== null) {
      if (rhNow < 40) tips.push({ tone: "warn", text: `Ылғалдылық ${fmt(rhNow)}% — ауа құрғақ. 40–60% ең қолайлы деп саналады (Arundel және т.б., 1986). Спатифиллум, хлорофитум сияқты ылғал бөлетін гүлдер қосып, суаруды жүйелі етіңіз.` });
      else if (rhNow > 60) tips.push({ tone: "warn", text: `Ылғалдылық ${fmt(rhNow)}% — тым ылғал. Жиірек желдетіңіз, саңырауқұлақ пайда болмауын бақылаңыз.` });
      else tips.push({ tone: "good", text: `Ылғалдылық ${fmt(rhNow)}% — 40–60% қолайлы аралықта.` });
    }
    if (plantsPer10 < 1)
      tips.push({ tone: "info", text: `Гүл аз: 10 м²-ге ${fmt(plantsPer10, 1)} гүл. Тағы ${Math.max(1, Math.ceil(area / 10 - (plants ?? 0)))} гүл қосуға болады. Гүл CO₂-ні айтарлықтай азайтпайды (Cummings & Waring, 2019), бірақ көңіл-күй мен ылғалдылыққа пайдалы.` });
    else tips.push({ tone: "info", text: `10 м²-ге ${fmt(plantsPer10, 1)} гүл келеді. Есіңізде болсын: гүл CO₂-ні азайтпайды, ауаны желдету тазартады (Cummings & Waring, 2019).` });
    result = { area, v, perArea, perVol: v / n, co2End, to1000, humCo2, plantsPer10, rhNow, tips };
  }

  const context = result
    ? [
        `ТЕКСЕРІЛГЕН ОРЫН: ${place}. Өлшемі ${a}×${b}×${h} м (аудан ${fmt(result.area, 1)} м², көлем ${fmt(result.v)} м³). Адам саны ${n}, ұзақтығы ${min} мин, ${WINDOWS.find((w) => w.id === win)!.label}. Гүл саны ${plants ?? 0}.`,
        `Бір адамға ${fmt(result.perArea, 1)} м², ${fmt(result.perVol, 1)} м³.`,
        `CO₂ модель бойынша соңында ≈ ${fmt(result.co2End)} ppm; 1000 ppm-ге ${result.to1000 === null ? "жетпейді" : `≈ ${result.to1000} минутта жетеді`}.`,
        result.humCo2 !== null ? `Ылғалдылық арқылы бағаланған CO₂ ≈ ${fmt(result.humCo2)} ppm (T ${t1}→${t2} °C, RH ${rh1}→${rh2}%).` : "",
        co2m ? `CO₂ өлшегіш көрсеткіші: ${co2m} ppm.` : "",
        result.rhNow !== null ? `Қазіргі ылғалдылық ${result.rhNow}%.` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const toneCls: Record<Tone, string> = {
    good: "bg-mint text-forest",
    warn: "bg-orange-50 text-orange-950",
    info: "bg-sky-50 text-sky-950",
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section aria-labelledby="in-title" className="card flex min-w-0 flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="in-title" className="font-serif text-xl font-bold text-forest">
            Бөлме туралы
          </h2>
          <button type="button" className="btn btn-ghost !min-h-10" onClick={() => setQr(true)}>
            <QrCode size={18} aria-hidden /> QR-кодты көрсету
          </button>
        </div>
        <div role="radiogroup" aria-label="Орын" className="flex flex-wrap gap-1">
          {PLACES.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={place === p}
              onClick={() => setPlace(p)}
              className={`min-h-10 rounded-xl border px-3 text-sm font-semibold ${place === p ? "border-forest bg-forest text-white" : "border-line bg-white hover:bg-mint"}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field id="a" label="Ұзындығы" value={f.a} onChange={set("a")} suffix="м" />
          <Field id="b" label="Ені" value={f.b} onChange={set("b")} suffix="м" />
          <Field id="h" label="Биіктігі" value={f.h} onChange={set("h")} suffix="м" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field id="n" label="Адам саны" value={f.n} onChange={set("n")} />
          <Field id="plants" label="Гүл саны" value={f.plants} onChange={set("plants")} />
          <Field id="min" label="Ұзақтығы" value={f.min} onChange={set("min")} suffix="мин" />
        </div>
        <fieldset>
          <legend className="field-label">Желдету</legend>
          <div className="flex flex-col gap-1.5">
            {WINDOWS.map((w) => (
              <label key={w.id} className="flex items-center gap-2 text-[15px]">
                <input type="radio" name="win" className="h-4 w-4 accent-forest" checked={win === w.id} onChange={() => setWin(w.id)} />
                {w.label}
              </label>
            ))}
          </div>
        </fieldset>
        <details className="rounded-xl bg-paper px-3 py-2 ring-1 ring-line" open>
          <summary className="cursor-pointer font-semibold">Термогигрометр көрсеткіші (міндетті емес)</summary>
          <p className="mt-1 text-xs text-muted">Залда экрандағы TA318 мәнін, үйде өз құралыңыздың мәнін жазыңыз. Басы мен соңын жазсаңыз, CO₂ ылғалдылық арқылы да бағаланады.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field id="t1" label="Басында, °C" value={f.t1} onChange={set("t1")} />
            <Field id="rh1" label="Басында, %" value={f.rh1} onChange={set("rh1")} />
            <Field id="t2" label="Соңында, °C" value={f.t2} onChange={set("t2")} />
            <Field id="rh2" label="Соңында, %" value={f.rh2} onChange={set("rh2")} />
          </div>
          <div className="mt-2">
            <Field id="co2" label="CO₂ өлшегіш болса, ppm" value={f.co2} onChange={set("co2")} />
          </div>
        </details>
      </section>

      <section aria-labelledby="out-title" aria-live="polite" className="card flex min-w-0 flex-col gap-3 p-4 sm:p-5">
        <h2 id="out-title" className="font-serif text-xl font-bold text-forest">
          Нәтиже
        </h2>
        {!result ? (
          <p className="text-muted">Бөлменің өлшемін, адам санын және ұзақтығын толтырыңыз.</p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-line">
                <dt className="text-xs text-muted">Көлемі</dt>
                <dd className="text-lg font-bold">{fmt(result.v)} м³</dd>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-line">
                <dt className="text-xs text-muted">Бір адамға</dt>
                <dd className="text-lg font-bold">{fmt(result.perArea, 1)} м²</dd>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-line">
                <dt className="text-xs text-muted">CO₂ соңында (баға)</dt>
                <dd className={`text-lg font-bold ${(co2m ?? result.humCo2 ?? result.co2End) > 1000 ? "text-orange-700" : "text-forest"}`}>
                  ≈ {fmt(co2m ?? result.humCo2 ?? result.co2End)} ppm
                </dd>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-line">
                <dt className="text-xs text-muted">1000 ppm-ге дейін</dt>
                <dd className="text-lg font-bold">{result.to1000 === null ? "жетпейді" : `≈ ${result.to1000} мин`}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted">
              {co2m
                ? "CO₂ өлшегіш көрсеткіші қолданылды."
                : result.humCo2 !== null
                  ? `CO₂ ылғалдылық арқылы бағаланды. Көлем мен желдету моделі бойынша: ≈ ${fmt(result.co2End)} ppm.`
                  : "CO₂ бөлме көлемі, адам саны және желдету арқылы бағаланды (басында 420 ppm деп алынды). Бұл өлшем емес, шамамен баға."}
            </p>
            <ul className="flex flex-col gap-2">
              {result.tips.map((t, i) => (
                <li key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-[15px] ${toneCls[t.tone]}`}>
                  {t.tone === "good" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden /> : t.tone === "warn" ? <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden /> : <Info size={18} className="mt-0.5 shrink-0" aria-hidden />}
                  <span>{t.text}</span>
                </li>
              ))}
            </ul>
            <AskAi
              label="ЖИ кеңесі"
              question={`Мен ${place.toLowerCase()} ауасын тексердім. Деректерге қарап: 1) бөлме осы адам санына жарай ма; 2) қанша минут сайын желдету керек; 3) гүл мен ылғалдылық бойынша не істеу керек. Әлемдік зерттеулерге (Автор, жыл) түрінде сілте. 5–6 сөйлеммен жаз.`}
              context={context}
            />
          </>
        )}
      </section>

      <Dialog open={qr} onClose={() => setQr(false)} title="Телефонмен сканерлеңіз" size="lg">
        <div className="flex flex-col items-center gap-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="«Өз бөлмеңді тексер» бетінің QR-коды" className="aspect-square w-full max-w-[420px] rounded-2xl bg-white p-3 ring-1 ring-line" />
          <p className="text-center text-lg font-semibold text-forest">zhasyl-kazakhstan-bfkx.vercel.app/tekser</p>
          <p className="text-center text-sm text-muted">Нәтиже тек сіздің телефоныңызда көрінеді, сайттың деректері өзгермейді.</p>
        </div>
      </Dialog>
    </div>
  );
}
