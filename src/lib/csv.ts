// CSV импорт/экспорт: кабинет өлшемдері.
// Үлгі: timestamp,co2_ppm,temperature_c,humidity_pct,pm25_ug_m3,occupants,ventilation,note

import { checkReading, parseOptionalNumber, type Issue } from "./metrics";
import { isoToLocalOffsetString, parseLocalTimestamp } from "./time";
import type { SensorReading, VentilationState } from "./types";

export const CSV_COLUMNS = ["timestamp", "co2_ppm", "temperature_c", "humidity_pct", "pm25_ug_m3", "occupants", "ventilation", "note"] as const;
export const CSV_HEADER = CSV_COLUMNS.join(",");
const BOM = "﻿";

/** ventilation бағанында қабылданатын мәндер */
export const VENTILATION_CSV_HELP = [
  ["closed / жабық", "терезе мен есік жабық"],
  ["window / терезе", "терезе ашық"],
  ["door / есік", "есік ашық"],
  ["window_door / терезе+есік", "екеуі де ашық"],
  ["airing / желдету", "осы сәтте желдету оқиғасы басталды (терезе ашылды)"],
] as const;

function parseVentilation(raw: string): { state: VentilationState | null; event: boolean } | "invalid" {
  const v = raw.trim().toLowerCase();
  if (!v) return { state: null, event: false };
  if (["closed", "жабық", "0"].includes(v)) return { state: "closed", event: false };
  if (["window", "терезе", "1"].includes(v)) return { state: "window", event: false };
  if (["door", "есік"].includes(v)) return { state: "door", event: false };
  if (["window_door", "терезе+есік", "both"].includes(v)) return { state: "window_door", event: false };
  if (["airing", "желдету", "ventilation"].includes(v)) return { state: "window", event: true };
  return "invalid";
}

const VENT_OUT: Record<VentilationState, string> = { closed: "closed", window: "window", door: "door", window_door: "window_door" };

/** RFC 4180 стиліндегі қарапайым талдағыш: тырнақшалар, жолішілік үтір, CRLF. */
export function parseCsvText(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

export interface PreviewRow {
  line: number;
  raw: Record<string, string>;
  reading: SensorReading | null;
  issues: Issue[];
}

export interface CsvPreview {
  delimiter: string;
  header: string[];
  missingColumns: string[];
  unknownColumns: string[];
  rows: PreviewRow[];
  fatal: string | null;
}

export function previewCsv(textIn: string, classroomId: string, makeId: () => string): CsvPreview {
  const text = textIn.startsWith(BOM) ? textIn.slice(1) : textIn;
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";
  const table = parseCsvText(text, delimiter);
  const empty: CsvPreview = { delimiter, header: [], missingColumns: [], unknownColumns: [], rows: [], fatal: null };
  if (!table.length) return { ...empty, fatal: "Файл бос." };
  const header = table[0].map((h) => h.trim().toLowerCase());
  const missingColumns = CSV_COLUMNS.filter((c) => !header.includes(c));
  const unknownColumns = header.filter((h) => !(CSV_COLUMNS as readonly string[]).includes(h));
  if (!header.includes("timestamp")) {
    return { ...empty, header, missingColumns, unknownColumns, fatal: "«timestamp» бағаны табылмады. Бірінші жол CSV үлгісіндегі тақырып жолы болуы керек." };
  }
  const rows: PreviewRow[] = table.slice(1).map((cells, idx) => {
    const raw: Record<string, string> = {};
    header.forEach((h, i) => (raw[h] = (cells[i] ?? "").trim()));
    const issues: Issue[] = [];
    if (cells.length > header.length && cells.slice(header.length).some((c) => c.trim()))
      issues.push({ field: "row", level: "error", message: "Жолда тақырыптағыдан көп баған бар (ескертпедегі үтірді тырнақшаға алыңыз)" });
    const ts = parseLocalTimestamp(raw.timestamp ?? "");
    if (!ts) issues.push({ field: "timestamp", level: "error", message: `Уақыт танылмады: «${raw.timestamp ?? ""}». Мысалы: 2026-10-14 09:05` });
    const num = (col: string, label: string) => {
      const n = parseOptionalNumber(raw[col]);
      if (Number.isNaN(n)) {
        issues.push({ field: col, level: "error", message: `${label}: «${raw[col]}» сан емес` });
        return null;
      }
      return n;
    };
    const co2 = num("co2_ppm", "CO₂");
    const t = num("temperature_c", "Температура");
    const h = num("humidity_pct", "Ылғалдылық");
    const pm = num("pm25_ug_m3", "PM2.5");
    const occ = num("occupants", "Оқушы саны");
    const vent = parseVentilation(raw.ventilation ?? "");
    if (vent === "invalid") issues.push({ field: "ventilation", level: "error", message: `ventilation мәні танылмады: «${raw.ventilation}»` });
    if (co2 === null && t === null && h === null && pm === null && !issues.some((i) => i.level === "error"))
      issues.push({ field: "row", level: "warning", message: "Бірде-бір датчик мәні жоқ — тек ескертпе/желдету жазбасы ретінде сақталады" });
    const base = { co2Ppm: co2, temperatureC: t, humidityPct: h, pm25UgM3: pm, occupants: occ };
    issues.push(...checkReading(base));
    const hasError = issues.some((i) => i.level === "error");
    const reading: SensorReading | null =
      hasError || !ts || vent === "invalid"
        ? null
        : {
            id: makeId(),
            classroomId,
            status: "user",
            timestamp: ts,
            ...base,
            ventilation: vent.state,
            ventilationEvent: vent.event,
            note: raw.note ?? "",
            source: "csv",
          };
    return { line: idx + 2, raw, reading, issues };
  });
  return { delimiter, header, missingColumns, unknownColumns, rows, fatal: rows.length ? null : "Тақырыптан кейін дерек жолдары жоқ." };
}

const q = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const n = (v: number | null) => (v === null ? "" : String(v));

export function readingsToCsv(readings: SensorReading[]): string {
  const lines = [...readings]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((r) =>
      [
        isoToLocalOffsetString(r.timestamp),
        n(r.co2Ppm),
        n(r.temperatureC),
        n(r.humidityPct),
        n(r.pm25UgM3),
        n(r.occupants),
        r.ventilationEvent ? "airing" : r.ventilation ? VENT_OUT[r.ventilation] : "",
        q(r.note ?? ""),
      ].join(","),
    );
  return BOM + [CSV_HEADER, ...lines].join("\r\n") + "\r\n";
}

export const csvTemplate = () => BOM + CSV_HEADER + "\r\n";

export function downloadText(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
