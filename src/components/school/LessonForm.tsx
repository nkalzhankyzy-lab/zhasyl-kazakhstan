"use client";

import { useRef, useState, type FormEvent } from "react";
import { parseOptionalNumber } from "@/lib/metrics";
import { newId, repositories } from "@/lib/storage/repositories";
import { todayLocalDate } from "@/lib/time";
import type { Lesson, Room } from "@/lib/types";
import { useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";
import { VENT_LABEL } from "./lessonMath";

const SUBJECTS = ["Биология", "Химия", "Физика", "Ағылшын тілі", "Математика", "Қазақ тілі", "Тарих", "География", "Информатика"];

export function LessonForm({ open, onClose, rooms, initial, roomId }: { open: boolean; onClose: () => void; rooms: Room[]; initial?: Lesson | null; roomId?: string }) {
  const s = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));
  const [f, setF] = useState(() => ({
    roomId: initial?.roomId ?? roomId ?? rooms[0]?.id ?? "",
    date: initial?.date ?? todayLocalDate(),
    time: initial?.time ?? "09:00",
    subject: initial?.subject ?? "",
    className: initial?.className ?? "",
    pupils: s(initial?.pupils ?? rooms.find((r) => r.id === (initial?.roomId ?? roomId))?.pupils ?? 25),
    durationMin: s(initial?.durationMin ?? 45),
    tStart: s(initial?.tStart),
    rhStart: s(initial?.rhStart),
    tEnd: s(initial?.tEnd),
    rhEnd: s(initial?.rhEnd),
    co2Start: s(initial?.co2Start),
    co2End: s(initial?.co2End),
    ventilation: initial?.ventilation ?? ("break" as Lesson["ventilation"]),
    note: initial?.note ?? "",
  }));
  const [err, setErr] = useState<string | null>(null);
  const feedback = useSaveFeedback();
  const saving = useRef(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!f.roomId) return setErr("Кабинетті таңдаңыз");
    if (!f.subject.trim()) return setErr("Пәнді жазыңыз");
    const num = (v: string, label: string, min: number, max: number, int = false): number | null | string => {
      const n = parseOptionalNumber(v);
      if (n === null) return null;
      if (Number.isNaN(n) || n < min || n > max || (int && !Number.isInteger(n))) return `${label}: ${min}–${max} аралығындағы сан`;
      return n;
    };
    const vals = {
      pupils: num(f.pupils, "Оқушы саны", 1, 60, true),
      durationMin: num(f.durationMin, "Ұзақтығы", 5, 240, true),
      tStart: num(f.tStart, "Температура (басы)", -10, 50),
      rhStart: num(f.rhStart, "Ылғалдылық (басы)", 1, 100),
      tEnd: num(f.tEnd, "Температура (соңы)", -10, 50),
      rhEnd: num(f.rhEnd, "Ылғалдылық (соңы)", 1, 100),
      co2Start: num(f.co2Start, "CO₂ (басы)", 300, 10000, true),
      co2End: num(f.co2End, "CO₂ (соңы)", 300, 10000, true),
    };
    for (const v of Object.values(vals)) if (typeof v === "string") return setErr(v);
    if (vals.pupils === null) return setErr("Оқушы санын жазыңыз");
    if (vals.durationMin === null) return setErr("Сабақ ұзақтығын жазыңыз");
    if (saving.current) return;
    saving.current = true;
    const now = new Date().toISOString();
    const n = vals as Record<keyof typeof vals, number | null>;
    const lesson: Lesson = {
      id: initial?.id ?? newId("lesson"),
      status: "user",
      roomId: f.roomId,
      date: f.date,
      time: f.time,
      subject: f.subject.trim(),
      className: f.className.trim(),
      pupils: n.pupils!,
      durationMin: n.durationMin!,
      tStart: n.tStart,
      rhStart: n.rhStart,
      tEnd: n.tEnd,
      rhEnd: n.rhEnd,
      co2Start: n.co2Start,
      co2End: n.co2End,
      ventilation: f.ventilation,
      note: f.note.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    const ok = await feedback(repositories.lessons.upsert(lesson), initial ? "Сабақ жаңартылды" : "Сабақ қосылды");
    saving.current = false;
    if (ok) onClose();
  }

  const field = (k: keyof typeof f, label: string, placeholder = "", mode: "decimal" | "numeric" = "decimal") => (
    <label className="text-xs text-muted">
      {label}
      <input className="input mt-1 !min-h-10" inputMode={mode} value={f[k]} placeholder={placeholder} onChange={set(k)} />
    </label>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={initial ? "Сабақты өңдеу" : "Сабақ қосу"}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Бас тарту
          </button>
          <button type="submit" form="lesson-form" className="btn btn-primary">
            Сақтау
          </button>
        </>
      }
    >
      <form id="lesson-form" onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <label className="col-span-2 text-xs text-muted sm:col-span-1">
            Кабинет
            <select className="input mt-1 !min-h-10" value={f.roomId} onChange={set("roomId")}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Күні
            <input type="date" className="input mt-1 !min-h-10" value={f.date} onChange={set("date")} />
          </label>
          <label className="text-xs text-muted">
            Басталу уақыты
            <input type="time" className="input mt-1 !min-h-10" value={f.time} onChange={set("time")} />
          </label>
          <label className="text-xs text-muted">
            Пән
            <input className="input mt-1 !min-h-10" list="subjects" value={f.subject} onChange={set("subject")} />
            <datalist id="subjects">
              {SUBJECTS.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </label>
          {field("className", "Сынып", "мыс. 8 «А»")}
          {field("pupils", "Оқушы саны", "", "numeric")}
          {field("durationMin", "Ұзақтығы, мин", "", "numeric")}
          <label className="col-span-2 text-xs text-muted">
            Желдету
            <select className="input mt-1 !min-h-10" value={f.ventilation} onChange={set("ventilation")}>
              {(Object.keys(VENT_LABEL) as Lesson["ventilation"][]).map((k) => (
                <option key={k} value={k}>
                  {VENT_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="rounded-xl border border-line p-3">
          <legend className="px-1 text-sm font-semibold text-forest">Өлшемдер (термогигрометр)</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {field("tStart", "Басында, °C")}
            {field("rhStart", "Басында, RH %")}
            {field("tEnd", "Соңында, °C")}
            {field("rhEnd", "Соңында, RH %")}
          </div>
        </fieldset>
        <fieldset className="rounded-xl border border-line p-3">
          <legend className="px-1 text-sm font-semibold text-forest">CO₂ өлшегіш болса</legend>
          <div className="grid grid-cols-2 gap-2">
            {field("co2Start", "Басында, ppm", "бос болса есептеледі", "numeric")}
            {field("co2End", "Соңында, ppm", "бос болса есептеледі", "numeric")}
          </div>
        </fieldset>
        <label className="text-xs text-muted">
          Ескертпе
          <input className="input mt-1 !min-h-10" value={f.note} onChange={set("note")} placeholder="мыс. зертханалық жұмыс, оқушылар қозғалыста" />
        </label>
        {err && (
          <p className="text-sm text-alert" role="alert">
            {err}
          </p>
        )}
      </form>
    </Dialog>
  );
}
