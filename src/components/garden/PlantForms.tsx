"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { compressImage, dataUrlKb } from "@/lib/image";
import { parseOptionalNumber } from "@/lib/metrics";
import { newId, repositories } from "@/lib/storage/repositories";
import { todayLocalDate } from "@/lib/time";
import type { GardenPlant, PlantLog } from "@/lib/types";
import { keepFieldVisible } from "@/lib/ui";
import { useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";

/** Гүл қосу / өңдеу */
export function PlantForm({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: GardenPlant | null;
}) {
  const [f, setF] = useState(() => ({
    name: initial?.name ?? "",
    location: initial?.location ?? "",
    plantedAt: initial?.plantedAt ?? todayLocalDate(),
    notes: initial?.notes ?? "",
  }));
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const feedback = useSaveFeedback();
  const saving = useRef(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  async function onPhoto(file?: File) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      setPhoto(await compressImage(file, 900, 0.72));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setErr("Гүлдің атауын жазыңыз");
    if (!f.plantedAt) return setErr("Отырғызылған күнін көрсетіңіз");
    if (saving.current) return;
    saving.current = true;
    const now = new Date().toISOString();
    const plant: GardenPlant = {
      id: initial?.id ?? newId("plant"),
      status: "user",
      name: f.name.trim(),
      location: f.location.trim(),
      plantedAt: f.plantedAt,
      photo,
      notes: f.notes.trim(),
      logs: initial?.logs ?? [],
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    const ok = await feedback(
      repositories.garden.upsert(plant),
      initial ? "Гүл жаңартылды" : "Гүл қосылды",
    );
    saving.current = false;
    if (ok) onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? "Гүлді өңдеу" : "Гүл қосу"}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Бас тарту
          </button>
          <button
            type="submit"
            form="plant-form"
            className="btn btn-primary"
            disabled={busy}
          >
            Сақтау
          </button>
        </>
      }
    >
      <form
        id="plant-form"
        noValidate
        onSubmit={submit}
        onFocus={keepFieldVisible}
        className="grid gap-4"
      >
        <div>
          <label className="field-label" htmlFor="p-name">
            Гүлдің атауы *
          </label>
          <input
            id="p-name"
            className="input"
            value={f.name}
            onChange={set("name")}
            placeholder="мыс. Хлорофитум"
            maxLength={80}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="p-loc">
            Қай жерде өседі
          </label>
          <input
            id="p-loc"
            className="input"
            value={f.location}
            onChange={set("location")}
            placeholder="мыс. Биология кабинеті, терезе жаны"
            maxLength={120}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="p-date">
            Отырғызылған күні *
          </label>
          <input
            id="p-date"
            type="date"
            className="input"
            value={f.plantedAt}
            onChange={set("plantedAt")}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="p-notes">
            Ескертпе
          </label>
          <textarea
            id="p-notes"
            className="input"
            rows={2}
            value={f.notes}
            onChange={set("notes")}
            placeholder="Кім күтеді, қайдан әкелінді"
            maxLength={500}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="Гүлдің жүктелген фотосы"
              className="h-20 w-28 rounded-xl object-cover"
            />
          )}
          <label className="btn btn-soft cursor-pointer">
            <Camera size={17} aria-hidden />{" "}
            {busy ? "Ықшамдалуда…" : photo ? "Фотоны ауыстыру" : "Фото қосу"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onPhoto(e.target.files?.[0])}
            />
          </label>
          {photo && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPhoto(null)}
            >
              <Trash2 size={16} aria-hidden /> Фотоны алып тастау
            </button>
          )}
          {photo && (
            <span className="text-sm text-muted">~{dataUrlKb(photo)} КБ</span>
          )}
        </div>
        {err && (
          <p role="alert" className="text-sm font-semibold text-alert">
            {err}
          </p>
        )}
      </form>
    </Dialog>
  );
}

/** Бақылау жазбасын қосу */
export function LogForm({
  open,
  onClose,
  plant,
}: {
  open: boolean;
  onClose: () => void;
  plant: GardenPlant;
}) {
  const [f, setF] = useState({
    date: todayLocalDate(),
    height: "",
    leaves: "",
    watered: true,
    note: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const feedback = useSaveFeedback();
  const saving = useRef(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const heightCm = parseOptionalNumber(f.height);
    const leaves = parseOptionalNumber(f.leaves);
    if (!f.date) return setErr("Күнін көрсетіңіз");
    if (
      Number.isNaN(heightCm) ||
      (heightCm !== null && (heightCm < 0 || heightCm > 500))
    )
      return setErr("Биіктік: 0–500 см аралығындағы сан жазыңыз");
    if (
      Number.isNaN(leaves) ||
      (leaves !== null &&
        (leaves < 0 || leaves > 2000 || !Number.isInteger(leaves)))
    )
      return setErr("Жапырақ саны: бүтін сан жазыңыз");
    if (heightCm === null && leaves === null && !f.watered && !f.note.trim())
      return setErr("Кемінде бір бақылау жазыңыз");
    if (saving.current) return;
    saving.current = true;
    const entry: PlantLog = {
      id: newId("log"),
      date: f.date,
      heightCm,
      leaves,
      watered: f.watered,
      note: f.note.trim(),
    };
    const next: GardenPlant = {
      ...plant,
      logs: [...plant.logs, entry],
      updatedAt: new Date().toISOString(),
    };
    const ok = await feedback(
      repositories.garden.upsert(next),
      "Бақылау сақталды",
    );
    saving.current = false;
    if (ok) onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Бақылау: ${plant.name}`}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Бас тарту
          </button>
          <button type="submit" form="log-form" className="btn btn-primary">
            Сақтау
          </button>
        </>
      }
    >
      <form
        id="log-form"
        noValidate
        onSubmit={submit}
        onFocus={keepFieldVisible}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="l-date">
            Күні *
          </label>
          <input
            id="l-date"
            type="date"
            className="input"
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="l-h">
            Биіктігі, см
          </label>
          <input
            id="l-h"
            className="input"
            inputMode="decimal"
            value={f.height}
            onChange={(e) => setF({ ...f, height: e.target.value })}
            placeholder="мыс. 15.5"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="l-l">
            Жапырақ саны
          </label>
          <input
            id="l-l"
            className="input"
            inputMode="numeric"
            value={f.leaves}
            onChange={(e) => setF({ ...f, leaves: e.target.value })}
            placeholder="мыс. 12"
          />
        </div>
        <label className="flex items-center gap-2 text-[15px] sm:col-span-2">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--color-forest)]"
            checked={f.watered}
            onChange={(e) => setF({ ...f, watered: e.target.checked })}
          />
          Бүгін суарылды
        </label>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="l-n">
            Бақылау
          </label>
          <textarea
            id="l-n"
            className="input"
            rows={2}
            value={f.note}
            onChange={(e) => setF({ ...f, note: e.target.value })}
            placeholder="мыс. Жаңа жапырақ шықты, топырағы құрғақ"
            maxLength={300}
          />
        </div>
        <p className="text-sm text-muted sm:col-span-2">
          Биіктікті құмыраның шетінен ең биік жапыраққа дейін сызғышпен өлшеңіз.
          Әр жолы бірдей әдіспен өлшеу маңызды.
        </p>
        {err && (
          <p
            role="alert"
            className="text-sm font-semibold text-alert sm:col-span-2"
          >
            {err}
          </p>
        )}
      </form>
    </Dialog>
  );
}
