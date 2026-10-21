"use client";

import { Award, ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, LabelList, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { useCollection, useHydrated } from "@/lib/storage/hooks";
import { lessonHourKey, useOutdoor, WEATHER_PLACE, WEATHER_SOURCE } from "@/lib/weather";
import { repositories } from "@/lib/storage/repositories";
import { formatDate } from "@/lib/time";
import type { DustTest, Lesson, Room, SurveyResponse } from "@/lib/types";
import { labContext, transpirationSummary } from "../lab/labMath";
import { AskAi } from "../ai/AskAi";
import { roomsContext, plantCount, plantsPer10m2 } from "../garden/roomMath";
import { useEditGuard, useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";
import { surveyContext, surveyStats } from "../survey/surveyMath";
import { DustSection } from "./DustSection";
import { LessonForm } from "./LessonForm";
import { SurveySection } from "./SurveySection";
import { CO2_SOURCE_LABEL, greenScore, lessonCo2, lessonsContext, VENT_LABEL, type Co2Opts, type Score } from "./lessonMath";

const fmt = (n: number, d = 1) => n.toLocaleString("ru-RU", { maximumFractionDigits: d });
const nv = (v: number | null) => (v === null ? "—" : fmt(v));
const MEDALS = ["🥇", "🥈", "🥉"];
const PARTS: { key: "air" | "humidity" | "plants" | "care"; label: string; max: number; color: string }[] = [
  { key: "air", label: "Ауа (CO₂ ≤ 1000)", max: 40, color: "bg-sky-500" },
  { key: "humidity", label: "Ылғалдылық 40–60%", max: 20, color: "bg-teal-500" },
  { key: "plants", label: "Гүлдер", max: 25, color: "bg-leaf" },
  { key: "care", label: "Күтім", max: 15, color: "bg-amber-500" },
];

function weakest(s: Score) {
  return [...PARTS].sort((a, b) => s[a.key] / a.max - s[b.key] / b.max)[0];
}

function ScoreCard({ room, score, place }: { room: Room; score: Score; place: number }) {
  const weak = weakest(score);
  return (
    <li className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-muted">{place + 1}-орын</p>
          <h3 className="text-lg font-semibold text-ink">
            {MEDALS[place] ?? ""} {room.name}
          </h3>
        </div>
        <p className="shrink-0 text-right">
          <span className="font-serif text-3xl font-bold text-forest">{score.total}</span>
          <span className="text-sm text-muted"> / 100</span>
        </p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {PARTS.map((p) => (
          <li key={p.key} className="text-sm">
            <div className="flex justify-between">
              <span>{p.label}</span>
              <span className="font-semibold">
                {fmt(score[p.key])} / {p.max}
              </span>
            </div>
            <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-mint" role="presentation">
              <div className={`h-full rounded-full ${p.color}`} style={{ width: `${(score[p.key] / p.max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="text-xs text-muted">Сабақ соңында CO₂</dt>
          <dd className="font-semibold">{score.avgCo2 !== null ? `≈ ${fmt(score.avgCo2, 0)} ppm` : "—"}</dd>
        </div>
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="text-xs text-muted">Ылғалдылық (орт.)</dt>
          <dd className="font-semibold">{score.avgRh !== null ? `${score.avgRh}%` : "—"}</dd>
        </div>
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="text-xs text-muted">Сабақ саны</dt>
          <dd className="font-semibold">{score.lessons}</dd>
        </div>
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="text-xs text-muted">Гүл (10 м²-ге)</dt>
          <dd className="font-semibold">
            {plantCount(room)} ({fmt(plantsPer10m2(room))})
          </dd>
        </div>
      </dl>
      {score.lessons === 0 ? (
        <p className="text-sm text-muted">Сабақ жазбасы жоқ: ауа мен ылғалдылық ұпайы есептелмеді.</p>
      ) : (
        <p className="text-sm">
          Ең әлсіз жері: <b>{weak.label}</b> ({fmt(score[weak.key])} / {weak.max}).
        </p>
      )}
    </li>
  );
}

function LessonRow({ lesson, room, rooms, opts }: { lesson: Lesson; room?: Room; rooms: Room[]; opts: Co2Opts }) {
  const guard = useEditGuard();
  const feedback = useSaveFeedback();
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const c = lessonCo2(lesson, room, opts);
  return (
    <tr className="border-b border-line align-top last:border-0">
      <td className="whitespace-nowrap px-3 py-2">
        {formatDate(lesson.date)}
        <br />
        <span className="text-muted">{lesson.time}</span>
      </td>
      <td className="px-2 py-2">{room?.name ?? "—"}</td>
      <td className="px-2 py-2">
        {lesson.subject}
        {lesson.className && <span className="text-muted"> · {lesson.className}</span>}
        <br />
        <span className="text-xs text-muted">
          {lesson.pupils} оқушы · {lesson.durationMin} мин · {VENT_LABEL[lesson.ventilation].toLowerCase()}
        </span>
      </td>
      <td className="whitespace-nowrap px-2 py-2">
        {lesson.tOut != null ? (
          <>
            {nv(Math.round(lesson.tOut * 10) / 10)} °C
            <br />
            <span className="text-muted">{nv(Math.round(lesson.rhOut ?? 0))}%</span>
          </>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-2 py-2">
        {nv(lesson.tStart)} → {nv(lesson.tEnd)} °C
        <br />
        {nv(lesson.rhStart)} → {nv(lesson.rhEnd)}%
      </td>
      <td className="whitespace-nowrap px-2 py-2">
        {c ? (
          <>
            <b className={c.value > 1000 ? "text-alert" : "text-forest"}>
              {c.source === "measured" ? "" : "≈ "}
              {fmt(c.value, 0)}
            </b>{" "}
            ppm
            <br />
            <span className="text-xs text-muted">{CO2_SOURCE_LABEL[c.source]}</span>
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-mint" aria-label="Өңдеу" onClick={guard(() => setEdit(true))}>
          <Pencil size={16} aria-hidden />
        </button>
        <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-mint" aria-label="Өшіру" onClick={guard(() => setConfirm(true))}>
          <Trash2 size={16} aria-hidden />
        </button>
        {edit && <LessonForm open onClose={() => setEdit(false)} rooms={rooms} initial={lesson} />}
        <Dialog
          open={confirm}
          onClose={() => setConfirm(false)}
          title="Сабақты өшіру"
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>
                Бас тарту
              </button>
              <button
                type="button"
                className="btn btn-primary !bg-alert"
                onClick={async () => {
                  if (await feedback(repositories.lessons.remove(lesson.id), "Сабақ өшірілді")) setConfirm(false);
                }}
              >
                Өшіру
              </button>
            </>
          }
        >
          <p>
            {formatDate(lesson.date)}, {lesson.subject} сабағының жазбасы өшіріледі.
          </p>
        </Dialog>
      </td>
    </tr>
  );
}

/** Гүлді және гүлсіз кабинеттерді салыстыру (зерттеудің негізгі сұрағы) */
function PlantCompare({ rooms, lessons, survey, dust, opts }: { rooms: Room[]; lessons: Lesson[]; survey: SurveyResponse[]; dust: DustTest[]; opts: Co2Opts }) {
  const bare = rooms.filter((r) => plantCount(r) === 0);
  const green = rooms.filter((r) => plantCount(r) > 0);
  // Әділ салыстыру: мүмкін болса, гүлсіз кабинетпен бір жаққа қараған гүлді кабинеттерді аламыз
  const sameSide = green.filter((r) => bare.some((x) => x.windowDir === r.windowDir));
  const pair = sameSide.length > 0;
  const groups = [
    { key: "with", label: pair && sameSide.length === 1 ? sameSide[0].name : "Гүлді кабинеттер", rooms: pair ? sameSide : green },
    { key: "without", label: bare.length === 1 ? bare[0].name : "Гүлсіз кабинеттер", rooms: bare },
  ].map((g) => {
    const ls = lessons.filter((l) => g.rooms.some((r) => r.id === l.roomId));
    const avg = (xs: (number | null | undefined)[]) => {
      const v = xs.filter((x): x is number => typeof x === "number");
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };
    return {
      ...g,
      n: ls.length,
      rhEnd: avg(ls.map((l) => l.rhEnd)),
      rhRise: avg(ls.map((l) => (l.rhEnd !== null && l.rhStart !== null ? l.rhEnd - l.rhStart : null))),
      tEnd: avg(ls.map((l) => l.tEnd)),
      co2: avg(ls.map((l) => lessonCo2(l, g.rooms.find((r) => r.id === l.roomId), opts)?.value)),
      survey: surveyStats(survey.filter((x) => g.rooms.some((r) => r.id === x.roomId))).total,
      surveyN: survey.filter((x) => g.rooms.some((r) => r.id === x.roomId)).length,
      dust: avg(dust.filter((x) => g.rooms.some((r) => r.id === x.roomId)).map((x) => x.count)),
    };
  });
  const [a, b] = groups;
  if (!a.n || !b.n) return null;
  const rows: { label: string; k: "rhEnd" | "rhRise" | "tEnd" | "co2" | "survey" | "dust"; unit: string; d: number }[] = [
    { label: "Сабақ соңындағы ылғалдылық", k: "rhEnd", unit: "%", d: 0 },
    { label: "Сабақ бойы ылғалдылықтың өсуі", k: "rhRise", unit: " п.", d: 1 },
    { label: "Сабақ соңындағы температура", k: "tEnd", unit: " °C", d: 1 },
    { label: "CO₂ сабақ соңында (баға)", k: "co2", unit: " ppm", d: 0 },
    { label: `Оқушылар бағасы, сауалнама (${a.surveyN} / ${b.surveyN} жауап)`, k: "survey", unit: " / 5", d: 2 },
    { label: "Шаң, бөлшек / см² (апта)", k: "dust", unit: "", d: 1 },
  ];
  // Деректен автоматты қорытынды: тек байқалған айырманы айтады
  const concl: string[] = [];
  const dRh = a.rhEnd !== null && b.rhEnd !== null ? a.rhEnd - b.rhEnd : null;
  if (dRh !== null) concl.push(Math.abs(dRh) >= 2 ? `Ылғалдылық гүлді кабинетте ${fmt(Math.abs(dRh), 0)} пунктке ${dRh > 0 ? "жоғары" : "төмен"}.` : "Ылғалдылықта айтарлықтай айырма жоқ.");
  const dCo2 = a.co2 !== null && b.co2 !== null ? a.co2 - b.co2 : null;
  if (dCo2 !== null) concl.push(Math.abs(dCo2) < 150 ? "CO₂ шамамен бірдей: оны гүл емес, оқушы саны мен желдету анықтайды." : `CO₂ ${dCo2 > 0 ? "гүлді" : "гүлсіз"} кабинетте ${fmt(Math.abs(dCo2), 0)} ppm-ге жоғары; бұған желдету мен оқушы саны әсер етуі мүмкін.`);
  if (a.survey !== null && b.survey !== null && a.surveyN >= 5 && b.surveyN >= 5) {
    const d = a.survey - b.survey;
    concl.push(Math.abs(d) >= 0.3 ? `Оқушылар ${d > 0 ? "гүлді" : "гүлсіз"} кабинетті ${fmt(Math.abs(d), 1)} баллға жоғары бағалады.` : "Оқушылардың бағасында айтарлықтай айырма жоқ.");
  } else concl.push("Сауалнама нәтижесі әлі жеткіліксіз (әр кабинетке кемінде 5 жауап керек).");
  if (a.dust !== null && b.dust !== null && b.dust > 0) {
    const pct = ((b.dust - a.dust) / b.dust) * 100;
    concl.push(Math.abs(pct) >= 10 ? `Гүлді кабинетте шаң ${fmt(Math.abs(pct), 0)}%-ға ${pct > 0 ? "аз" : "көп"} жиналды.` : "Шаң мөлшері шамамен бірдей.");
  }
  const show = (v: number | null, d: number) => (v === null ? "—" : fmt(v, d));
  return (
    <div className="card min-w-0 p-4">
      <h3 className="font-semibold text-forest">Гүлді және гүлсіз кабинет: айырмашылық бар ма?</h3>
      <p className="text-sm text-muted">
        Гүлсіз кабинет — салыстыруға арналған бақылау кабинеті.{" "}
        {pair ? "Әділ болу үшін терезесі бір жаққа қараған кабинеттер салыстырылды." : "Барлық гүлді кабинеттер бірге алынды."} Әр мән — сабақтардың орташасы.
      </p>
      <div className="relative mt-2 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-2 pr-2 font-medium">Көрсеткіш</th>
              <th className="px-2 py-2 font-medium">
                {a.label} ({a.n} сабақ)
              </th>
              <th className="px-2 py-2 font-medium">
                {b.label} ({b.n} сабақ)
              </th>
              <th className="px-2 py-2 font-medium">Айырма</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const va = a[row.k];
              const vb = b[row.k];
              const diff = va !== null && vb !== null ? va - vb : null;
              return (
                <tr key={row.k} className="border-b border-line last:border-0">
                  <td className="py-2 pr-2">{row.label}</td>
                  <td className="px-2 py-2 font-semibold">
                    {show(va, row.d)}
                    {row.unit}
                  </td>
                  <td className="px-2 py-2 font-semibold">
                    {show(vb, row.d)}
                    {row.unit}
                  </td>
                  <td className="px-2 py-2">{diff === null ? "—" : `${diff > 0 ? "+" : ""}${fmt(diff, row.d)}${row.unit}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">
        <span className="mb-1 block rounded-xl bg-mint px-3 py-2 text-sm text-forest">
          <b>Деректер не көрсетеді: </b>
          {concl.join(" ")}
        </span>
        Ескерту: айырма гүлдің әсерін ғана емес, кабинет көлемін, оқушы санын, терезе бағытын және желдетуді де көрсетеді. Сенімді қорытынды үшін бірдей жағдайдағы (бір қабат, бір жаққа қараған) кабинеттерді ұзақ уақыт салыстыру керек. Гүл CO₂-ні айтарлықтай азайтпайды (Cummings & Waring, 2019), сондықтан негізгі айырма ылғалдылықта байқалуы мүмкін.
      </p>
    </div>
  );
}

export function EcoPassport() {
  const allRooms = useCollection(repositories.rooms);
  const allLessons = useCollection(repositories.lessons);
  const hydrated = useHydrated();
  const guard = useEditGuard();
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const rooms = useMemo(() => allRooms.filter((r) => r.status === "user").sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [allRooms]);
  const baseLessons = useMemo(() => allLessons.filter((l) => l.status === "user").sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), [allLessons]);
  // Сыртқы ауа райы енгізілмеген сабақтарға Open-Meteo-дан сол сағаттың дерегін қосамыз
  const outdoor = useOutdoor(baseLessons.filter((l) => l.tOut == null).map((l) => l.date));
  const allSurvey = useCollection(repositories.survey);
  const allDust = useCollection(repositories.dust);
  const allLab = useCollection(repositories.lab);
  const labResults = useMemo(() => allLab.filter((x) => x.status === "user"), [allLab]);
  const survey = useMemo(() => allSurvey.filter((x) => x.status === "user").sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [allSurvey]);
  const dust = useMemo(() => allDust.filter((x) => x.status === "user").sort((a, b) => a.startDate.localeCompare(b.startDate)), [allDust]);
  const lessons = useMemo(
    () =>
      baseLessons.map((l) => {
        if (l.tOut != null) return l;
        const o = outdoor[lessonHourKey(l.date, l.time, l.durationMin)];
        return o ? { ...l, tOut: o.t, rhOut: o.rh } : l;
      }),
    [baseLessons, outdoor],
  );
  // Зертханада өлшенген гүлдің су буландыруы CO₂ формуласына қосылады
  const plantGph = useMemo(() => transpirationSummary(labResults, rooms).perPotGph, [labResults, rooms]);
  const co2Opts = useMemo<Co2Opts>(() => ({ plantGph }), [plantGph]);
  const ranked = useMemo(() => rooms.map((r) => ({ room: r, score: greenScore(r, lessons, co2Opts) })).sort((a, b) => b.score.total - a.score.total), [rooms, lessons, co2Opts]);
  const shown = (filter === "all" ? lessons : lessons.filter((l) => l.roomId === filter)).slice().reverse();
  const scatter = ranked.filter((x) => x.score.avgRh !== null).map((x) => ({ x: Math.round(plantsPer10m2(x.room) * 10) / 10, y: x.score.avgRh, name: x.room.name.replace(/ кабинеті.*$/, "") }));

  if (!hydrated) return <p className="text-muted">Жүктелуде…</p>;

  return (
    <section aria-labelledby="eco-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="eco-title" className="flex items-center gap-2 font-serif text-2xl font-bold text-forest sm:text-3xl">
            <Award size={26} aria-hidden /> Экопаспорт: кабинеттер рейтингі
          </h2>
          <p className="max-w-3xl text-muted">
            Әр кабинеттің «жасыл ұпайы» сабақ журналы мен гүлдер дерегінен есептеледі. Кабинеттер мен гүлдер «Менің жасыл бағым» бөлімінде енгізіледі.
          </p>
        </div>
        <button type="button" className="btn btn-primary" disabled={!rooms.length} onClick={guard(() => setAddOpen(true))}>
          <Plus size={18} aria-hidden /> Сабақ қосу
        </button>
      </div>

      {!rooms.length ? (
        <p className="card p-5 text-muted">Алдымен «Менің жасыл бағым» бөлімінде кабинеттерді енгізіңіз.</p>
      ) : (
        <>
          <ol className="grid gap-4 md:grid-cols-2">
            {ranked.map((x, i) => (
              <ScoreCard key={x.room.id} room={x.room} score={x.score} place={i} />
            ))}
          </ol>

          <PlantCompare rooms={rooms} lessons={lessons} survey={survey} dust={dust} opts={co2Opts} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card min-w-0 p-4">
              <h3 className="font-semibold text-forest">Гүл көп болса, ылғалдылық жоғары ма?</h3>
              <p className="text-sm text-muted">Әр нүкте — бір кабинет: гүл тығыздығы мен сабақ соңындағы орташа ылғалдылық.</p>
              {scatter.length >= 2 ? (
                <div className="mt-2 h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 0 }}>
                      <CartesianGrid stroke="#e2d8c0" strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="x" name="Гүл / 10 м²" tick={{ fontSize: 12, fill: "#56634f" }} label={{ value: "гүл / 10 м²", position: "insideBottom", offset: -8, fontSize: 12, fill: "#56634f" }} domain={[0, "auto"]} />
                      <YAxis type="number" dataKey="y" name="Ылғалдылық" unit="%" tick={{ fontSize: 12, fill: "#56634f" }} width={44} domain={["auto", "auto"]} />
                      <ZAxis range={[160, 160]} />
                      <Tooltip formatter={(v, n) => [v, n]} />
                      <Scatter data={scatter} fill="#2c6239">
                        <LabelList dataKey="name" position="top" fontSize={11} fill="#1c2a1f" />
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">Салыстыру үшін кемінде екі кабинетте сабақ жазбасы керек.</p>
              )}
              <p className="mt-1 text-xs text-muted">Ескерту: {rooms.length} кабинет — шағын іріктеме. Айырмашылыққа терезе бағыты, желдету, оқушы саны да әсер етеді.</p>
            </div>
            <div className="card flex min-w-0 flex-col gap-2 p-4">
              <h3 className="font-semibold text-forest">Жасыл ұпай қалай есептеледі?</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>
                  <b>Ауа, 40:</b> CO₂ 1000 ppm-нен аспаған сабақтар үлесі × 40.
                </li>
                <li>
                  <b>Ылғалдылық, 20:</b> 40–60% — толық, 30–40% немесе 60–70% — жартылай ұпай.
                </li>
                <li>
                  <b>Гүлдер, 25:</b> 15 × (10 м²-ге гүл ÷ 3, ең көбі 1) + 10 × жарыққа сай түрлер үлесі.
                </li>
                <li>
                  <b>Күтім, 15:</b> «жақсы» гүл — 1, «орташа» — 0,5, «нашар» — 0.
                </li>
              </ul>
              <p className="rounded-xl bg-sand-2/60 px-3 py-2 text-sm text-bark">
                CO₂ өлшегіш болмаса, сабақ соңындағы CO₂ ылғалдылықтың өсуі арқылы, ол да болмаса кабинет көлемі мен желдету арқылы бағаланады. Сондықтан бұл — болжам. Сыртқы ауа ({WEATHER_PLACE}, {WEATHER_SOURCE}) сабақ күні мен сағаты бойынша автоматты алынады: сыртта ауа құрғақ болса, терезеден шыққан су буы ескеріліп, CO₂ дәлірек бағаланады.
              </p>
              <AskAi
                label="ЖИ: қорытынды мен ұсыныс"
                question="Экопаспорт деректеріне қарап: 1) қай кабинет үздік және неге; 2) әр кабинетке 1–2 нақты ұсыныс (гүл қосу/ауыстыру, желдету уақыты); 3) гүл тығыздығы мен ылғалдылық арасында байланыс байқала ма — абай болып, іріктеменің аздығын ескер. Қысқа жаз."
                context={`${lessonsContext(rooms, lessons, co2Opts)}\n\n${labContext(labResults, rooms)}\n\n${surveyContext(rooms, survey)}\n\n${dust.length ? "ШАҢ ТӘЖІРИБЕСІ (бөлшек/см², апта): " + dust.map((d) => `${rooms.find((r) => r.id === d.roomId)?.name ?? d.roomId}: ${d.count}`).join("; ") : ""}\n\n${roomsContext(rooms, false)}`}
              />
            </div>
          </div>

          <SurveySection rooms={rooms} responses={survey} />
          <DustSection rooms={rooms} tests={dust} />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-forest">
                <ClipboardList size={20} aria-hidden /> Сабақ журналы ({lessons.length})
              </h3>
              <label className="text-xs text-muted">
                Кабинет
                <select className="input mt-1 !min-h-10" value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">Барлығы</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {shown.length ? (
              <div className="card relative overflow-x-auto p-0">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      <th className="px-3 py-2 font-medium">Күні</th>
                      <th className="px-2 py-2 font-medium">Кабинет</th>
                      <th className="px-2 py-2 font-medium">Сабақ</th>
                      <th className="px-2 py-2 font-medium">Сыртта</th>
                      <th className="px-2 py-2 font-medium">Кабинетте: T / ылғалдылық</th>
                      <th className="px-2 py-2 font-medium">CO₂ (соңында)</th>
                      <th className="px-3 py-2 font-medium">
                        <span className="sr-only">Әрекеттер</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((l) => (
                      <LessonRow key={l.id} lesson={l} room={rooms.find((r) => r.id === l.roomId)} rooms={rooms} opts={co2Opts} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="card p-5 text-muted">Сабақ жазбасы жоқ. Сабақтан кейін «Сабақ қосу» батырмасымен енгізіңіз.</p>
            )}
          </div>
        </>
      )}
      {addOpen && <LessonForm open onClose={() => setAddOpen(false)} rooms={rooms} />}
    </section>
  );
}
