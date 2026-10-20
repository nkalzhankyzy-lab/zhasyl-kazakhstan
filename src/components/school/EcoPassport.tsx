"use client";

import { Award, ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, LabelList, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { useCollection, useHydrated } from "@/lib/storage/hooks";
import { lessonHourKey, useOutdoor, WEATHER_PLACE, WEATHER_SOURCE } from "@/lib/weather";
import { repositories } from "@/lib/storage/repositories";
import { formatDate } from "@/lib/time";
import type { Lesson, Room } from "@/lib/types";
import { AskAi } from "../ai/AskAi";
import { roomsContext, plantCount, plantsPer10m2 } from "../garden/roomMath";
import { useEditGuard, useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";
import { LessonForm } from "./LessonForm";
import { CO2_SOURCE_LABEL, greenScore, lessonCo2, lessonsContext, VENT_LABEL, type Score } from "./lessonMath";

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

function LessonRow({ lesson, room, rooms }: { lesson: Lesson; room?: Room; rooms: Room[] }) {
  const guard = useEditGuard();
  const feedback = useSaveFeedback();
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const c = lessonCo2(lesson, room);
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
  const lessons = useMemo(
    () =>
      baseLessons.map((l) => {
        if (l.tOut != null) return l;
        const o = outdoor[lessonHourKey(l.date, l.time, l.durationMin)];
        return o ? { ...l, tOut: o.t, rhOut: o.rh } : l;
      }),
    [baseLessons, outdoor],
  );
  const ranked = useMemo(() => rooms.map((r) => ({ room: r, score: greenScore(r, lessons) })).sort((a, b) => b.score.total - a.score.total), [rooms, lessons]);
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
          <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ranked.map((x, i) => (
              <ScoreCard key={x.room.id} room={x.room} score={x.score} place={i} />
            ))}
          </ol>

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
              <p className="mt-1 text-xs text-muted">Ескерту: үш кабинет — шағын іріктеме. Айырмашылыққа терезе бағыты, желдету, оқушы саны да әсер етеді.</p>
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
                context={`${lessonsContext(rooms, lessons)}\n\n${roomsContext(rooms, false)}`}
              />
            </div>
          </div>

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
                      <LessonRow key={l.id} lesson={l} room={rooms.find((r) => r.id === l.roomId)} rooms={rooms} />
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
