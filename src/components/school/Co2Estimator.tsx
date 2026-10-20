"use client";

import { Calculator, Info } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { parseOptionalNumber } from "@/lib/metrics";

/** Желдету: сағатына ауаның неше рет толық алмасатыны (λ, рет/сағ) */
const VENT = [
  { id: "sealed", label: "Мүлдем жабық (ауа алмаспайды)", ach: 0 },
  { id: "closed", label: "Жабық, саңылаулар бар", ach: 0.5 },
  { id: "vent", label: "Форточка ашық", ach: 2 },
  { id: "open", label: "Терезе толық ашық", ach: 5 },
] as const;

const OUTDOOR = 420;
const LIMIT = 1000;

const fmt = (n: number, d = 0) => n.toLocaleString("ru-RU", { maximumFractionDigits: d });

/**
 * Массалық баланс: C(t) = C₀·e^(−λt) + C_сырт·(1 − e^(−λt)) + S/(λV)·(1 − e^(−λt)),
 * S = N·G·1000 (ppm·м³/сағ). λ = 0 болса: C(t) = C₀ + S·t/V.
 */
export function co2At(tHours: number, p: { n: number; g: number; v: number; c0: number; ach: number }) {
  const s = p.n * p.g * 1000;
  if (p.ach === 0) return p.c0 + (s * tHours) / p.v;
  const k = Math.exp(-p.ach * tHours);
  return p.c0 * k + (OUTDOOR + s / (p.ach * p.v)) * (1 - k);
}

export function Co2Estimator() {
  const [f, setF] = useState({ n: "25", g: "18", a: "6", b: "10", h: "3", min: "45", c0: "420", measured: "" });
  const [vent, setVent] = useState<(typeof VENT)[number]["id"]>("sealed");
  const ach = VENT.find((x) => x.id === vent)!.ach;

  const nums = {
    n: parseOptionalNumber(f.n),
    g: parseOptionalNumber(f.g),
    a: parseOptionalNumber(f.a),
    b: parseOptionalNumber(f.b),
    h: parseOptionalNumber(f.h),
    min: parseOptionalNumber(f.min),
    c0: parseOptionalNumber(f.c0),
  };
  const measured = parseOptionalNumber(f.measured);
  const bad = Object.values(nums).some((x) => x === null || Number.isNaN(x) || x <= 0) || (measured !== null && (Number.isNaN(measured) || measured <= 0));
  const tooBig = !bad && (nums.n! > 200 || nums.min! > 600 || nums.a! * nums.b! * nums.h! > 5000);

  const calc = useMemo(() => {
    if (bad || tooBig) return null;
    const v = nums.a! * nums.b! * nums.h!;
    const p = { n: nums.n!, g: nums.g!, v, c0: nums.c0!, ach };
    const step = nums.min! <= 60 ? 5 : 10;
    const data: { t: number; c: number }[] = [];
    for (let t = 0; t <= nums.min!; t += step) data.push({ t, c: Math.round(co2At(t / 60, p)) });
    if (data[data.length - 1].t !== nums.min!) data.push({ t: nums.min!, c: Math.round(co2At(nums.min! / 60, p)) });
    const end = co2At(nums.min! / 60, p);
    let reach: number | null = null;
    if (p.c0 < LIMIT) {
      for (let t = 1; t <= nums.min!; t++) {
        if (co2At(t / 60, p) >= LIMIT) {
          reach = t;
          break;
        }
      }
    }
    const steady = ach > 0 ? OUTDOOR + (p.n * p.g * 1000) / (ach * v) : null;
    return { v, data, end, reach, steady };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, ach]);

  const field = (k: keyof typeof f, label: string, hint?: string) => (
    <label className="text-xs text-muted">
      {label}
      <input
        className="input mt-1 !min-h-10"
        inputMode="decimal"
        value={f[k]}
        placeholder={hint}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
      />
    </label>
  );

  return (
    <section aria-labelledby="co2calc-title" className="card mt-2 flex flex-col gap-4 p-5">
      <div>
        <h3 id="co2calc-title" className="flex items-center gap-2 font-serif text-xl font-bold text-forest">
          <Calculator size={20} aria-hidden /> CO₂ есептегіші: сабақта CO₂ қанша өседі?
        </h3>
        <p className="mt-1 text-sm text-muted">
          Бұл — өлшем емес, болжам. Оқушылардың демімен шығатын CO₂ мөлшерін сынып көлеміне бөліп есептейміз. Нәтижені CO₂ өлшегішінің көрсеткішімен салыстырыңыз.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {field("n", "Сыныптағы адам саны")}
        {field("g", "Бір адам шығаратын CO₂, л/сағ")}
        {field("min", "Уақыт, минут")}
        {field("c0", "Басындағы CO₂, ppm")}
        {field("a", "Сынып ені, м")}
        {field("b", "Сынып ұзындығы, м")}
        {field("h", "Биіктігі, м")}
        {field("measured", "Өлшенген CO₂ (соңында), ppm", "міндетті емес")}
      </div>

      <label className="text-xs text-muted">
        Желдету
        <select className="input mt-1 !min-h-10" value={vent} onChange={(e) => setVent(e.target.value as typeof vent)}>
          {VENT.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </select>
      </label>

      {bad ? (
        <p className="text-sm text-alert" role="alert">Барлық өрісте нөлден үлкен сан болуы керек.</p>
      ) : tooBig ? (
        <p className="text-sm text-alert" role="alert">Мәндер тым үлкен: сынып өлшемін, адам санын және уақытты тексеріңіз.</p>
      ) : calc ? (
        <>
          <div className="grid gap-2 sm:grid-cols-3" aria-live="polite">
            <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-line">
              <p className="text-xs text-muted">Сынып көлемі</p>
              <p className="text-lg font-semibold">{fmt(calc.v, 1)} м³</p>
            </div>
            <div className={`rounded-xl px-3 py-2 ring-1 ${calc.end >= LIMIT ? "bg-orange-50 ring-orange-200" : "bg-white ring-line"}`}>
              <p className="text-xs text-muted">{fmt(nums.min!)} минуттан кейін (болжам)</p>
              <p className="text-lg font-semibold">≈ {fmt(Math.round(calc.end / 10) * 10)} ppm</p>
            </div>
            <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-line">
              <p className="text-xs text-muted">1 000 ppm-ге жетеді</p>
              <p className="text-lg font-semibold">
                {nums.c0! >= LIMIT ? "басында асып тұр" : calc.reach !== null ? `≈ ${fmt(calc.reach)}-минутта` : "бұл уақытта жетпейді"}
              </p>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calc.data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="#e2d8c0" strokeDasharray="3 3" />
                <XAxis dataKey="t" tick={{ fontSize: 12, fill: "#56634f" }} tickFormatter={(t) => `${t} мин`} />
                <YAxis tick={{ fontSize: 12, fill: "#56634f" }} width={52} domain={[(min: number) => Math.min(400, Math.floor(min / 100) * 100), "auto"]} />
                <Tooltip formatter={(v) => [`${fmt(Number(v))} ppm`, "CO₂ (болжам)"]} labelFormatter={(t) => `${t}-минут`} />
                <ReferenceLine y={LIMIT} stroke="#c2410c" strokeDasharray="4 4" label={{ value: "1 000 ppm — желдету керек", position: "insideTopLeft", fontSize: 12, fill: "#9a3412" }} />
                <Line type="monotone" dataKey="c" stroke="#2c6239" strokeWidth={2.5} dot={{ r: 3, fill: "#2c6239" }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {measured !== null && !Number.isNaN(measured) && (
            <p className="rounded-xl bg-mint/60 px-3 py-2 text-[15px]">
              <b>Салыстыру:</b> өлшенгені {fmt(measured)} ppm, болжам ≈ {fmt(Math.round(calc.end))} ppm. Айырмасы{" "}
              {fmt(Math.abs(measured - calc.end))} ppm ({fmt((Math.abs(measured - calc.end) / measured) * 100)}%).{" "}
              {measured < calc.end
                ? "Өлшенгені аз: ауа болжағаннан көбірек алмасқан (саңылаулар, есік ашылған) болуы мүмкін."
                : "Өлшенгені көп: адам көбірек болған, белсенді қозғалған немесе ауа аз алмасқан болуы мүмкін."}
            </p>
          )}

          <HumidityCheck n={nums.n!} min={nums.min!} v={calc.v} c0={nums.c0!} sealedRise={co2At(nums.min! / 60, { n: nums.n!, g: nums.g!, v: calc.v, c0: 0, ach: 0 })} />

          <p className="rounded-xl bg-sand-2/60 px-3 py-2 text-sm text-bark">
            <b>Математика:</b>{" "}
            {ach === 0 ? (
              <>
                ΔCO₂ = N × G × t ÷ V × 1000 = {fmt(nums.n!)} × {fmt(nums.g!, 1)} × {fmt(nums.min! / 60, 2)} ÷ {fmt(calc.v, 1)} × 1000 ≈{" "}
                <b>{fmt(calc.end - nums.c0!)} ppm</b>. Соңында: {fmt(nums.c0!)} + {fmt(calc.end - nums.c0!)} ≈ {fmt(calc.end)} ppm.
              </>
            ) : (
              <>
                Ауа алмасқанда CO₂ шексіз өспейді, тепе-теңдік деңгейіне жақындайды: C = 420 + N × G × 1000 ÷ (λ × V) = 420 + {fmt(nums.n!)} × {fmt(nums.g!, 1)} × 1000 ÷ ({fmt(ach, 1)} × {fmt(calc.v, 1)}) ≈{" "}
                <b>{fmt(calc.steady!)} ppm</b>. Мұнда λ — сағатына ауаның неше рет алмасатыны.
              </>
            )}
          </p>
          <p className="flex items-start gap-2 text-xs text-muted">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
            G ≈ 18 л/сағ — отырған жасөспірімнің орташа мәні; кіші сынып оқушыларында азырақ, қозғалыста көбірек. Желдету мәндері (λ) шамамен алынған. CO₂-ні ылғалдылықтан немесе температурадан есептеуге болмайды.
          </p>
        </>
      ) : null}
    </section>
  );
}

/** Абсолют ылғалдылық, г/м³ (Магнус формуласы) */
export function absHumidity(t: number, rh: number) {
  const es = 6.112 * Math.exp((17.67 * t) / (t + 243.5)); // гПа
  return (es * rh * 2.1674) / (273.15 + t);
}

const WATER_PER_PERSON = 40; // г/сағ, отырған адамның дем мен терімен шығаратын су буы (шамамен)

function HumidityCheck({ n, min, v, c0, sealedRise }: { n: number; min: number; v: number; c0: number; sealedRise: number }) {
  const [h, setH] = useState({ t1: "", rh1: "", t2: "", rh2: "" });
  const t1 = parseOptionalNumber(h.t1);
  const rh1 = parseOptionalNumber(h.rh1);
  const t2 = parseOptionalNumber(h.t2);
  const rh2 = parseOptionalNumber(h.rh2);
  const all = [t1, rh1, t2, rh2];
  const filled = all.every((x) => x !== null);
  const invalid = filled && (all.some((x) => Number.isNaN(x)) || [rh1!, rh2!].some((x) => x < 1 || x > 100) || [t1!, t2!].some((x) => x < -10 || x > 50));

  let body: ReactNode = <span className="text-muted">Сабақ басындағы және соңындағы температура мен ылғалдылықты енгізіңіз (TA318 сияқты термогигрометрден).</span>;
  if (invalid) body = <span className="text-alert">Температура −10…50 °C, ылғалдылық 1…100% аралығында болуы керек.</span>;
  else if (filled) {
    const a1 = absHumidity(t1!, rh1!);
    const a2 = absHumidity(t2!, rh2!);
    const added = (a2 - a1) * v; // г
    const expected = n * WATER_PER_PERSON * (min / 60); // г, ауа мүлдем алмаспаса
    if (added <= 0) {
      body = (
        <>
          Ауадағы су буы: {fmt(a1, 1)} → {fmt(a2, 1)} г/м³. Ылғал өспеген, демек ауа жақсы алмасқан (немесе жылыту ауаны құрғатқан). Бұл жағдайда CO₂-ні ылғал арқылы бағалау мүмкін емес.
        </>
      );
    } else {
      const share = Math.min(added / expected, 1);
      const rise = share * sealedRise;
      body = (
        <>
          Ауадағы су буы: {fmt(a1, 1)} → {fmt(a2, 1)} г/м³, яғни сыныпқа <b>≈ {fmt(added)} г</b> су буы қосылды. Ауа мүлдем алмаспаса, {fmt(n)} адам {fmt(min)} минутта ≈ {fmt(expected)} г шығарар еді. Сонда шыққан ылғалдың <b>≈ {fmt(share * 100)}%</b> сыныпта қалған.
          <br />
          CO₂ де дәл осылай демнен шығады, сондықтан ол да осы үлеске жуық өседі: {fmt(c0)} + {fmt(share * 100)}% × {fmt(sealedRise)} ≈ <b>{fmt(Math.round((c0 + rise) / 10) * 10)} ppm</b>.
          {added / expected > 1.2 && " (Ылғал күтілгеннен көп өскен: басқа ылғал көзі болуы мүмкін — су, гүлдерді суару, дымқыл киім.)"}
        </>
      );
    }
  }

  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <p className="text-sm font-semibold text-forest">Ылғалдылық арқылы тексеру: ауа қаншалықты алмасты?</p>
      <p className="mt-1 text-xs text-muted">
        Демде CO₂-мен бірге су буы да шығады. Ылғалдылық қанша өскенін өлшеп, шыққан будың қаншасы сыныпта қалғанын табамыз. Сол үлесті CO₂-ге қолданамыз.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ["t1", "Басында, °C"],
            ["rh1", "Басында, RH %"],
            ["t2", "Соңында, °C"],
            ["rh2", "Соңында, RH %"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="text-xs text-muted">
            {label}
            <input className="input mt-1 !min-h-10" inputMode="decimal" value={h[k]} onChange={(e) => setH({ ...h, [k]: e.target.value })} />
          </label>
        ))}
      </div>
      <p className="mt-2 text-[15px]" aria-live="polite">{body}</p>
      <p className="mt-2 text-xs text-muted">
        Шамамен бағалау: қабырға, жиһаз, өсімдіктер ылғалдың бір бөлігін сіңіреді, сондықтан нақты CO₂ бұдан сәл жоғары болуы мүмкін. Терезе жабық кезде өлшеңіз. Бір адам сағатына ≈ {WATER_PER_PERSON} г су буын шығарады деп алынды.
      </p>
    </div>
  );
}
