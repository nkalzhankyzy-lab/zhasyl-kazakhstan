"use client";

import { useEffect, useState } from "react";

// Сыртқы ауа райы: Open-Meteo (тегін, кілтсіз). Қызылорда қаласының координаты.
export const WEATHER_LAT = 44.85;
export const WEATHER_LON = 65.51;
export const WEATHER_PLACE = "Қызылорда";
export const WEATHER_SOURCE = "Open-Meteo";
const TZ = "Asia%2FQyzylorda";

export interface Outdoor {
  t: number;
  rh: number;
}

/** "YYYY-MM-DDTHH" (жергілікті уақыт) → сыртқы ауа */
export type OutdoorMap = Record<string, Outdoor>;

const cache = new Map<string, Promise<OutdoorMap>>();

function parseHourly(j: unknown): OutdoorMap {
  const h = (j as { hourly?: { time?: string[]; temperature_2m?: (number | null)[]; relative_humidity_2m?: (number | null)[] } }).hourly;
  const out: OutdoorMap = {};
  if (!h?.time) return out;
  h.time.forEach((t, i) => {
    const temp = h.temperature_2m?.[i];
    const rh = h.relative_humidity_2m?.[i];
    if (typeof temp === "number" && typeof rh === "number") out[t.slice(0, 13)] = { t: temp, rh };
  });
  return out;
}

async function getJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

/** Күндер аралығының сағаттық ауа райы. Алдымен болжам API (соңғы ~3 ай), болмаса мұрағат. */
export function fetchOutdoorRange(start: string, end: string): Promise<OutdoorMap> {
  const key = `${start}_${end}`;
  let p = cache.get(key);
  if (!p) {
    const q = `latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&hourly=temperature_2m,relative_humidity_2m&timezone=${TZ}&start_date=${start}&end_date=${end}`;
    p = getJson(`https://api.open-meteo.com/v1/forecast?${q}`)
      .then(parseHourly)
      .then((m) => (Object.keys(m).length ? m : Promise.reject(new Error("empty"))))
      .catch(() => getJson(`https://archive-api.open-meteo.com/v1/archive?${q}`).then(parseHourly))
      .catch(() => {
        cache.delete(key);
        return {};
      });
    cache.set(key, p);
  }
  return p;
}

/** Сабақ ортасындағы сағат кілті */
export function lessonHourKey(date: string, time: string, durationMin: number) {
  const [h, m] = time.split(":").map(Number);
  const mid = Math.round(h + (m + durationMin / 2) / 60);
  return `${date}T${String(Math.min(23, mid)).padStart(2, "0")}`;
}

/** Берілген күндердің ауа райын жүктейді */
export function useOutdoor(dates: string[]): OutdoorMap {
  const [map, setMap] = useState<OutdoorMap>({});
  const sorted = [...new Set(dates)].sort();
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  useEffect(() => {
    if (!start || !end) return;
    let alive = true;
    void fetchOutdoorRange(start, end).then((m) => alive && setMap(m));
    return () => {
      alive = false;
    };
  }, [start, end]);
  return map;
}

/** Қазіргі ауа райы */
export function useCurrentOutdoor(): (Outdoor & { time: string }) | null | "error" {
  const [v, setV] = useState<(Outdoor & { time: string }) | null | "error">(null);
  useEffect(() => {
    let alive = true;
    getJson(`https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&current=temperature_2m,relative_humidity_2m&timezone=${TZ}`)
      .then((j: { current?: { time: string; temperature_2m: number; relative_humidity_2m: number } }) => {
        if (!alive) return;
        const c = j.current;
        setV(c ? { t: c.temperature_2m, rh: c.relative_humidity_2m, time: c.time } : "error");
      })
      .catch(() => alive && setV("error"));
    return () => {
      alive = false;
    };
  }, []);
  return v;
}

/** Сыртқы температураға қарай желдету кеңесі */
export function ventTipForOutdoor(t: number): string {
  if (t < -5) return `Сыртта ${t.toFixed(0)} °C, аяз. Терезені ұзақ ашпаңыз: үзілісте 3–5 минутқа кең ашып, бөлмені тез желдетіңіз. Сонда қабырға мен жиһаз суымайды.`;
  if (t < 10) return `Сыртта ${t.toFixed(0)} °C, салқын. Үзілісте 5–10 минут кең ашып желдетіңіз, сабақ кезінде форточка жеткілікті.`;
  if (t <= 28) return `Сыртта ${t.toFixed(0)} °C, жайлы. Терезені сабақ кезінде де ашық ұстауға болады.`;
  return `Сыртта ${t.toFixed(0)} °C, ыстық. Таңертең және кешке желдетіңіз, түсте терезені жауып, перде түсіріңіз.`;
}
