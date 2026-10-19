"use client";

import { Download, HardDrive, Trash2 } from "lucide-react";
import { useState } from "react";
import { downloadText, readingsToCsv } from "@/lib/csv";
import { useCollection, useHydrated } from "@/lib/storage/hooks";
import { localStore } from "@/lib/storage/kv";
import { deleteAllUserData, exportAllUserData, repositories } from "@/lib/storage/repositories";
import { useToast } from "./Providers";
import { Dialog } from "./ui/Dialog";

const CONFIRM_WORD = "ӨШІРУ";

export function DataManager() {
  const samples = useCollection(repositories.soilSamples);
  const readings = useCollection(repositories.readings);
  const journal = useCollection(repositories.journal);
  const hydrated = useHydrated();
  const [confirm, setConfirm] = useState(false);
  const [word, setWord] = useState("");
  const toast = useToast();
  const usedKb = hydrated ? Math.round(localStore.usageBytes() / 1024) : 0;
  // usageBytes жазбалар өзгергенде қайта есептеледі
  void samples;
  void journal;

  const stats = [
    ["Топырақ үлгілері", samples.length],
    ["Кабинет өлшемдері", readings.length],
    ["Күнделік жазбалары", journal.length],
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-2xl bg-mint px-4 py-3 text-forest">
        <strong>Деректер осы браузерде сақталады.</strong> Аккаунт жоқ, сервер жоқ: басқа құрылғыда немесе басқа браузерде олар көрінбейді. Браузер деректерін тазаласаңыз, олар жойылады — сондықтан жиі экспорттап отырыңыз.
      </p>
      <dl className="grid gap-3 sm:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="card px-4 py-3">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="text-2xl font-bold text-forest">{v}</dd>
          </div>
        ))}
        <div className="card px-4 py-3">
          <dt className="flex items-center gap-1 text-sm text-muted">
            <HardDrive size={14} aria-hidden /> Пайдаланылған орын
          </dt>
          <dd className="text-2xl font-bold text-forest">~{usedKb} КБ</dd>
          <dd className="text-xs text-muted">Браузер шегі әдетте ~5 МБ</dd>
        </div>
      </dl>
      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-serif text-xl font-bold text-forest">Экспорттау</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => downloadText(`zhasyl-kazakhstan-derekter-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(exportAllUserData(), null, 2), "application/json")}
          >
            <Download size={18} aria-hidden /> Барлық дерек (JSON)
          </button>
          <button
            type="button"
            className="btn btn-soft"
            disabled={!readings.length}
            onClick={() => downloadText(`kabinet-olshemder-${new Date().toISOString().slice(0, 10)}.csv`, readingsToCsv(readings))}
          >
            <Download size={18} aria-hidden /> Кабинет өлшемдері (CSV)
          </button>
        </div>
        <p className="text-sm text-muted">JSON файлына топырақ үлгілері (фотоларымен), өлшемдер, күнделік және кабинеттің жүктелген фотосы кіреді. Демо деректер кірмейді.</p>
      </section>
      <section className="card flex flex-col gap-3 border-red-200 p-5">
        <h2 className="font-serif text-xl font-bold text-alert">Барлық пайдаланушы дерегін өшіру</h2>
        <p className="text-sm text-muted">Бұл әрекетті қайтару мүмкін емес. Демо деректер мен анықтамалық ақпарат сақталады.</p>
        <button type="button" className="btn btn-danger self-start" onClick={() => setConfirm(true)}>
          <Trash2 size={18} aria-hidden /> Барлығын өшіру
        </button>
      </section>
      <Dialog
        open={confirm}
        onClose={() => (setConfirm(false), setWord(""))}
        title="Барлық деректі өшіруді растаңыз"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => (setConfirm(false), setWord(""))}>
              Бас тарту
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={word.trim().toUpperCase() !== CONFIRM_WORD}
              onClick={() => {
                deleteAllUserData();
                setConfirm(false);
                setWord("");
                toast("ok", "Барлық пайдаланушы дерегі өшірілді");
              }}
            >
              Біржола өшіру
            </button>
          </>
        }
      >
        <p>
          {samples.length} топырақ үлгісі, {readings.length} өлшем және {journal.length} күнделік жазбасы осы браузерден өшіріледі.
        </p>
        <label className="field-label mt-3" htmlFor="confirm-word">
          Растау үшін <strong>{CONFIRM_WORD}</strong> сөзін жазыңыз
        </label>
        <input id="confirm-word" className="input" value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" />
      </Dialog>
    </div>
  );
}
