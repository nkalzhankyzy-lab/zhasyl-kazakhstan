"use client";

import { useRef, useState, type FormEvent } from "react";
import { parseOptionalNumber } from "@/lib/metrics";
import { newId, repositories } from "@/lib/storage/repositories";
import type { YardItem } from "@/lib/types";
import { useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";

const SPREAD = { small: [10, 8], medium: [22, 16], large: [40, 26] } as const;
type Spread = keyof typeof SPREAD;

function spreadOf(i?: YardItem | null): Spread {
  if (!i) return "medium";
  const r = Math.max(i.rx, i.ry);
  return r <= 12 ? "small" : r <= 26 ? "medium" : "large";
}

export function YardForm({
  open,
  onClose,
  initial,
  at,
}: {
  open: boolean;
  onClose: () => void;
  initial?: YardItem | null;
  at?: { x: number; y: number };
}) {
  const [f, setF] = useState(() => ({
    kind: initial?.kind ?? ("tree" as YardItem["kind"]),
    name: initial?.name ?? "",
    count: initial?.count.toString() ?? "1",
    plantedYear: initial?.plantedYear?.toString() ?? "",
    condition: initial?.condition ?? ("good" as YardItem["condition"]),
    spread: spreadOf(initial),
    notes: initial?.notes ?? "",
  }));
  const [err, setErr] = useState<string | null>(null);
  const feedback = useSaveFeedback();
  const saving = useRef(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((x) => ({ ...x, [k]: e.target.value }));
  const year = new Date().getFullYear();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!f.name.trim())
      return setErr("Өсімдіктің атауын жазыңыз (мысалы, Қарағаш)");
    const count = parseOptionalNumber(f.count);
    if (
      count === null ||
      Number.isNaN(count) ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > 2000
    )
      return setErr("Саны: 1-ден 2000-ға дейінгі бүтін сан");
    const py = parseOptionalNumber(f.plantedYear);
    if (
      py !== null &&
      (Number.isNaN(py) || !Number.isInteger(py) || py < 1900 || py > year)
    )
      return setErr(`Егілген жылы: 1900–${year}`);
    if (saving.current) return;
    saving.current = true;
    const now = new Date().toISOString();
    const [rx, ry] = SPREAD[f.spread];
    const item: YardItem = {
      id: initial?.id ?? newId("yard"),
      status: "user",
      kind: f.kind,
      name: f.name.trim(),
      count,
      plantedYear: py,
      condition: f.condition,
      x: initial?.x ?? at?.x ?? 240,
      y: initial?.y ?? at?.y ?? 300,
      rx,
      ry,
      notes: f.notes.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    const ok = await feedback(
      repositories.yard.upsert(item),
      initial ? "Жаңартылды" : "Картаға қосылды",
    );
    saving.current = false;
    if (ok) onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? "Ауладағы өсімдікті өңдеу" : "Аулаға өсімдік қосу"}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Бас тарту
          </button>
          <button type="submit" form="yard-form" className="btn btn-primary">
            Сақтау
          </button>
        </>
      }
    >
      <form
        id="yard-form"
        onSubmit={submit}
        className="flex flex-col gap-3"
        noValidate
      >
        <div className="grid grid-cols-2 gap-2">
          <label className="field-label">
            Түрі
            <select
              className="input mt-1"
              value={f.kind}
              onChange={set("kind")}
            >
              <option value="tree">Ағаш</option>
              <option value="shrub">Бұта</option>
              <option value="flowers">Гүлзар</option>
            </select>
          </label>
          <label className="field-label">
            Саны
            <input
              className="input mt-1"
              inputMode="numeric"
              value={f.count}
              onChange={set("count")}
            />
          </label>
        </div>
        <label className="field-label">
          Атауы
          <input
            className="input mt-1"
            value={f.name}
            onChange={set("name")}
            placeholder="мыс. Қарағаш, Ақ акация, Раушан"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="field-label">
            Егілген жылы
            <input
              className="input mt-1"
              inputMode="numeric"
              value={f.plantedYear}
              onChange={set("plantedYear")}
              placeholder="белгісіз болса бос"
            />
          </label>
          <label className="field-label">
            Күйі
            <select
              className="input mt-1"
              value={f.condition}
              onChange={set("condition")}
            >
              <option value="good">Жақсы</option>
              <option value="fair">Орташа</option>
              <option value="poor">Нашар</option>
            </select>
          </label>
        </div>
        <label className="field-label">
          Картадағы ауданы
          <select
            className="input mt-1"
            value={f.spread}
            onChange={set("spread")}
          >
            <option value="small">
              Кішкентай (бір-екі ағаш, шағын гүлзар)
            </option>
            <option value="medium">Орташа (ағаш қатары, гүлзар)</option>
            <option value="large">Үлкен (бір жақты толық алып жатыр)</option>
          </select>
        </label>
        <label className="field-label">
          Ескертпе
          <textarea
            className="input mt-1 min-h-16"
            value={f.notes}
            onChange={set("notes")}
            placeholder="мыс. 2024 жылы түлектер екті"
          />
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
