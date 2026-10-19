// Төменгі деңгейдегі кілт-мән қоймасы. Қазір — браузердің localStorage.
// Болашақта серверлік дерекқорға ауысқанда тек осы қабат пен repositories.ts ауысады,
// интерфейс компоненттері өзгермейді.

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: "quota" | "unavailable" | "unknown"; message: string };

export interface KeyValueStore {
  read<T>(key: string): T | null;
  write(key: string, value: unknown): SaveResult;
  remove(key: string): void;
  keys(): string[];
  usageBytes(): number;
}

export const STORAGE_PREFIX = "zhasyl-kz:v1:";

function isQuotaError(e: unknown) {
  return (
    e instanceof DOMException &&
    (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22 || e.code === 1014)
  );
}

export const QUOTA_MESSAGE =
  "Браузердегі жергілікті сақтау орны толды. Деректерді экспорттап, ескі фотоларды немесе жазбаларды өшіріңіз, содан кейін қайталаңыз.";

export const localStore: KeyValueStore = {
  read<T>(key: string) {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  write(key, value) {
    if (typeof window === "undefined") return { ok: false, reason: "unavailable", message: "Сақтау тек браузерде жұмыс істейді." };
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return { ok: true };
    } catch (e) {
      if (isQuotaError(e)) return { ok: false, reason: "quota", message: QUOTA_MESSAGE };
      return { ok: false, reason: "unknown", message: "Деректі сақтау мүмкін болмады. Браузер жергілікті сақтауға рұқсат бере ме, тексеріңіз." };
    }
  },
  remove(key) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      /* елемейміз */
    }
  },
  keys() {
    if (typeof window === "undefined") return [];
    const res: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) res.push(k.slice(STORAGE_PREFIX.length));
    }
    return res;
  },
  usageBytes() {
    if (typeof window === "undefined") return 0;
    let total = 0;
    for (const k of this.keys()) total += ((window.localStorage.getItem(STORAGE_PREFIX + k) ?? "").length + k.length) * 2;
    return total;
  },
};
