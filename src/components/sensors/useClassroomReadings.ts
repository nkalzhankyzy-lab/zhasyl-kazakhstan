"use client";

import { useMemo } from "react";
import { DEMO_READINGS } from "@/data/demo/sensor-demo";
import { useCollection } from "@/lib/storage/hooks";
import { repositories } from "@/lib/storage/repositories";
import type { MetricKey, SensorReading, VentilationEvent } from "@/lib/types";
import type { DataMode } from "../Providers";

/**
 * Режимге сәйкес өлшемдер. Демо мен пайдаланушы дерегі ешқашан араластырылмайды:
 * демо режимінде тек DEMO_READINGS, «Мен енгізген» режимінде тек localStorage жазбалары.
 */
export function useClassroomReadings(classroomId: string, mode: DataMode) {
  const user = useCollection(repositories.readings);
  return useMemo(() => {
    const src = mode === "demo" ? DEMO_READINGS : user.filter((r) => r.status === "user");
    const readings = src.filter((r) => r.classroomId === classroomId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const events: VentilationEvent[] = readings
      .filter((r) => r.ventilationEvent)
      .map((r) => ({ id: `ev-${r.id}`, classroomId, status: r.status, timestamp: r.timestamp, description: r.note || "Желдету" }));
    return { readings, events };
  }, [user, mode, classroomId]);
}

/** Әр көрсеткіштің ең соңғы бос емес мәні */
export function latestValue(readings: SensorReading[], k: MetricKey) {
  for (let i = readings.length - 1; i >= 0; i--) {
    const v = readings[i][k];
    if (v !== null) return { value: v, timestamp: readings[i].timestamp };
  }
  return null;
}
