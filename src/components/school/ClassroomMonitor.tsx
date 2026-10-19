"use client";

import { Download, Info, PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { DEMO_SCENARIO_TEXT } from "@/data/demo/sensor-demo";
import { downloadText, readingsToCsv } from "@/lib/csv";
import { METRICS } from "@/lib/metrics";
import { formatDateTime, formatDayKey, localDayKey, TZ_LABEL } from "@/lib/time";
import type { Classroom, MetricKey } from "@/lib/types";
import { useHydrated, useSyncStatus } from "@/lib/storage/hooks";
import { STORAGE_WHERE } from "@/lib/supabase/client";
import { useDataMode, useEditGuard } from "../Providers";
import { CsvImport } from "../sensors/CsvImport";
import { DataModeSwitch } from "../sensors/DataModeSwitch";
import { MeasurementForm } from "../sensors/MeasurementForm";
import { ReadingsTable } from "../sensors/ReadingsTable";
import { SensorCard } from "../sensors/SensorCard";
import { SensorChart } from "../sensors/SensorChart";
import { latestValue, useClassroomReadings } from "../sensors/useClassroomReadings";
import { DemoBadge } from "../ui/Badge";

export const CO2_NOTE = "CO₂ — желдетуді бағалауға көмектесетін жанама көрсеткіш.";

export function DataMeta({ readings, mode, narrow }: { readings: { timestamp: string }[]; mode: "demo" | "user"; narrow?: boolean }) {
  const first = readings[0]?.timestamp;
  const last = readings[readings.length - 1]?.timestamp;
  return (
    <dl className={`grid gap-2 text-sm ${narrow ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
      <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-line">
        <dt className="text-xs text-muted">Дерек режимі</dt>
        <dd className="font-semibold">{mode === "demo" ? "Демо — нақты өлшем емес" : "Мен енгізген өлшемдер"}</dd>
      </div>
      <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-line">
        <dt className="text-xs text-muted">Өлшенген уақыт</dt>
        <dd className="font-semibold">{first ? `${formatDayKey(localDayKey(first))}${localDayKey(first) !== localDayKey(last!) ? ` – ${formatDayKey(localDayKey(last!))}` : ""}` : "—"}</dd>
      </div>
      <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-line">
        <dt className="text-xs text-muted">Соңғы жазба</dt>
        <dd className="font-semibold">{last ? formatDateTime(last) : "—"}</dd>
      </div>
      <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-line">
        <dt className="text-xs text-muted">Дереккөз</dt>
        <dd className="font-semibold">{mode === "demo" ? "Алдын ала дайындалған көрсетілім сценарийі" : "Қолмен енгізу және CSV импорт (датчик қосылмаған)"}</dd>
      </div>
    </dl>
  );
}

export function ClassroomMonitor({ classroom }: { classroom: Classroom }) {
  const { mode } = useDataMode();
  const { readings, events } = useClassroomReadings(classroom.id, mode);
  const [metric, setMetric] = useState<MetricKey>("co2Ppm");
  const [formOpen, setFormOpen] = useState(false);
  const guard = useEditGuard();
  const days = useMemo(() => [...new Set(readings.map((r) => localDayKey(r.timestamp)))].sort(), [readings]);
  const [dayPick, setDayPick] = useState<string | null>(null);
  const day = dayPick && days.includes(dayPick) ? dayPick : days[days.length - 1];
  const empty = readings.length === 0;
  const sync = useSyncStatus();
  const loadingUser = mode === "user" && empty && sync.state === "loading";
  // Күн/уақыт пішімі браузердің тілдік параметрлеріне байланысты — гидратациядан кейін ғана сызамыз
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <section aria-busy="true" className="flex min-h-[420px] items-center justify-center text-muted">
        Мониторинг жүктелуде…
      </section>
    );
  }

  return (
    <section aria-labelledby="monitor-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="monitor-title" className="font-serif text-2xl font-bold text-forest">
          Кабинет мониторингі
        </h2>
        <DataModeSwitch />
      </div>

      {mode === "demo" && (
        <div className="sticky top-[118px] z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50/95 px-4 py-2.5 shadow-sm backdrop-blur lg:top-[72px]" role="note">
          <DemoBadge />
          <span className="text-sm text-amber-950">{DEMO_SCENARIO_TEXT}</span>
        </div>
      )}

      <DataMeta readings={readings} mode={mode} />

      {loadingUser ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-5 py-6 text-muted" aria-busy="true">Өлшемдер дерекқордан жүктелуде…</p>
      ) : mode === "user" && empty && sync.state === "error" ? (
        <p className="rounded-2xl bg-orange-50 px-5 py-4 text-orange-950" role="alert">{sync.message}</p>
      ) : empty ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line bg-white px-5 py-6">
          <p className="text-lg font-semibold">Өлшем енгізілмеген</p>
          <p className="text-sm text-muted">Датчик көрсеткішін қолмен енгізіңіз немесе CSV файлын импорттаңыз. Деректер {STORAGE_WHERE} сақталады.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={guard(() => setFormOpen(true))}>
              <PlusCircle size={18} aria-hidden /> Өлшем енгізу
            </button>
            <CsvImport classroomId={classroom.id} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {METRICS.map((m) => (
              <SensorCard key={m.key} metric={m.key} latest={latestValue(readings, m.key)} active={metric === m.key} onClick={() => setMetric(m.key)} />
            ))}
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-950">
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              {CO2_NOTE} Ол оттегі деңгейін көрсетпейді. Әр көрсеткіш бөлек беріледі; «қауіпсіз/қауіпті» деп жіктеу үшін тексерілген нормативтік шектер әлі қосылмаған.
            </span>
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div role="tablist" aria-label="Көрсеткіш" className="flex flex-wrap gap-1">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  role="tab"
                  type="button"
                  aria-selected={metric === m.key}
                  onClick={() => setMetric(m.key)}
                  className={`min-h-10 rounded-xl border px-3 text-sm font-semibold ${metric === m.key ? "border-forest bg-forest text-white" : "border-line bg-white hover:bg-mint"}`}
                >
                  {m.short}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <label htmlFor="day-pick" className="field-label">
                Таңдалған күн
              </label>
              <select id="day-pick" className="input !min-h-10 !py-1.5" value={day} onChange={(e) => setDayPick(e.target.value)}>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {formatDayKey(d)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {day && <SensorChart readings={readings} events={events} metric={metric} day={day} mode={mode} height={320} />}
          <p className="text-xs text-muted">Уақыт: {TZ_LABEL}. Бос мәндер графикте нөл болып сызылмайды; дерек үзілісі сұр аймақпен белгіленеді.</p>
        </>
      )}

      {mode === "user" && !empty && (
        <section aria-labelledby="entered-title" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="entered-title" className="font-serif text-xl font-bold text-forest">
              Енгізілген өлшемдер ({readings.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={guard(() => setFormOpen(true))}>
                <PlusCircle size={18} aria-hidden /> Өлшем енгізу
              </button>
              <CsvImport classroomId={classroom.id} />
              <button type="button" className="btn btn-ghost" onClick={() => downloadText(`kabinet-olshemder-${new Date().toISOString().slice(0, 10)}.csv`, readingsToCsv(readings))}>
                <Download size={18} aria-hidden /> CSV экспорттау
              </button>
            </div>
          </div>
          <ReadingsTable readings={readings} classroomId={classroom.id} />
        </section>
      )}
      {mode === "demo" && (
        <p className="text-sm text-muted">
          Өз өлшемдеріңізді енгізу үшін жоғарыдан «Мен енгізген өлшемдер» режимін таңдаңыз. Демо деректер өңделмейді және экспортталмайды.
        </p>
      )}
      {formOpen && <MeasurementForm open={formOpen} onClose={() => setFormOpen(false)} classroomId={classroom.id} onSaved={(r) => setDayPick(localDayKey(r.timestamp))} />}
    </section>
  );
}
