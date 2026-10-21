"use client";

import { Pencil, Plus, Trash2, Wind } from "lucide-react";
import { useState } from "react";
import { parseOptionalNumber } from "@/lib/metrics";
import { newId, repositories } from "@/lib/storage/repositories";
import { formatDate, todayLocalDate } from "@/lib/time";
import type { DustTest, Room } from "@/lib/types";
import { plantCount } from "../garden/roomMath";
import { useEditGuard, useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";

const fmt = (n: number, d = 1) => n.toLocaleString("ru-RU", { maximumFractionDigits: d });

function DustForm({ rooms, initial, onClose }: { rooms: Room[]; initial?: DustTest; onClose: () => void }) {
  const feedback = useSaveFeedback();
  const week = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  })();
  const [f, setF] = useState({
    roomId: initial?.roomId ?? rooms[0]?.id ?? "",
    startDate: initial?.startDate ?? week,
    endDate: initial?.endDate ?? todayLocalDate(),
    count: initial ? String(initial.count) : "",
    note: initial?.note ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  async function save() {
    const c = parseOptionalNumber(f.count);
    if (!f.roomId) return setErr("Кабинетті таңдаңыз");
    if (c === null || Number.isNaN(c) || c < 0 || c > 10000) return setErr("1 см²-дегі бөлшек санын жазыңыз (0–10 000)");
    if (f.endDate < f.startDate) return setErr("Аяқталу күні басталу күнінен кейін болуы керек");
    const now = new Date().toISOString();
    const rec: DustTest = {
      id: initial?.id ?? newId("dust"),
      status: "user",
      roomId: f.roomId,
      startDate: f.startDate,
      endDate: f.endDate,
      count: c,
      note: f.note.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    if (await feedback(repositories.dust.upsert(rec), initial ? "Нәтиже жаңартылды" : "Нәтиже қосылды")) onClose();
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title={initial ? "Шаң нәтижесін өңдеу" : "Шаң нәтижесін қосу"}
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
          Қойылған күні
          <input type="date" className="input mt-1 !min-h-10" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
        </label>
        <label className="text-xs text-muted">
          Алынған күні
          <input type="date" className="input mt-1 !min-h-10" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} />
        </label>
        <label className="col-span-2 text-xs text-muted">
          1 см²-дегі шаң бөлшектері (3 шаршының орташасы)
          <input className="input mt-1 !min-h-10" inputMode="decimal" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} placeholder="мыс. 42" />
        </label>
        <label className="col-span-2 text-xs text-muted">
          Ескертпе
          <input className="input mt-1 !min-h-10" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="мыс. шкаф үстінде, терезеден 2 м" />
        </label>
      </div>
      {err && (
        <p className="mt-2 text-sm text-alert" role="alert">
          {err}
        </p>
      )}
    </Dialog>
  );
}

function DustRow({ d, rooms }: { d: DustTest; rooms: Room[] }) {
  const guard = useEditGuard();
  const feedback = useSaveFeedback();
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const room = rooms.find((r) => r.id === d.roomId);
  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-3 py-1.5">
        {room?.name ?? "—"}
        <span className="block text-xs text-muted">{room ? (plantCount(room) ? `${plantCount(room)} гүл` : "гүлсіз") : ""}</span>
      </td>
      <td className="whitespace-nowrap px-2 py-1.5">
        {formatDate(d.startDate)} – {formatDate(d.endDate)}
      </td>
      <td className="px-2 py-1.5 font-semibold">{fmt(d.count)}</td>
      <td className="px-2 py-1.5 text-muted">{d.note}</td>
      <td className="whitespace-nowrap px-2 py-1.5">
        <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-mint" aria-label="Өңдеу" onClick={guard(() => setEdit(true))}>
          <Pencil size={15} aria-hidden />
        </button>
        <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-mint" aria-label="Өшіру" onClick={guard(() => setDel(true))}>
          <Trash2 size={15} aria-hidden />
        </button>
        {edit && <DustForm rooms={rooms} initial={d} onClose={() => setEdit(false)} />}
        <Dialog
          open={del}
          onClose={() => setDel(false)}
          title="Нәтижені өшіру"
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setDel(false)}>
                Бас тарту
              </button>
              <button
                type="button"
                className="btn btn-primary !bg-alert"
                onClick={async () => {
                  if (await feedback(repositories.dust.remove(d.id), "Нәтиже өшірілді")) setDel(false);
                }}
              >
                Өшіру
              </button>
            </>
          }
        >
          <p>{room?.name ?? "Кабинет"} бойынша шаң нәтижесі өшіріледі.</p>
        </Dialog>
      </td>
    </tr>
  );
}

export function DustSection({ rooms, tests }: { rooms: Room[]; tests: DustTest[] }) {
  const guard = useEditGuard();
  const [add, setAdd] = useState(false);
  return (
    <section aria-labelledby="dust-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 id="dust-title" className="flex items-center gap-2 font-serif text-xl font-bold text-forest">
            <Wind size={20} aria-hidden /> Шаң тәжірибесі
          </h3>
          <p className="max-w-3xl text-sm text-muted">Гүлді және гүлсіз кабинетте бір аптада қанша шаң жиналатынын салыстырамыз (Lohr, 1996 тәжірибесі бойынша).</p>
        </div>
        <button type="button" className="btn btn-soft" disabled={!rooms.length} onClick={guard(() => setAdd(true))}>
          <Plus size={18} aria-hidden /> Нәтиже қосу
        </button>
      </div>
      <details className="card px-4 py-3">
        <summary className="cursor-pointer font-semibold text-forest">Тәжірибені қалай жасаймыз?</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px]">
          <li>Ақ картонға мөлдір скотчты желімді жағын жоғары қаратып жабыстырыңыз. Әр кабинетке бір картон.</li>
          <li>Екі кабинетте де бірдей жерге қойыңыз: шкаф үстіне, еденнен шамамен 2 м биіктікке, терезе мен есіктен алыс.</li>
          <li>7 күн тимей қалдырыңыз. Қойған және алған күнін жазыңыз.</li>
          <li>Скотчтың үстіне 1×1 см шаршы сызып, лупамен ішіндегі шаң бөлшектерін санаңыз. Үш түрлі жердегі шаршыны санап, орташасын алыңыз.</li>
          <li>Нәтижені осында енгізіңіз. Картондарды суретке түсіріп, семинарда көрсетіңіз.</li>
        </ol>
        <p className="mt-2 text-xs text-muted">Математика: үш шаршының орташасы = (a + b + c) ÷ 3. Айырманы пайызбен есептеңіз: (гүлсіз − гүлді) ÷ гүлсіз × 100%.</p>
      </details>
      {tests.length > 0 ? (
        <div className="card relative overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">Кабинет</th>
                <th className="px-2 py-2 font-medium">Мерзімі</th>
                <th className="px-2 py-2 font-medium">Бөлшек / см²</th>
                <th className="px-2 py-2 font-medium">Ескертпе</th>
                <th className="px-2 py-2 font-medium">
                  <span className="sr-only">Әрекеттер</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tests.map((d) => (
                <DustRow key={d.id} d={d} rooms={rooms} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-3 text-sm text-muted">Әзірге нәтиже жоқ. Тәжірибені бастап, бір аптадан кейін енгізіңіз.</p>
      )}
      {add && <DustForm rooms={rooms} onClose={() => setAdd(false)} />}
    </section>
  );
}
