// Уақыт белдеуі: Asia/Qyzylorda.
// 2018-12-21 бастап Asia/Qyzylorda = UTC+05:00 (жазғы уақыт жоқ). Ішкі сақтау — ISO 8601 UTC.

export const TIME_ZONE = "Asia/Qyzylorda";
export const TZ_OFFSET_MIN = 5 * 60;
export const TZ_LABEL = "Asia/Qyzylorda (UTC+05:00)";

const pad = (n: number) => String(n).padStart(2, "0");

/** Жергілікті (Қызылорда) күн-уақыт бөліктерінен UTC ISO жолын жасайды. */
export function localPartsToIso(y: number, mo: number, d: number, h = 0, mi = 0, s = 0): string | null {
  const ms = Date.UTC(y, mo - 1, d, h, mi, s) - TZ_OFFSET_MIN * 60_000;
  const date = new Date(ms);
  if (Number.isNaN(ms)) return null;
  // Жоқ күндерді (мысалы 31.02) ұстау
  const back = new Date(ms + TZ_OFFSET_MIN * 60_000);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  if (h > 23 || mi > 59 || s > 59) return null;
  return date.toISOString();
}

/** UTC ISO → Қызылорда уақытымен бөліктер. */
export function isoToLocalParts(iso: string) {
  const t = new Date(new Date(iso).getTime() + TZ_OFFSET_MIN * 60_000);
  return {
    y: t.getUTCFullYear(),
    mo: t.getUTCMonth() + 1,
    d: t.getUTCDate(),
    h: t.getUTCHours(),
    mi: t.getUTCMinutes(),
    s: t.getUTCSeconds(),
  };
}

/** "YYYY-MM-DD" — Қызылорда уақыты бойынша күн кілті. */
export function localDayKey(iso: string): string {
  const p = isoToLocalParts(iso);
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}`;
}

/** datetime-local өрісіне арналған мән. */
export function isoToInputValue(iso: string): string {
  const p = isoToLocalParts(iso);
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`;
}

/** Экспортқа: "2026-10-14T09:05:00+05:00" */
export function isoToLocalOffsetString(iso: string): string {
  const p = isoToLocalParts(iso);
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}+05:00`;
}

/**
 * Пайдаланушы немесе CSV берген уақытты талдайды.
 * Қабылданады: ISO белдеуімен (Z, +05:00), "YYYY-MM-DD HH:mm[:ss]", "YYYY-MM-DDTHH:mm",
 * "DD.MM.YYYY HH:mm[:ss]". Белдеусіз мән Asia/Qyzylorda уақыты деп саналады.
 */
export function parseLocalTimestamp(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/);
  if (m) {
    const [, y, mo, d, h, mi, s, tz] = m;
    if (tz) {
      const norm = tz === "Z" ? "Z" : tz.length === 5 ? `${tz.slice(0, 3)}:${tz.slice(3)}` : tz;
      const ms = Date.parse(`${y}-${mo}-${d}T${pad(+h)}:${mi}:${s ?? "00"}${norm}`);
      return Number.isNaN(ms) ? null : new Date(ms).toISOString();
    }
    return localPartsToIso(+y, +mo, +d, +h, +mi, s ? +s : 0);
  }
  m = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [, d, mo, y, h, mi, s] = m;
    return localPartsToIso(+y, +mo, +d, +h, +mi, s ? +s : 0);
  }
  return null;
}

// Күн атауларын өзіміз пішімдейміз: кейбір браузерлерде "kk" локалі толық емес,
// ал сервер мен браузердің нәтижесі бірдей болуы керек.
export const MONTHS_KK = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];

export const formatDayKey = (dayKey: string) => {
  const [y, m, d] = dayKey.split("-").map(Number);
  if (!y || !m || !d) return dayKey;
  return `${d} ${MONTHS_KK[m - 1]} ${y} ж.`;
};
export const formatTime = (iso: string) => {
  const p = isoToLocalParts(iso);
  return `${pad(p.h)}:${pad(p.mi)}`;
};
export const formatDateTime = (iso: string) => `${formatDayKey(localDayKey(iso))}, ${formatTime(iso)}`;
export const formatDate = (ymd: string) => (ymd ? formatDayKey(ymd) : "—");

export function todayLocalDate(): string {
  return localDayKey(new Date().toISOString());
}
export function nowInputValue(): string {
  return isoToInputValue(new Date().toISOString());
}
