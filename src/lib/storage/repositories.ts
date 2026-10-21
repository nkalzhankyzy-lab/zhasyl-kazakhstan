// Пайдаланушы деректерінің репозиторийлері.
// Екі қойма бар:
//   • Supabase (NEXT_PUBLIC_SUPABASE_URL және NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY берілсе) — ортақ дерекқор;
//   • localStorage (айнымалылар жоқ болса) — тек осы браузер.
// Интерфейс компоненттері тек осы файлдағы API-ді көреді.
// Демо деректер мұнда сақталмайды: олар src/data/demo ішінде, тек оқуға арналған.

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { getSupabase, SUPABASE_ENABLED } from "../supabase/client";
import type { DustTest, GardenPlant, LabResult, SurveyResponse, Lesson, ResearchEntry, Room, YardItem, SensorReading, SoilSample } from "../types";
import { localStore, STORAGE_PREFIX, type SaveResult } from "./kv";

type Listener = () => void;

export interface CollectionRepository<T extends { id: string }> {
  readonly key: string;
  list(): T[];
  get(id: string): T | undefined;
  upsert(item: T): Promise<SaveResult>;
  upsertMany(items: T[]): Promise<SaveResult>;
  remove(id: string): Promise<SaveResult>;
  replaceAll(items: T[]): Promise<SaveResult>;
  subscribe(fn: Listener): () => void;
}

/** Бір мәнді жазба (мысалы, кабинеттің ауыстырылған фотосы). */
export interface ValueRepository<T> {
  get(): T | null;
  set(v: T): Promise<SaveResult>;
  clear(): Promise<SaveResult>;
  subscribe(fn: Listener): () => void;
}

const EMPTY: never[] = [];
const OK: SaveResult = { ok: true };
const NO_CLIENT: SaveResult = { ok: false, reason: "unavailable", message: "Дерекқор тек браузерде қолжетімді." };

// ───────────────────────── Синхрондау күйі ─────────────────────────

export type SyncState = { state: "local" } | { state: "loading" } | { state: "ready" } | { state: "error"; message: string };

const SERVER_SYNC: SyncState = SUPABASE_ENABLED ? { state: "loading" } : { state: "local" };
let syncState: SyncState = SERVER_SYNC;
const syncListeners = new Set<Listener>();
const pending = new Set<string>();
const failed = new Map<string, string>();

function updateSync() {
  const next: SyncState = failed.size
    ? { state: "error", message: [...failed.values()][0] }
    : pending.size
      ? { state: "loading" }
      : { state: "ready" };
  const same = next.state === syncState.state && (next.state !== "error" || (syncState.state === "error" && next.message === syncState.message));
  if (!same) {
    syncState = next;
    syncListeners.forEach((l) => l());
  }
}

export const syncStatus = {
  get: () => syncState,
  getServer: () => SERVER_SYNC,
  subscribe(fn: Listener) {
    syncListeners.add(fn);
    return () => syncListeners.delete(fn);
  },
};

// ───────────────────────── Қате хабарламалары ─────────────────────────

export const FORBIDDEN_MESSAGE = "Деректі өзгерту құқығыңыз жоқ. Мұғалім (редактор) аккаунтымен кіріңіз.";
const NETWORK_MESSAGE = "Серверге қосылу мүмкін болмады. Интернет байланысын тексеріп, қайталаңыз.";

function toSaveError(error: Pick<PostgrestError, "code" | "message"> | Error | null | undefined): SaveResult {
  const code = error && "code" in error ? error.code : undefined;
  const msg = error?.message ?? "";
  if (code === "42501" || /row-level security|permission denied/i.test(msg)) return { ok: false, reason: "forbidden", message: FORBIDDEN_MESSAGE };
  if (code === "PGRST301" || code === "PGRST303" || /jwt/i.test(msg)) return { ok: false, reason: "forbidden", message: "Кіру мерзімі өтті. Қайта кіріңіз." };
  if (code === "23514") return { ok: false, reason: "unknown", message: "Жазба тым үлкен (мысалы, фото). Кішірек фото таңдап, қайталаңыз." };
  if (/failed to fetch|network|fetch failed|load failed/i.test(msg)) return { ok: false, reason: "network", message: NETWORK_MESSAGE };
  return { ok: false, reason: "unknown", message: `Сақтау мүмкін болмады${msg ? `: ${msg}` : "."}` };
}

async function safe(run: () => Promise<SaveResult>): Promise<SaveResult> {
  try {
    return await run();
  } catch (e) {
    return toSaveError(e as Error);
  }
}

function chunk<T>(xs: T[], n: number): T[][] {
  return Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));
}

// ───────────────────────── localStorage қоймасы ─────────────────────────

function createLocalCollection<T extends { id: string }>(key: string): CollectionRepository<T> {
  let cache: T[] | null = null;
  const listeners = new Set<Listener>();
  const notify = () => listeners.forEach((l) => l());
  const load = (): T[] => {
    if (cache) return cache;
    if (typeof window === "undefined") return EMPTY as T[];
    const v = localStore.read<T[]>(key);
    cache = Array.isArray(v) ? v : (EMPTY as T[]);
    return cache;
  };
  const save = async (next: T[]): Promise<SaveResult> => {
    const res = localStore.write(key, next);
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

function createLocalValue<T>(key: string): ValueRepository<T> {
  let cache: { v: T | null } | null = null;
  const listeners = new Set<Listener>();
  const notify = () => listeners.forEach((l) => l());
  return {
    get() {
      if (typeof window === "undefined") return null;
      if (!cache) cache = { v: localStore.read<T>(key) };
      return cache.v;
    },
    async set(v) {
      const res = localStore.write(key, v);
      if (res.ok) {
        cache = { v };
        notify();
      }
      return res;
    },
    async clear() {
      localStore.remove(key);
      cache = { v: null };
      notify();
      return OK;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

// ───────────────────────── Supabase қоймасы ─────────────────────────

interface TableSpec<T> {
  table: string;
  orderBy: string;
  /** data-дан бөлек бағандар (сүзу және сұрыптау үшін) */
  columns?: (item: T) => Record<string, unknown>;
}

type Row = { id: string; data: Record<string, unknown> };

function createRemoteCollection<T extends { id: string }>(key: string, spec: TableSpec<T>): CollectionRepository<T> {
  let cache: T[] = EMPTY as T[];
  let started = false;
  const listeners = new Set<Listener>();
  const notify = () => listeners.forEach((l) => l());
  const fromRow = (r: Row) => ({ ...(r.data as object), id: r.id }) as T;
  const toRow = (item: T) => ({ id: item.id, data: item, ...(spec.columns?.(item) ?? {}) });
  const setCache = (next: T[]) => {
    cache = next;
    notify();
  };
  const mergeIn = (items: T[]) => {
    const map = new Map(cache.map((x) => [x.id, x]));
    for (const it of items) map.set(it.id, it);
    setCache([...map.values()]);
  };
  const dropIds = (ids: string[]) => {
    const del = new Set(ids);
    if (cache.some((x) => del.has(x.id))) setCache(cache.filter((x) => !del.has(x.id)));
  };

  async function fetchAll(sb: SupabaseClient) {
    pending.add(key);
    updateSync();
    try {
      const page = 1000;
      const rows: Row[] = [];
      for (let from = 0; ; from += page) {
        const { data, error } = await sb.from(spec.table).select("id,data").order(spec.orderBy).order("id").range(from, from + page - 1);
        if (error) throw error;
        rows.push(...(data as Row[]));
        if (data.length < page) break;
      }
      failed.delete(key);
      setCache(rows.map(fromRow));
    } catch (e) {
      const res = toSaveError(e as Error);
      failed.set(key, `Деректерді жүктеу мүмкін болмады. ${res.ok ? "" : res.message}`);
    } finally {
      pending.delete(key);
      updateSync();
    }
  }

  function start() {
    if (started) return;
    const sb = getSupabase();
    if (!sb) return;
    started = true;
    void fetchAll(sb);
    // Басқа құрылғыдағы өзгерістер бірден көрінеді
    sb.channel(`zk:${spec.table}`)
      .on("postgres_changes", { event: "*", schema: "public", table: spec.table }, (p) => {
        if (p.eventType === "DELETE") {
          const id = (p.old as { id?: string }).id;
          if (id) dropIds([id]);
        } else {
          mergeIn([fromRow(p.new as Row)]);
        }
      })
      .subscribe();
    // Байланыс қалпына келгенде қайта жүктеу
    window.addEventListener("online", () => void fetchAll(sb));
  }

  const repo: CollectionRepository<T> = {
    key,
    list: () => cache,
    get: (id) => cache.find((x) => x.id === id),
    upsert: (item) => repo.upsertMany([item]),
    upsertMany: (items) =>
      safe(async () => {
        const sb = getSupabase();
        if (!sb) return NO_CLIENT;
        for (const part of chunk(items, 500)) {
          const { error } = await sb.from(spec.table).upsert(part.map(toRow));
          if (error) return toSaveError(error);
          mergeIn(part);
        }
        return OK;
      }),
    remove: (id) =>
      safe(async () => {
        const sb = getSupabase();
        if (!sb) return NO_CLIENT;
        const { data, error } = await sb.from(spec.table).delete().eq("id", id).select("id");
        if (error) return toSaveError(error);
        // RLS рұқсат бермесе, Postgres қате емес, бос нәтиже қайтарады
        if (!data.length && cache.some((x) => x.id === id)) return { ok: false, reason: "forbidden", message: FORBIDDEN_MESSAGE };
        dropIds([id]);
        return OK;
      }),
    replaceAll: (items) =>
      safe(async () => {
        const sb = getSupabase();
        if (!sb) return NO_CLIENT;
        const keep = new Set(items.map((x) => x.id));
        const toDelete = cache.filter((x) => !keep.has(x.id)).map((x) => x.id);
        for (const part of chunk(toDelete, 200)) {
          const { data, error } = await sb.from(spec.table).delete().in("id", part).select("id");
          if (error) return toSaveError(error);
          if (data.length < part.length) return { ok: false, reason: "forbidden", message: FORBIDDEN_MESSAGE };
          dropIds(part);
        }
        return items.length ? repo.upsertMany(items) : OK;
      }),
    subscribe(fn) {
      listeners.add(fn);
      start();
      return () => listeners.delete(fn);
    },
  };
  return repo;
}

const PHOTO_TABLE = "zk_classroom_photos";

function createRemotePhoto(classroomId: string): ValueRepository<string> {
  let value: string | null = null;
  let started = false;
  const listeners = new Set<Listener>();
  const notify = () => listeners.forEach((l) => l());
  const setValue = (v: string | null) => {
    value = v;
    notify();
  };
  function start() {
    if (started) return;
    const sb = getSupabase();
    if (!sb) return;
    started = true;
    void sb
      .from(PHOTO_TABLE)
      .select("photo")
      .eq("classroom_id", classroomId)
      .maybeSingle()
      .then(({ data }) => setValue((data as { photo: string } | null)?.photo ?? null));
    sb.channel(`zk:photo:${classroomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: PHOTO_TABLE, filter: `classroom_id=eq.${classroomId}` }, (p) => {
        setValue(p.eventType === "DELETE" ? null : ((p.new as { photo?: string }).photo ?? null));
      })
      .subscribe();
  }
  return {
    get: () => value,
    set: (v) =>
      safe(async () => {
        const sb = getSupabase();
        if (!sb) return NO_CLIENT;
        const { error } = await sb.from(PHOTO_TABLE).upsert({ classroom_id: classroomId, photo: v });
        if (error) return toSaveError(error);
        setValue(v);
        return OK;
      }),
    clear: () =>
      safe(async () => {
        const sb = getSupabase();
        if (!sb) return NO_CLIENT;
        const { data, error } = await sb.from(PHOTO_TABLE).delete().eq("classroom_id", classroomId).select("classroom_id");
        if (error) return toSaveError(error);
        if (!data.length && value) return { ok: false, reason: "forbidden", message: FORBIDDEN_MESSAGE };
        setValue(null);
        return OK;
      }),
    subscribe(fn) {
      listeners.add(fn);
      start();
      return () => listeners.delete(fn);
    },
  };
}

// ───────────────────────── Ортақ API ─────────────────────────

function collection<T extends { id: string }>(key: string, spec: TableSpec<T>): CollectionRepository<T> {
  return SUPABASE_ENABLED ? createRemoteCollection<T>(key, spec) : createLocalCollection<T>(key);
}

const photoRepos = new Map<string, ValueRepository<string>>();

export const repositories = {
  soilSamples: collection<SoilSample>("soil-samples", {
    table: "zk_soil_samples",
    orderBy: "created_at",
    columns: (s) => ({ region_id: s.regionId }),
  }),
  readings: collection<SensorReading>("sensor-readings", {
    table: "zk_sensor_readings",
    orderBy: "measured_at",
    columns: (r) => ({ classroom_id: r.classroomId, measured_at: r.timestamp }),
  }),
  journal: collection<ResearchEntry>("research-journal", { table: "zk_research_entries", orderBy: "created_at" }),
  garden: collection<GardenPlant>("garden-plants", { table: "zk_garden_plants", orderBy: "created_at" }),
  rooms: collection<Room>("rooms", { table: "zk_rooms", orderBy: "created_at" }),
  yard: collection<YardItem>("yard-items", { table: "zk_yard_items", orderBy: "created_at" }),
  lessons: collection<Lesson>("lessons", { table: "zk_lessons", orderBy: "created_at" }),
  survey: collection<SurveyResponse>("survey", { table: "zk_survey", orderBy: "created_at" }),
  dust: collection<DustTest>("dust", { table: "zk_dust", orderBy: "created_at" }),
  lab: collection<LabResult>("lab-results", { table: "zk_lab_results", orderBy: "created_at" }),
  classroomPhoto(classroomId: string) {
    let r = photoRepos.get(classroomId);
    if (!r) {
      r = SUPABASE_ENABLED ? createRemotePhoto(classroomId) : createLocalValue<string>(`classroom-photo:${classroomId}`);
      photoRepos.set(classroomId, r);
    }
    return r;
  },
};

async function allPhotos(): Promise<Record<string, string>> {
  const photos: Record<string, string> = {};
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from(PHOTO_TABLE).select("classroom_id,photo");
    if (error) throw error;
    for (const r of data as { classroom_id: string; photo: string }[]) photos[r.classroom_id] = r.photo;
    return photos;
  }
  for (const k of localStore.keys()) {
    if (k.startsWith("classroom-photo:")) {
      const v = localStore.read<string>(k);
      if (v) photos[k.slice("classroom-photo:".length)] = v;
    }
  }
  return photos;
}

/** Барлық пайдаланушы дерегін бір JSON ретінде жинау (экспорт). */
export async function exportAllUserData() {
  return {
    format: "zhasyl-kazakhstan-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    storage: SUPABASE_ENABLED ? "supabase" : "browser",
    note: "Тек пайдаланушы енгізген деректер. Демо деректер кірмейді.",
    soilSamples: repositories.soilSamples.list(),
    sensorReadings: repositories.readings.list(),
    researchJournal: repositories.journal.list(),
    gardenPlants: repositories.garden.list(),
    rooms: repositories.rooms.list(),
    yardItems: repositories.yard.list(),
    lessons: repositories.lessons.list(),
    survey: repositories.survey.list(),
    dust: repositories.dust.list(),
    labResults: repositories.lab.list(),
    classroomPhotos: await allPhotos(),
  };
}

/** Барлық пайдаланушы дерегін өшіру (растаудан кейін ғана шақырылады). */
export async function deleteAllUserData(): Promise<SaveResult> {
  const repos = [repositories.soilSamples, repositories.readings, repositories.journal, repositories.garden, repositories.rooms, repositories.yard, repositories.lessons, repositories.survey, repositories.dust, repositories.lab] as unknown as CollectionRepository<{ id: string }>[];
  for (const repo of repos) {
    const res = await repo.replaceAll([]);
    if (!res.ok) return res;
  }
  const photos = await allPhotos().catch(() => ({}));
  for (const id of Object.keys(photos)) {
    const res = await repositories.classroomPhoto(id).clear();
    if (!res.ok) return res;
  }
  return OK;
}

export function newId(prefix: string) {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}-${rnd}`;
}
