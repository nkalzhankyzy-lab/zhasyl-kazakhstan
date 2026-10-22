"use client";

import { MessageSquareHeart, Pencil, QrCode, Trash2 } from "lucide-react";
import { useState } from "react";
import { repositories } from "@/lib/storage/repositories";
import { formatDate } from "@/lib/time";
import type { Room, SurveyResponse } from "@/lib/types";
import { AskAi } from "../ai/AskAi";
import { plantCount, roomsContext } from "../garden/roomMath";
import { useEditGuard, useSaveFeedback } from "../Providers";
import { FACES, QUESTIONS, surveyContext, surveyStats, type SurveyKey } from "../survey/surveyMath";
import { Dialog } from "../ui/Dialog";
import { QrDialog } from "./QrDialog";

const fmt = (n: number, d = 1) => n.toLocaleString("ru-RU", { maximumFractionDigits: d, minimumFractionDigits: d });

function EditResponse({ resp, rooms, onClose }: { resp: SurveyResponse; rooms: Room[]; onClose: () => void }) {
  const feedback = useSaveFeedback();
  const [f, setF] = useState(resp);
  const [err, setErr] = useState<string | null>(null);
  async function save() {
    if (!f.className.trim()) return setErr("Сыныпты жазыңыз");
    const ok = await feedback(repositories.survey.upsert({ ...f, className: f.className.trim(), updatedAt: new Date().toISOString() }), "Жауап жаңартылды");
    if (ok) onClose();
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title="Жауапты өңдеу"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Бас тарту
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void save()}>
            Сақтау
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 text-xs text-muted">
          Кабинет
          <select className="input mt-1 !min-h-10" value={f.roomId} onChange={(e) => setF({ ...f, roomId: e.target.value })}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Сынып
          <input className="input mt-1 !min-h-10" value={f.className} maxLength={20} onChange={(e) => setF({ ...f, className: e.target.value })} />
        </label>
        <label className="text-xs text-muted">
          Күні
          <input type="date" className="input mt-1 !min-h-10" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </label>
        {QUESTIONS.map((q) => (
          <label key={q.key} className="text-xs text-muted">
            {q.text}
            <select className="input mt-1 !min-h-10" value={f[q.key]} onChange={(e) => setF({ ...f, [q.key]: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {v} {FACES[v - 1]}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {err && (
        <p className="mt-2 text-sm text-alert" role="alert">
          {err}
        </p>
      )}
    </Dialog>
  );
}

function Row({ r, rooms }: { r: SurveyResponse; rooms: Room[] }) {
  const guard = useEditGuard();
  const feedback = useSaveFeedback();
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  return (
    <tr className="border-b border-line last:border-0">
      <td className="whitespace-nowrap px-3 py-1.5">{formatDate(r.date)}</td>
      <td className="px-2 py-1.5">{rooms.find((x) => x.id === r.roomId)?.name ?? "—"}</td>
      <td className="whitespace-nowrap px-2 py-1.5">{r.className}</td>
      {QUESTIONS.map((q) => (
        <td key={q.key} className="px-2 py-1.5 text-center">
          {r[q.key]}
        </td>
      ))}
      <td className="whitespace-nowrap px-2 py-1.5">
        <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-mint" aria-label="Өңдеу" onClick={guard(() => setEdit(true))}>
          <Pencil size={15} aria-hidden />
        </button>
        <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-mint" aria-label="Өшіру" onClick={guard(() => setDel(true))}>
          <Trash2 size={15} aria-hidden />
        </button>
        {edit && <EditResponse resp={r} rooms={rooms} onClose={() => setEdit(false)} />}
        <Dialog
          open={del}
          onClose={() => setDel(false)}
          title="Жауапты өшіру"
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setDel(false)}>
                Бас тарту
              </button>
              <button
                type="button"
                className="btn btn-primary !bg-alert"
                onClick={async () => {
                  if (await feedback(repositories.survey.remove(r.id), "Жауап өшірілді")) setDel(false);
                }}
              >
                Өшіру
              </button>
            </>
          }
        >
          <p>
            {r.className} сыныбы оқушысының {formatDate(r.date)} жауабы өшіріледі.
          </p>
        </Dialog>
      </td>
    </tr>
  );
}

export function SurveySection({ rooms, responses }: { rooms: Room[]; responses: SurveyResponse[] }) {
  const [qr, setQr] = useState<Room | null>(null);
  const [classFilter, setClassFilter] = useState("all");
  const classes = [...new Set(responses.map((r) => r.className))].sort();
  const shown = (classFilter === "all" ? responses : responses.filter((r) => r.className === classFilter)).slice().reverse();
  return (
    <section aria-labelledby="survey-title" className="flex flex-col gap-3">
      <div>
        <h3 id="survey-title" className="flex items-center gap-2 font-serif text-xl font-bold text-forest">
          <MessageSquareHeart size={20} aria-hidden /> Оқушылар сауалнамасы
        </h3>
        <p className="max-w-3xl text-sm text-muted">
          Сабақ соңында оқушылар кабинеттің QR-кодын сканерлеп, 5 сұраққа 1–5 баллмен жауап береді (5 — ең жақсы). Сауалнама атсыз: тек сынып пен кабинет жазылады.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {rooms.map((room) => {
          const s = surveyStats(responses.filter((r) => r.roomId === room.id));
          return (
            <li key={room.id} className="card flex min-w-0 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{room.name}</p>
                  <p className="text-xs text-muted">
                    {plantCount(room) ? `${plantCount(room)} гүл` : "гүлсіз"} · {s.n} жауап
                  </p>
                </div>
                <button type="button" className="btn btn-ghost !min-h-9 shrink-0 !px-3 text-sm" onClick={() => setQr(room)}>
                  <QrCode size={16} aria-hidden /> QR
                </button>
              </div>
              {s.n ? (
                <>
                  <dl className="flex flex-col gap-1.5">
                    {QUESTIONS.map((q) => (
                      <div key={q.key} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2 text-sm">
                        <dt className="truncate text-muted">{q.short}</dt>
                        <div className="h-2 overflow-hidden rounded-full bg-mint" aria-hidden>
                          <div className="h-full rounded-full bg-leaf" style={{ width: `${((s.avg[q.key as SurveyKey]! - 1) / 4) * 100}%` }} />
                        </div>
                        <dd className="text-right font-semibold">{fmt(s.avg[q.key as SurveyKey]!)}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-sm">
                    Жалпы баға: <b>{fmt(s.total!, 2)}</b> / 5
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">Әзірге жауап жоқ. QR-кодты оқушыларға көрсетіңіз.</p>
              )}
            </li>
          );
        })}
      </ul>
      {responses.length > 0 && (
        <AskAi
          label="ЖИ: сауалнаманы талда"
          question="Оқушылар сауалнамасының нәтижесін талда. Гүлді және гүлсіз кабинеттерді салыстыр: қай көрсеткіште айырма бар (ауа, сергектік, бас ауруы, құрғақтық, көңіл-күй)? Жауап саны аз болса (кабинетке 5-тен кем), қорытынды жасауға ерте екенін айт. Әр кабинетке 1–2 нақты ұсыныс бер: гүл қосу, желдету, ылғалдылық. Әлемдік зерттеулерге (Автор, жыл) сілте. Қысқа жаз."
          context={`${surveyContext(rooms, responses)}\n\n${roomsContext(rooms, false)}`}
        />
      )}
      {responses.length > 0 && (
        <details className="card p-0">
          <summary className="cursor-pointer px-4 py-3 font-semibold text-forest">Барлық жауаптар ({responses.length}) — өңдеу және өшіру</summary>
          <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
            <label className="text-xs text-muted">
              Сынып
              <select className="input mt-1 !min-h-9" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="all">Барлығы</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-y border-line text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Күні</th>
                  <th className="px-2 py-2 font-medium">Кабинет</th>
                  <th className="px-2 py-2 font-medium">Сынып</th>
                  {QUESTIONS.map((q) => (
                    <th key={q.key} className="px-2 py-2 text-center font-medium">
                      {q.short}
                    </th>
                  ))}
                  <th className="px-2 py-2 font-medium">
                    <span className="sr-only">Әрекеттер</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <Row key={r.id} r={r} rooms={rooms} />
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      {qr && (
        <QrDialog
          open
          onClose={() => setQr(null)}
          title={`Сауалнама: ${qr.name}`}
          path={`/saualnama?room=${encodeURIComponent(qr.id)}`}
          note="Оқушылар телефонмен сканерлеп, 1 минутта жауап береді. Аты-жөні жазылмайды."
        />
      )}
    </section>
  );
}
