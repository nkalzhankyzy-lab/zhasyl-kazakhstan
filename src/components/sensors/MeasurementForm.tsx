"use client";

import { useState, type FormEvent } from "react";
import { checkReading, parseOptionalNumber, VENTILATION_LABELS, type Issue } from "@/lib/metrics";
import { newId, repositories } from "@/lib/storage/repositories";
import { isoToInputValue, nowInputValue, parseLocalTimestamp, TZ_LABEL } from "@/lib/time";
import type { SensorReading, VentilationState } from "@/lib/types";
import { keepFieldVisible } from "@/lib/ui";
import { useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  classroomId: string;
  initial?: SensorReading | null;
  onSaved?: (r: SensorReading) => void;
}

export function MeasurementForm({ open, onClose, classroomId, initial, onSaved }: Props) {
  const [f, setF] = useState(() => ({
    when: initial ? isoToInputValue(initial.timestamp) : nowInputValue(),
    co2: initial?.co2Ppm?.toString() ?? "",
    temp: initial?.temperatureC?.toString() ?? "",
    hum: initial?.humidityPct?.toString() ?? "",
    pm: initial?.pm25UgM3?.toString() ?? "",
    occ: initial?.occupants?.toString() ?? "",
    vent: (initial?.ventilation ?? "") as VentilationState | "",
    event: initial?.ventilationEvent ?? false,
    note: initial?.note ?? "",
  }));
  const [issues, setIssues] = useState<Issue[]>([]);
  const [confirmWarn, setConfirmWarn] = useState(false);
  const feedback = useSaveFeedback();
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setConfirmWarn(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const ts = parseLocalTimestamp(f.when);
    const nums = { co2Ppm: parseOptionalNumber(f.co2), temperatureC: parseOptionalNumber(f.temp), humidityPct: parseOptionalNumber(f.hum), pm25UgM3: parseOptionalNumber(f.pm), occupants: parseOptionalNumber(f.occ) };
    const list: Issue[] = [];
    if (!ts) list.push({ field: "when", level: "error", message: "Күн мен уақытты көрсетіңіз" });
    const LABELS: Record<string, string> = { co2Ppm: "CO₂", temperatureC: "Температура", humidityPct: "Ылғалдылық", pm25UgM3: "PM2.5", occupants: "Оқушы саны" };
    for (const [k, v] of Object.entries(nums)) if (Number.isNaN(v)) list.push({ field: k, level: "error", message: `${LABELS[k]}: сан енгізіңіз` });
    const clean = Object.fromEntries(Object.entries(nums).map(([k, v]) => [k, Number.isNaN(v) ? null : v])) as typeof nums;
    list.push(...checkReading(clean));
    if (clean.co2Ppm === null && clean.temperatureC === null && clean.humidityPct === null && clean.pm25UgM3 === null && !f.event && !f.note.trim())
      list.push({ field: "row", level: "error", message: "Кемінде бір көрсеткішті, желдету оқиғасын немесе ескертпені енгізіңіз" });
    setIssues(list);
    if (list.some((i) => i.level === "error")) return;
    if (list.some((i) => i.level === "warning") && !confirmWarn) {
      setConfirmWarn(true);
      return;
    }
    const reading: SensorReading = {
      id: initial?.id ?? newId("reading"),
      classroomId,
      status: "user",
      timestamp: ts!,
      ...clean,
      ventilation: f.vent || null,
      ventilationEvent: f.event,
      note: f.note.trim(),
      source: initial?.source ?? "manual",
    };
    if (feedback(repositories.readings.upsert(reading), initial ? "Өлшем жаңартылды" : "Өлшем сақталды")) {
      onSaved?.(reading);
      onClose();
    }
  };

  const hasWarn = issues.some((i) => i.level === "warning");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? "Өлшемді өңдеу" : "Өлшем енгізу"}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Бас тарту
          </button>
          <button type="submit" form="measure-form" className="btn btn-primary">
            {confirmWarn && hasWarn ? "Мәндер дұрыс — сақтау" : "Сақтау"}
          </button>
        </>
      }
    >
      <form id="measure-form" noValidate onSubmit={submit} onFocus={keepFieldVisible} className="grid gap-4 sm:grid-cols-2">
        <p className="rounded-xl bg-mint px-3 py-2 text-sm text-forest sm:col-span-2">
          Барлық көрсеткіш міндетті емес. Мысалы, PM2.5 датчигі болмаса, өрісті бос қалдырыңыз — бос мән нөл болып сақталмайды.
        </p>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="m-when">Күн және уақыт *</label>
          <input id="m-when" type="datetime-local" className="input" value={f.when} onChange={set("when")} />
          <p className="field-hint">Уақыт белдеуі: {TZ_LABEL}</p>
        </div>
        {(
          [
            ["co2", "CO₂, ppm", "мыс. 850"],
            ["temp", "Температура, °C", "мыс. 22.5"],
            ["hum", "Салыстырмалы ылғалдылық, %", "мыс. 40"],
            ["pm", "PM2.5, мкг/м³", "датчик болмаса бос"],
          ] as const
        ).map(([k, label, ph]) => (
          <div key={k}>
            <label className="field-label" htmlFor={`m-${k}`}>{label}</label>
            <input id={`m-${k}`} className="input" inputMode="decimal" value={f[k]} onChange={set(k)} placeholder={ph} />
          </div>
        ))}
        <div>
          <label className="field-label" htmlFor="m-occ">Оқушы саны</label>
          <input id="m-occ" className="input" inputMode="numeric" value={f.occ} onChange={set("occ")} />
        </div>
        <div>
          <label className="field-label" htmlFor="m-vent">Терезе / есік жағдайы</label>
          <select id="m-vent" className="input" value={f.vent} onChange={set("vent")}>
            <option value="">Белгісіз / көрсетілмеген</option>
            {Object.entries(VENTILATION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-line bg-white px-3 sm:col-span-2">
          <input type="checkbox" className="h-5 w-5 accent-forest" checked={f.event} onChange={(e) => setF((x) => ({ ...x, event: e.target.checked }))} />
          <span className="text-[15px]">Осы сәтте желдету оқиғасы басталды (графикте белгіленеді)</span>
        </label>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="m-note">Ескертпе</label>
          <textarea id="m-note" className="input" value={f.note} onChange={set("note")} placeholder="Мысалы: 3-сабақ, зертханалық жұмыс" />
        </div>
        {issues.length > 0 && (
          <ul className="space-y-1 rounded-xl bg-orange-50 px-3 py-2 text-sm sm:col-span-2" role="alert">
            {issues.map((i) => (
              <li key={i.message} className={i.level === "error" ? "font-semibold text-alert" : "text-orange-900"}>
                {i.level === "error" ? "✖" : "⚠"} {i.message}
              </li>
            ))}
            {hasWarn && !issues.some((i) => i.level === "error") && (
              <li className="text-orange-900">Мәндер өзгертілмейді. Дұрыс болса, «Мәндер дұрыс — сақтау» батырмасын басыңыз.</li>
            )}
          </ul>
        )}
      </form>
    </Dialog>
  );
}
