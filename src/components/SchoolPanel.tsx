"use client";

import { ArrowRight, BookOpen, MapPin, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { School } from "@/lib/types";
import { useDataMode, useEditGuard } from "./Providers";
import { ClassroomPhoto } from "./school/ClassroomPhoto";
import { CO2_NOTE, DataMeta } from "./school/ClassroomMonitor";
import { DataModeSwitch } from "./sensors/DataModeSwitch";
import { MeasurementForm } from "./sensors/MeasurementForm";
import { SensorCard } from "./sensors/SensorCard";
import { SensorChart } from "./sensors/SensorChart";
import { latestValue, useClassroomReadings } from "./sensors/useClassroomReadings";
import { METRICS } from "@/lib/metrics";
import { localDayKey } from "@/lib/time";
import { DemoBadge } from "./ui/Badge";

/** Басты беттегі мектеп панелі: экопаспорттың қысқаша көрінісі */
export function SchoolPanel({ school }: { school: School }) {
  const classroom = school.classrooms[0];
  const { mode } = useDataMode();
  const { readings, events } = useClassroomReadings(classroom.id, mode);
  const [formOpen, setFormOpen] = useState(false);
  const guard = useEditGuard();
  const lastDay = readings.length ? localDayKey(readings[readings.length - 1].timestamp) : null;

  return (
    <article aria-labelledby="school-title" className="flex flex-col gap-4">
      <header>
        <p className="text-sm font-semibold text-muted">Мектеп экопаспорты · {school.city}</p>
        <h2 id="school-title" className="font-serif text-2xl font-bold text-forest">
          {school.name}
        </h2>
        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted">
          <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden />
          {school.location.note}
        </p>
      </header>
      <section className="flex flex-col gap-3" aria-labelledby="bio-title">
        <h3 id="bio-title" className="font-serif text-xl font-bold text-forest">
          {classroom.name}
        </h3>
        <ClassroomPhoto classroom={classroom} compact />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-semibold">Кабинет мониторингі</h4>
          <DataModeSwitch />
        </div>
        {mode === "demo" && <DemoBadge className="self-start text-sm" />}
        <DataMeta readings={readings} mode={mode} narrow />
        {readings.length ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {METRICS.map((m) => (
                <SensorCard key={m.key} metric={m.key} latest={latestValue(readings, m.key)} compact />
              ))}
            </div>
            <p className="text-xs text-muted">{CO2_NOTE}</p>
            {lastDay && <SensorChart readings={readings} events={events} metric={readings.some((r) => r.co2Ppm !== null) ? "co2Ppm" : "temperatureC"} day={lastDay} mode={mode} height={210} showSummary={false} />}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-white px-4 py-4">
            <p className="font-semibold">Өлшем енгізілмеген</p>
            <button type="button" className="btn btn-primary mt-2" onClick={guard(() => setFormOpen(true))}>
              <PlusCircle size={18} aria-hidden /> Өлшем енгізу
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href={`/schools/${school.id}`} className="btn btn-primary">
            Толық мониторинг және графиктер <ArrowRight size={18} aria-hidden />
          </Link>
          <Link href="/journal" className="btn btn-soft">
            <BookOpen size={18} aria-hidden /> Зерттеу күнделігі
          </Link>
        </div>
      </section>
      {formOpen && <MeasurementForm open={formOpen} onClose={() => setFormOpen(false)} classroomId={classroom.id} />}
    </article>
  );
}
