"use client";

import { Download, FileUp, Upload } from "lucide-react";
import { useState } from "react";
import { CSV_HEADER, csvTemplate, downloadText, previewCsv, VENTILATION_CSV_HELP, type CsvPreview } from "@/lib/csv";
import { formatValue } from "@/lib/metrics";
import { useCollection } from "@/lib/storage/hooks";
import { newId, repositories } from "@/lib/storage/repositories";
import { formatDateTime, TZ_LABEL } from "@/lib/time";
import { useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";

export function CsvImport({ classroomId }: { classroomId: string }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const [encodingWarn, setEncodingWarn] = useState(false);
  const [includeWarnings, setIncludeWarnings] = useState(true);
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const existing = useCollection(repositories.readings).filter((r) => r.classroomId === classroomId && r.status === "user");
  const feedback = useSaveFeedback();

  const reset = () => {
    setPreview(null);
    setFileName("");
    setEncodingWarn(false);
    setConfirmReplace(false);
  };

  const onFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setPreview({ delimiter: ",", header: [], missingColumns: [], unknownColumns: [], rows: [], fatal: "Файл тым үлкен (5 МБ-тан асады). Деректі бірнеше файлға бөліңіз." });
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setEncodingWarn(text.includes("�"));
      setPreview(previewCsv(text, classroomId, () => newId("reading")));
    };
    reader.readAsText(file, "utf-8");
  };

  const ok = preview?.rows.filter((r) => r.reading && !r.issues.some((i) => i.level === "warning")) ?? [];
  const warn = preview?.rows.filter((r) => r.reading && r.issues.some((i) => i.level === "warning")) ?? [];
  const bad = preview?.rows.filter((r) => !r.reading) ?? [];
  const toImport = [...ok, ...(includeWarnings ? warn : [])].map((r) => r.reading!);

  const doImport = () => {
    if (mode === "replace" && existing.length && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    let items = toImport;
    let skipped = 0;
    if (mode === "append") {
      const seen = new Set(existing.map((r) => r.timestamp));
      items = toImport.filter((r) => {
        if (seen.has(r.timestamp)) {
          skipped++;
          return false;
        }
        seen.add(r.timestamp);
        return true;
      });
    }
    const others = repositories.readings.list().filter((r) => r.classroomId !== classroomId);
    const res = mode === "replace" ? repositories.readings.replaceAll([...others, ...items]) : repositories.readings.upsertMany(items);
    if (feedback(res, `${items.length} жол импортталды${skipped ? `, уақыты қайталанған ${skipped} жол өткізілді` : ""}`)) {
      setOpen(false);
      reset();
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-soft" onClick={() => setOpen(true)}>
          <Upload size={18} aria-hidden /> CSV импорттау
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => downloadText("zhasyl-kazakhstan-ulgi.csv", csvTemplate())}>
          <Download size={18} aria-hidden /> CSV үлгісін жүктеу
        </button>
      </div>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="CSV импорттау"
        size="xl"
        footer={
          preview && !preview.fatal ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={reset}>
                Басқа файл
              </button>
              <button type="button" className={confirmReplace ? "btn btn-danger" : "btn btn-primary"} disabled={!toImport.length} onClick={doImport}>
                {confirmReplace ? `Иә, бар ${existing.length} жазбаны алмастыру` : `${toImport.length} жолды импорттау`}
              </button>
            </>
          ) : undefined
        }
      >
        {!preview ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-mint px-4 py-3 text-sm">
              <p className="font-semibold text-forest">Файл талаптары</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                <li>Кодтауы UTF-8 (Excel-де: «CSV UTF-8» ретінде сақтаңыз). Бөлгіш — үтір немесе нүктелі үтір.</li>
                <li>
                  Бірінші жол: <code className="rounded bg-white px-1 text-[13px]">{CSV_HEADER}</code>
                </li>
                <li>Уақыт мысалы: 2026-10-14 09:05 немесе 14.10.2026 09:05. Белдеу көрсетілмесе, {TZ_LABEL} деп саналады.</li>
                <li>Бос ұяшық — «өлшем жоқ», нөл емес.</li>
                <li>
                  ventilation:{" "}
                  {VENTILATION_CSV_HELP.map(([v, d]) => (
                    <span key={v} className="mr-2 inline-block">
                      <code className="rounded bg-white px-1 text-[13px]">{v}</code> — {d};
                    </span>
                  ))}
                </li>
              </ul>
              <p className="mt-2 text-xs text-muted">Мысал жол: 2026-10-14 09:05,820,22.4,41,,24,closed,2-сабақ</p>
            </div>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-mint-2 bg-white px-4 py-8 text-center hover:bg-mint/40">
              <FileUp size={32} className="text-forest" aria-hidden />
              <span className="font-semibold text-forest">CSV файлын таңдаңыз</span>
              <span className="text-sm text-muted">Импорт алдында алдын ала қарау көрсетіледі</span>
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
        ) : preview.fatal ? (
          <div className="rounded-2xl bg-orange-50 px-4 py-3 text-orange-950" role="alert">
            <p className="font-semibold">Файлды оқу мүмкін болмады</p>
            <p className="text-sm">{preview.fatal}</p>
            <button type="button" className="btn btn-ghost mt-3" onClick={reset}>
              Басқа файл таңдау
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">
              <strong>{fileName}</strong> · бөлгіш «{preview.delimiter}» · жол саны: {preview.rows.length}
            </p>
            {encodingWarn && (
              <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-900" role="alert">
                ⚠ Файлда танылмаған таңбалар бар — кодтауы UTF-8 емес болуы мүмкін. Қазақ әріптері бұзылса, файлды «CSV UTF-8» ретінде қайта сақтаңыз.
              </p>
            )}
            {(preview.missingColumns.length > 0 || preview.unknownColumns.length > 0) && (
              <p className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-950">
                {preview.missingColumns.length > 0 && <>Жоқ бағандар (бос деп саналады): {preview.missingColumns.join(", ")}. </>}
                {preview.unknownColumns.length > 0 && <>Танылмаған бағандар (елемейміз): {preview.unknownColumns.join(", ")}.</>}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl bg-emerald-50 px-3 py-2">
                <div className="text-xs text-muted">Дұрыс</div>
                <div className="text-lg font-bold">{ok.length}</div>
              </div>
              <div className="rounded-xl bg-orange-50 px-3 py-2">
                <div className="text-xs text-muted">Тексеруді қажет етеді</div>
                <div className="text-lg font-bold">{warn.length}</div>
              </div>
              <div className="rounded-xl bg-red-50 px-3 py-2">
                <div className="text-xs text-muted">Қате (импортталмайды)</div>
                <div className="text-lg font-bold">{bad.length}</div>
              </div>
            </div>
            <div className="max-h-[42dvh] overflow-auto rounded-2xl border border-line">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="sticky top-0 bg-sand-2 text-xs">
                  <tr>
                    <th className="px-2 py-2">Жол</th>
                    <th className="px-2 py-2">Уақыт</th>
                    <th className="px-2 py-2">CO₂</th>
                    <th className="px-2 py-2">°C</th>
                    <th className="px-2 py-2">%</th>
                    <th className="px-2 py-2">PM2.5</th>
                    <th className="px-2 py-2">Оқушы</th>
                    <th className="px-2 py-2">Желдету</th>
                    <th className="px-2 py-2">Мәртебе</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 300).map((r) => {
                    const err = !r.reading;
                    const w = r.issues.some((i) => i.level === "warning");
                    return (
                      <tr key={r.line} className={`border-t border-line align-top ${err ? "bg-red-50/70" : w ? "bg-orange-50/70" : ""}`}>
                        <td className="px-2 py-1.5 text-muted">{r.line}</td>
                        <td className="px-2 py-1.5">{r.reading ? formatDateTime(r.reading.timestamp) : r.raw.timestamp}</td>
                        <td className="px-2 py-1.5">{r.reading ? formatValue(r.reading.co2Ppm, "co2Ppm") : r.raw.co2_ppm}</td>
                        <td className="px-2 py-1.5">{r.reading ? formatValue(r.reading.temperatureC, "temperatureC") : r.raw.temperature_c}</td>
                        <td className="px-2 py-1.5">{r.reading ? formatValue(r.reading.humidityPct, "humidityPct") : r.raw.humidity_pct}</td>
                        <td className="px-2 py-1.5">{r.reading ? formatValue(r.reading.pm25UgM3, "pm25UgM3") : r.raw.pm25_ug_m3}</td>
                        <td className="px-2 py-1.5">{r.reading?.occupants ?? r.raw.occupants ?? "—"}</td>
                        <td className="px-2 py-1.5">{r.raw.ventilation || "—"}</td>
                        <td className="px-2 py-1.5">
                          {r.issues.length === 0 ? (
                            <span className="text-emerald-800">дұрыс</span>
                          ) : (
                            <ul className="space-y-0.5">
                              {r.issues.map((i) => (
                                <li key={i.message} className={i.level === "error" ? "text-alert" : "text-orange-900"}>
                                  {i.level === "error" ? "✖" : "⚠"} {i.message}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {preview.rows.length > 300 && <p className="text-xs text-muted">Алғашқы 300 жол көрсетілді. Импорт барлық жолға қолданылады.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-line bg-white px-3 py-2.5">
                <input type="checkbox" className="mt-0.5 h-5 w-5 accent-forest" checked={includeWarnings} onChange={(e) => setIncludeWarnings(e.target.checked)} />
                <span className="text-sm">
                  Тексеруді қажет ететін {warn.length} жолды да импорттау. Мәндер өзгертілмейді, тек белгіленеді.
                </span>
              </label>
              <fieldset className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
                <legend className="px-1 font-semibold">Бар деректермен не істеу керек?</legend>
                <label className="flex items-center gap-2 py-0.5">
                  <input type="radio" name="csv-mode" className="h-4 w-4 accent-forest" checked={mode === "append"} onChange={() => (setMode("append"), setConfirmReplace(false))} />
                  Қосу (уақыты қайталанған жолдар өткізіледі)
                </label>
                <label className="flex items-center gap-2 py-0.5">
                  <input type="radio" name="csv-mode" className="h-4 w-4 accent-forest" checked={mode === "replace"} onChange={() => setMode("replace")} />
                  Алмастыру (осы кабинеттің бар {existing.length} жазбасы өшіріледі)
                </label>
              </fieldset>
            </div>
            {confirmReplace && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-alert" role="alert">
                Назар аударыңыз: осы кабинеттің бұрын енгізілген {existing.length} өлшемі өшіріліп, файлдағы деректермен алмастырылады. Алдымен CSV экспорттап алуды ұсынамыз.
              </p>
            )}
            <p className="text-xs text-muted">Импортталған деректер «Мен енгізген өлшемдер» режимінде ғана көрінеді және демо деректермен араласпайды.</p>
          </div>
        )}
      </Dialog>
    </>
  );
}
