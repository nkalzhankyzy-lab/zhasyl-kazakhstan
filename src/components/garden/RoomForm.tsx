"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { INDOOR_PLANTS, plantById, WINDOW_DIRS } from "@/data/indoor-plants";
import { parseOptionalNumber } from "@/lib/metrics";
import { newId, repositories } from "@/lib/storage/repositories";
import type { Room, RoomPlant, WindowDir } from "@/lib/types";
import { useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";

type PlantRow = { id: string; speciesId: string; name: string; count: string; plantedAt: string; condition: RoomPlant["condition"] };

const OTHER = "__other";

export function RoomForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Room | null }) {
  const [f, setF] = useState(() => ({
    name: initial?.name ?? "",
    floor: initial?.floor?.toString() ?? "",
    lengthM: initial?.lengthM.toString() ?? "",
    widthM: initial?.widthM.toString() ?? "",
    heightM: initial?.heightM.toString() ?? "3",
    windowDir: (initial?.windowDir ?? "") as WindowDir | "",
    windows: initial?.windows?.toString() ?? "",
    notes: initial?.notes ?? "",
  }));
  const [rows, setRows] = useState<PlantRow[]>(() =>
    (initial?.plants ?? []).map((p) => ({ id: p.id, speciesId: p.speciesId ?? OTHER, name: p.name, count: String(p.count), plantedAt: p.plantedAt, condition: p.condition })),
  );
  const [err, setErr] = useState<string | null>(null);
  const feedback = useSaveFeedback();
  const saving = useRef(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setRow = (id: string, patch: Partial<PlantRow>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const L = parseOptionalNumber(f.lengthM);
    const W = parseOptionalNumber(f.widthM);
    const H = parseOptionalNumber(f.heightM);
    const floor = parseOptionalNumber(f.floor);
    const windows = parseOptionalNumber(f.windows);
    if (!f.name.trim()) return setErr("Кабинеттің атауын жазыңыз");
    for (const [v, label, max] of [[L, "Ұзындығы", 50], [W, "Ені", 50], [H, "Биіктігі", 10]] as const)
      if (v === null || Number.isNaN(v) || v <= 0 || v > max) return setErr(`${label}: 0-ден ${max} м-ге дейінгі сан жазыңыз`);
    if (floor !== null && (Number.isNaN(floor) || !Number.isInteger(floor) || floor < -1 || floor > 20)) return setErr("Қабат: бүтін сан жазыңыз");
    if (windows !== null && (Number.isNaN(windows) || !Number.isInteger(windows) || windows < 0 || windows > 30)) return setErr("Терезе саны: бүтін сан жазыңыз");
    const plants: RoomPlant[] = [];
    for (const r of rows) {
      const sp = r.speciesId === OTHER ? undefined : plantById(r.speciesId);
      const name = sp ? sp.name : r.name.trim();
      if (!name) return setErr("Әр гүлдің атауын таңдаңыз немесе жазыңыз");
      const count = parseOptionalNumber(r.count);
      if (count === null || Number.isNaN(count) || !Number.isInteger(count) || count < 1 || count > 500) return setErr(`«${name}»: саны 1-ден 500-ге дейінгі бүтін сан болуы керек`);
      plants.push({ id: r.id, speciesId: sp ? sp.id : null, name, count, plantedAt: r.plantedAt, condition: r.condition });
    }
    if (saving.current) return;
    saving.current = true;
    const now = new Date().toISOString();
    const room: Room = {
      id: initial?.id ?? newId("room"),
      status: "user",
      name: f.name.trim(),
      floor,
      lengthM: L!,
      widthM: W!,
      heightM: H!,
      windowDir: f.windowDir || null,
      windows,
      plants,
      notes: f.notes.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    const ok = await feedback(repositories.rooms.upsert(room), initial ? "Кабинет жаңартылды" : "Кабинет қосылды");
    saving.current = false;
    if (ok) onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={initial ? "Кабинетті өңдеу" : "Кабинет қосу"}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Бас тарту
          </button>
          <button type="submit" form="room-form" className="btn btn-primary">
            Сақтау
          </button>
        </>
      }
    >
      <form id="room-form" onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="field-label">
            Кабинет атауы
            <input className="input mt-1" value={f.name} onChange={set("name")} placeholder="мыс. Биология кабинеті (№12)" />
          </label>
          <label className="field-label">
            Қабат
            <input className="input mt-1 sm:w-24" inputMode="numeric" value={f.floor} onChange={set("floor")} />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="field-label">
            Ұзындығы, м
            <input className="input mt-1" inputMode="decimal" value={f.lengthM} onChange={set("lengthM")} />
          </label>
          <label className="field-label">
            Ені, м
            <input className="input mt-1" inputMode="decimal" value={f.widthM} onChange={set("widthM")} />
          </label>
          <label className="field-label">
            Биіктігі, м
            <input className="input mt-1" inputMode="decimal" value={f.heightM} onChange={set("heightM")} />
          </label>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <label className="field-label">
            Терезе қай жаққа қарайды?
            <select className="input mt-1" value={f.windowDir} onChange={set("windowDir")}>
              <option value="">Белгісіз</option>
              {WINDOW_DIRS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Терезе саны
            <input className="input mt-1 w-24" inputMode="numeric" value={f.windows} onChange={set("windows")} />
          </label>
        </div>

        <fieldset className="rounded-xl border border-line p-3">
          <legend className="px-1 text-sm font-semibold text-forest">Гүлдер</legend>
          {rows.length === 0 && <p className="text-sm text-muted">Әзірге гүл жоқ. «Гүл қосу» батырмасын басыңыз.</p>}
          <ul className="flex flex-col gap-3">
            {rows.map((r, i) => (
              <li key={r.id} className="grid grid-cols-2 gap-2 border-b border-line pb-3 last:border-0 sm:grid-cols-[1.4fr_0.6fr_1fr_0.9fr_auto] sm:items-end">
                <label className="col-span-2 text-xs text-muted sm:col-span-1">
                  Гүл {i + 1}
                  <select className="input mt-1 !min-h-10" value={r.speciesId} onChange={(e) => setRow(r.id, { speciesId: e.target.value })}>
                    <option value="">Таңдаңыз…</option>
                    {INDOOR_PLANTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    <option value={OTHER}>Басқа (өзім жазамын)</option>
                  </select>
                  {r.speciesId === OTHER && (
                    <input className="input mt-1 !min-h-10" value={r.name} placeholder="Гүлдің атауы" onChange={(e) => setRow(r.id, { name: e.target.value })} />
                  )}
                </label>
                <label className="text-xs text-muted">
                  Саны
                  <input className="input mt-1 !min-h-10" inputMode="numeric" value={r.count} onChange={(e) => setRow(r.id, { count: e.target.value })} />
                </label>
                <label className="text-xs text-muted">
                  Отырғызылған күні
                  <input type="date" className="input mt-1 !min-h-10" value={r.plantedAt} onChange={(e) => setRow(r.id, { plantedAt: e.target.value })} />
                </label>
                <label className="text-xs text-muted">
                  Күйі
                  <select className="input mt-1 !min-h-10" value={r.condition} onChange={(e) => setRow(r.id, { condition: e.target.value as RoomPlant["condition"] })}>
                    <option value="good">Жақсы</option>
                    <option value="fair">Орташа</option>
                    <option value="poor">Нашар</option>
                  </select>
                </label>
                <button type="button" className="btn btn-ghost !min-h-10 justify-self-start" aria-label={`${i + 1}-гүлді өшіру`} onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>
                  <Trash2 size={16} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-ghost mt-2 !min-h-10"
            onClick={() => setRows((rs) => [...rs, { id: newId("rp"), speciesId: "", name: "", count: "1", plantedAt: "", condition: "good" }])}
          >
            <Plus size={16} aria-hidden /> Гүл қосу
          </button>
        </fieldset>

        <label className="field-label">
          Ескертпе
          <textarea className="input mt-1 min-h-20" value={f.notes} onChange={set("notes")} placeholder="мыс. терезе алдында сөре бар, қыста жылыту батареясы терезе астында" />
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
