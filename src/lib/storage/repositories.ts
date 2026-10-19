// Пайдаланушы деректерінің репозиторийлері.
// Демо деректер мұнда сақталмайды: олар src/data/demo ішінде, тек оқуға арналған.

import type { ResearchEntry, SensorReading, SoilSample } from "../types";
import { localStore, STORAGE_PREFIX, type KeyValueStore, type SaveResult } from "./kv";

type Listener = () => void;

export interface CollectionRepository<T extends { id: string }> {
  readonly key: string;
  list(): T[];
  get(id: string): T | undefined;
  upsert(item: T): SaveResult;
  upsertMany(items: T[]): SaveResult;
  remove(id: string): SaveResult;
  replaceAll(items: T[]): SaveResult;
  subscribe(fn: Listener): () => void;
}

const EMPTY: never[] = [];

function createCollection<T extends { id: string }>(key: string, store: KeyValueStore): CollectionRepository<T> {
  let cache: T[] | null = null;
  const listeners = new Set<Listener>();
  const notify = () => listeners.forEach((l) => l());
  const load = (): T[] => {
    if (cache) return cache;
    if (typeof window === "undefined") return EMPTY as T[];
    const v = store.read<T[]>(key);
    cache = Array.isArray(v) ? v : (EMPTY as T[]);
    return cache;
  };
  const save = (next: T[]): SaveResult => {
    const res = store.write(key, next);
    if (res.ok) {
      cache = next;
      notify();
    }
    return res;
  };
  if (typeof window !== "undefined") {
    // Басқа қойындыда өзгерсе — жаңарту
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_PREFIX + key || e.key === null) {
        cache = null;
        notify();
      }
    });
  }
  return {
    key,
    list: load,
    get: (id) => load().find((x) => x.id === id),
    upsert(item) {
      const cur = load();
      const i = cur.findIndex((x) => x.id === item.id);
      return save(i === -1 ? [...cur, item] : cur.map((x) => (x.id === item.id ? item : x)));
    },
    upsertMany(items) {
      const map = new Map(load().map((x) => [x.id, x]));
      for (const it of items) map.set(it.id, it);
      return save([...map.values()]);
    },
    remove(id) {
      return save(load().filter((x) => x.id !== id));
    },
    replaceAll(items) {
      return save(items);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** Бір мәнді жазба (мысалы, кабинеттің ауыстырылған фотосы). */
export interface ValueRepository<T> {
  get(): T | null;
  set(v: T): SaveResult;
  clear(): void;
  subscribe(fn: Listener): () => void;
}

function createValue<T>(key: string, store: KeyValueStore): ValueRepository<T> {
  let cache: { v: T | null } | null = null;
  const listeners = new Set<Listener>();
  const notify = () => listeners.forEach((l) => l());
  return {
    get() {
      if (typeof window === "undefined") return null;
      if (!cache) cache = { v: store.read<T>(key) };
      return cache.v;
    },
    set(v) {
      const res = store.write(key, v);
      if (res.ok) {
        cache = { v };
        notify();
      }
      return res;
    },
    clear() {
      store.remove(key);
      cache = { v: null };
      notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

const photoRepos = new Map<string, ValueRepository<string>>();

export const repositories = {
  soilSamples: createCollection<SoilSample>("soil-samples", localStore),
  readings: createCollection<SensorReading>("sensor-readings", localStore),
  journal: createCollection<ResearchEntry>("research-journal", localStore),
  classroomPhoto(classroomId: string) {
    let r = photoRepos.get(classroomId);
    if (!r) {
      r = createValue<string>(`classroom-photo:${classroomId}`, localStore);
      photoRepos.set(classroomId, r);
    }
    return r;
  },
};

/** Барлық пайдаланушы дерегін бір JSON ретінде жинау (экспорт). */
export function exportAllUserData() {
  const photos: Record<string, string> = {};
  for (const k of localStore.keys()) {
    if (k.startsWith("classroom-photo:")) {
      const v = localStore.read<string>(k);
      if (v) photos[k.slice("classroom-photo:".length)] = v;
    }
  }
  return {
    format: "zhasyl-kazakhstan-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    note: "Тек пайдаланушы енгізген деректер. Демо деректер кірмейді.",
    soilSamples: repositories.soilSamples.list(),
    sensorReadings: repositories.readings.list(),
    researchJournal: repositories.journal.list(),
    classroomPhotos: photos,
  };
}

/** Барлық пайдаланушы дерегін өшіру (растаудан кейін ғана шақырылады). */
export function deleteAllUserData() {
  repositories.soilSamples.replaceAll([]);
  repositories.readings.replaceAll([]);
  repositories.journal.replaceAll([]);
  for (const k of localStore.keys()) {
    if (k.startsWith("classroom-photo:")) repositories.classroomPhoto(k.slice("classroom-photo:".length)).clear();
  }
}

export function newId(prefix: string) {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}-${rnd}`;
}
