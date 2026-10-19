"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { checkReading, formatValue, VENTILATION_LABELS } from "@/lib/metrics";
import { repositories } from "@/lib/storage/repositories";
import { formatDateTime } from "@/lib/time";
import type { SensorReading } from "@/lib/types";
import { useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";
import { MeasurementForm } from "./MeasurementForm";

export function ReadingsTable({ readings, classroomId }: { readings: SensorReading[]; classroomId: string }) {
  const [edit, setEdit] = useState<SensorReading | null>(null);
  const [del, setDel] = useState<SensorReading | null>(null);
  const feedback = useSaveFeedback();
  const rows = [...readings].reverse();
  return (
    <div>
      <div className="max-h-[420px] overflow-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Енгізілген өлшемдер</caption>
          <thead className="sticky top-0 z-[1] bg-sand-2 text-xs">
            <tr>
              <th className="px-3 py-2">Уақыт</th>
              <th className="px-2 py-2">CO₂, ppm</th>
              <th className="px-2 py-2">°C</th>
              <th className="px-2 py-2">Ылғ., %</th>
              <th className="px-2 py-2">PM2.5</th>
              <th className="px-2 py-2">Оқушы</th>
              <th className="px-2 py-2">Терезе/есік</th>
              <th className="px-2 py-2">Ескертпе</th>
              <th className="px-2 py-2">
                <span className="sr-only">Әрекеттер</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const issues = checkReading(r);
              return (
                <tr key={r.id} className={`border-t border-line ${issues.length ? "bg-orange-50/70" : ""}`}>
                  <td className="px-3 py-1.5">
                    {formatDateTime(r.timestamp)}
                    <span className="block text-[11px] text-muted">{r.source === "csv" ? "CSV" : "қолмен"}</span>
                  </td>
                  <td className="px-2 py-1.5">{formatValue(r.co2Ppm, "co2Ppm")}</td>
                  <td className="px-2 py-1.5">{formatValue(r.temperatureC, "temperatureC")}</td>
                  <td className="px-2 py-1.5">{formatValue(r.humidityPct, "humidityPct")}</td>
                  <td className="px-2 py-1.5">{formatValue(r.pm25UgM3, "pm25UgM3")}</td>
                  <td className="px-2 py-1.5">{r.occupants ?? "—"}</td>
                  <td className="px-2 py-1.5">
                    {r.ventilation ? VENTILATION_LABELS[r.ventilation] : "—"}
                    {r.ventilationEvent && <span className="block text-[11px] font-semibold text-sky-700">желдету оқиғасы</span>}
                  </td>
                  <td className="px-2 py-1.5">
                    {r.note}
                    {issues.map((i) => (
                      <span key={i.message} className="block text-[12px] text-orange-900">
                        ⚠ {i.message}
                      </span>
                    ))}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <button type="button" className="rounded-lg p-2 text-forest hover:bg-mint" aria-label="Өңдеу" onClick={() => setEdit(r)}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" className="rounded-lg p-2 text-alert hover:bg-red-50" aria-label="Жою" onClick={() => setDel(r)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {edit && <MeasurementForm open={!!edit} onClose={() => setEdit(null)} classroomId={classroomId} initial={edit} />}
      <Dialog
        open={!!del}
        onClose={() => setDel(null)}
        title="Өлшемді жою"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDel(null)}>
              Бас тарту
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (del) feedback(repositories.readings.remove(del.id), "Өлшем жойылды");
                setDel(null);
              }}
            >
              Иә, жою
            </button>
          </>
        }
      >
        <p>{del ? `${formatDateTime(del.timestamp)} уақытындағы өлшем жойылады.` : ""}</p>
      </Dialog>
    </div>
  );
}
