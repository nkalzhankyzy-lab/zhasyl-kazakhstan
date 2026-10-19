"use client";

import { BookOpen, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { DEMO_SOIL_SAMPLES } from "@/data/demo/soil-samples-demo";
import { MAIN_CLASSROOM } from "@/data/schools";
import { parseOptionalNumber } from "@/lib/metrics";
import { useCollection } from "@/lib/storage/hooks";
import { newId, repositories } from "@/lib/storage/repositories";
import { formatDate, todayLocalDate } from "@/lib/time";
import type { ResearchEntry, SoilSample } from "@/lib/types";
import { keepFieldVisible } from "@/lib/ui";
import { useEditGuard, useSaveFeedback } from "../Providers";
import { SoilSampleForm } from "../soil/SoilSampleForm";
import { SoilSampleCard } from "../soil/SoilSampleList";
import { Badge } from "../ui/Badge";
import { Dialog } from "../ui/Dialog";

const KIND_LABEL: Record<ResearchEntry["kind"], string> = { classroom: "Кабинет зерттеуі", soil: "Топырақ зерттеуі", general: "Жалпы зерттеу" };

function emptyForm(kind: ResearchEntry["kind"]) {
  return {
    kind,
    subjectId: kind === "classroom" ? MAIN_CLASSROOM.id : "",
    question: "",
    hypothesis: "",
    date: todayLocalDate(),
    observations: "",
    possibleExplanations: "",
    actions: "",
    conclusion: "",
    lessonTime: "",
    occupants: "",
    ventilation: "",
    lightNoiseNote: "",
    comfortable: "",
    neutral: "",
    uncomfortable: "",
  };
}
type F = ReturnType<typeof emptyForm>;

function toForm(e: ResearchEntry): F {
  const c = e.classroom;
  const s = (n: number | null | undefined) => (n == null ? "" : String(n));
  return {
    kind: e.kind,
    subjectId: e.subjectId ?? "",
    question: e.question,
    hypothesis: e.hypothesis,
    date: e.date,
    observations: e.observations,
    possibleExplanations: e.possibleExplanations,
    actions: e.actions,
    conclusion: e.conclusion,
    lessonTime: c?.lessonTime ?? "",
    occupants: s(c?.occupants),
    ventilation: c?.ventilation ?? "",
    lightNoiseNote: c?.lightNoiseNote ?? "",
    comfortable: s(c?.comfort.comfortable),
    neutral: s(c?.comfort.neutral),
    uncomfortable: s(c?.comfort.uncomfortable),
  };
}

function EntryForm({ open, onClose, initial, samples }: { open: boolean; onClose: () => void; initial: ResearchEntry | null; samples: SoilSample[] }) {
  const [f, setF] = useState<F>(() => (initial ? toForm(initial) : emptyForm("classroom")));
  const [error, setError] = useState<string | null>(null);
  const feedback = useSaveFeedback();
  const saving = useRef(false);
  const set = (k: keyof F) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.question.trim()) return setError("Зерттеу сұрағын жазыңыз");
    const nums = [f.occupants, f.comfortable, f.neutral, f.uncomfortable].map(parseOptionalNumber);
    if (nums.some((n) => Number.isNaN(n) || (n !== null && (n < 0 || !Number.isInteger(n))))) return setError("Оқушы саны мен бағалау сандары — теріс емес бүтін сан");
    const now = new Date().toISOString();
    const entry: ResearchEntry = {
      id: initial?.id ?? newId("journal"),
      kind: f.kind,
      subjectId: f.subjectId || null,
      question: f.question.trim(),
      hypothesis: f.hypothesis.trim(),
      date: f.date,
      observations: f.observations.trim(),
      possibleExplanations: f.possibleExplanations.trim(),
      actions: f.actions.trim(),
      conclusion: f.conclusion.trim(),
      classroom:
        f.kind === "classroom"
          ? {
              lessonTime: f.lessonTime.trim(),
              occupants: nums[0],
              ventilation: f.ventilation.trim(),
              lightNoiseNote: f.lightNoiseNote.trim(),
              comfort: { comfortable: nums[1], neutral: nums[2], uncomfortable: nums[3] },
            }
          : undefined,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    if (saving.current) return;
    saving.current = true;
    const ok = await feedback(repositories.journal.upsert(entry), initial ? "Жазба жаңартылды" : "Жазба күнделікке қосылды");
    saving.current = false;
    if (ok) onClose();
  };

  // Компонент емес, функция: әр рендерде өріс қайта құрылып, фокус жоғалмас үшін
  const textField = ({ k, label, hint, rows }: { k: keyof F; label: string; hint?: string; rows?: number }) => (
    <div className="sm:col-span-2">
      <label className="field-label" htmlFor={`j-${k}`}>
        {label}
      </label>
      <textarea id={`j-${k}`} className="input" rows={rows ?? 3} value={f[k]} onChange={set(k)} />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? "Жазбаны өңдеу" : "Жаңа зерттеу жазбасы"}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Бас тарту
          </button>
          <button type="submit" form="journal-form" className="btn btn-primary">
            Сақтау
          </button>
        </>
      }
    >
      <form id="journal-form" onSubmit={submit} noValidate onFocus={keepFieldVisible} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="j-kind">Зерттеу түрі</label>
          <select id="j-kind" className="input" value={f.kind} onChange={(e) => setF((x) => ({ ...x, kind: e.target.value as F["kind"], subjectId: e.target.value === "classroom" ? MAIN_CLASSROOM.id : "" }))}>
            {Object.entries(KIND_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="j-date">Күні</label>
          <input id="j-date" type="date" className="input" value={f.date} onChange={set("date")} />
        </div>
        {f.kind === "soil" && (
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="j-subject">Топырақ үлгісі</label>
            <select id="j-subject" className="input" value={f.subjectId} onChange={set("subjectId")}>
              <option value="">— таңдалмаған —</option>
              {samples.map((s) => (
                <option key={s.id} value={s.id}>{s.status === "demo" ? "[Демо] " : ""}{s.name}</option>
              ))}
            </select>
          </div>
        )}
        {f.kind === "classroom" && <p className="rounded-xl bg-mint px-3 py-2 text-sm text-forest sm:col-span-2">Нысан: {MAIN_CLASSROOM.name}, №23 мектеп-лицей</p>}
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="j-question">Зерттеу сұрағы *</label>
          <input id="j-question" className="input" value={f.question} onChange={set("question")} placeholder="Мысалы: Үзілісте терезе ашу CO₂ көрсеткішіне қалай әсер етеді?" />
        </div>
        {textField({ k: "hypothesis", label: "Болжам", rows: 2, })}
        {f.kind === "classroom" && (
          <fieldset className="grid gap-3 rounded-2xl border border-line p-3 sm:col-span-2 sm:grid-cols-2">
            <legend className="px-1 text-sm font-semibold">Кабинет зерттеуіне қосымша</legend>
            <div>
              <label className="field-label" htmlFor="j-lesson">Сабақ уақыты</label>
              <input id="j-lesson" className="input" value={f.lessonTime} onChange={set("lessonTime")} placeholder="мыс. 2-сабақ, 08:55–09:40" />
            </div>
            <div>
              <label className="field-label" htmlFor="j-occ">Оқушы саны</label>
              <input id="j-occ" className="input" inputMode="numeric" value={f.occupants} onChange={set("occupants")} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="j-vent">Желдету жағдайы</label>
              <input id="j-vent" className="input" value={f.ventilation} onChange={set("ventilation")} placeholder="мыс. үзілісте 10 минут терезе ашылды" />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="j-ln">Жарық пен шу туралы ескертпе</label>
              <input id="j-ln" className="input" value={f.lightNoiseNote} onChange={set("lightNoiseNote")} />
            </div>
            <div className="sm:col-span-2">
              <span className="field-label">Жайлылықтың аты-жөнсіз жинақталған бағасы (оқушы саны)</span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["comfortable", "Жайлы"],
                    ["neutral", "Орташа"],
                    ["uncomfortable", "Жайсыз"],
                  ] as const
                ).map(([k, l]) => (
                  <div key={k}>
                    <label className="text-xs text-muted" htmlFor={`j-${k}`}>{l}</label>
                    <input id={`j-${k}`} className="input" inputMode="numeric" value={f[k]} onChange={set(k)} />
                  </div>
                ))}
              </div>
              <p className="field-hint">Оқушылардың аты-жөні енгізілмейді — тек жиынтық сан.</p>
            </div>
          </fieldset>
        )}
        {textField({ k: "observations", label: "Бақылаулар (дерек: не өлшенді, не көрдіңіз)", })}
        {textField({ k: "possibleExplanations", label: "Ықтимал түсіндірмелер", hint: "Бұл — болжам, дәлелденген себеп емес. Бірнеше нұсқаны жазыңыз.", rows: 2, })}
        {textField({ k: "actions", label: "Жасалған әрекет", rows: 2, })}
        {textField({ k: "conclusion", label: "Қорытынды (өзіңіз жазасыз)", hint: "Жүйе қорытындыны автоматты жасамайды.", rows: 3, })}
        {error && <p className="font-medium text-alert sm:col-span-2" role="alert">{error}</p>}
      </form>
    </Dialog>
  );
}

function EntryCard({ e, samples, onEdit }: { e: ResearchEntry; samples: SoilSample[]; onEdit: () => void }) {
  const [del, setDel] = useState(false);
  const feedback = useSaveFeedback();
  const guard = useEditGuard();
  const subject = e.kind === "soil" ? samples.find((s) => s.id === e.subjectId)?.name : e.kind === "classroom" ? MAIN_CLASSROOM.name : null;
  const rows: [string, string][] = [
    ["Болжам", e.hypothesis],
    ["Бақылаулар", e.observations],
    ["Ықтимал түсіндірмелер", e.possibleExplanations],
    ["Жасалған әрекет", e.actions],
    ["Қорытынды", e.conclusion],
  ];
  const c = e.classroom;
  return (
    <li className="rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="user">{KIND_LABEL[e.kind]}</Badge>
        <span className="text-sm text-muted">{formatDate(e.date)}</span>
        {subject && <span className="text-sm text-muted">· {subject}</span>}
      </div>
      <h3 className="mt-1 text-lg font-semibold text-ink">{e.question}</h3>
      {c && (
        <p className="mt-1 text-sm text-muted">
          {[c.lessonTime && `Сабақ: ${c.lessonTime}`, c.occupants != null && `Оқушы: ${c.occupants}`, c.ventilation && `Желдету: ${c.ventilation}`, c.lightNoiseNote && `Жарық/шу: ${c.lightNoiseNote}`]
            .filter(Boolean)
            .join(" · ")}
          {(c.comfort.comfortable ?? c.comfort.neutral ?? c.comfort.uncomfortable) != null &&
            ` · Жайлылық: жайлы ${c.comfort.comfortable ?? "—"}, орташа ${c.comfort.neutral ?? "—"}, жайсыз ${c.comfort.uncomfortable ?? "—"}`}
        </p>
      )}
      <dl className="mt-2 space-y-1.5 text-[15px]">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt className="inline font-semibold">{k}: </dt>
              <dd className="inline whitespace-pre-line">{v}</dd>
            </div>
          ))}
      </dl>
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn btn-ghost !min-h-9 !px-3 text-sm" onClick={guard(onEdit)}>
          <Pencil size={15} aria-hidden /> Өңдеу
        </button>
        <button type="button" className="btn btn-danger !min-h-9 !px-3 text-sm" onClick={guard(() => setDel(true))}>
          <Trash2 size={15} aria-hidden /> Жою
        </button>
      </div>
      <Dialog
        open={del}
        onClose={() => setDel(false)}
        title="Жазбаны жою"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDel(false)}>Бас тарту</button>
            <button type="button" className="btn btn-danger" onClick={() => (void feedback(repositories.journal.remove(e.id), "Жазба жойылды"), setDel(false))}>Иә, жою</button>
          </>
        }
      >
        <p>«{e.question}» жазбасы жойылады.</p>
      </Dialog>
    </li>
  );
}

export function ResearchJournal() {
  const entries = useCollection(repositories.journal);
  const userSamples = useCollection(repositories.soilSamples);
  const samples = useMemo(() => [...userSamples, ...DEMO_SOIL_SAMPLES], [userSamples]);
  const [editing, setEditing] = useState<ResearchEntry | null | "new">(null);
  const [soilOpen, setSoilOpen] = useState(false);
  const guard = useEditGuard();
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const userSorted = [...userSamples].sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl bg-mint px-4 py-3 text-sm text-forest">
        <strong>Дерек пен түсіндірмені ажыратыңыз.</strong> Жүйе «өсімдіктер үлгерімді арттырды» немесе «CO₂ гүлдердің арқасында төмендеді» сияқты қорытындыны автоматты жасамайды. Қорытындыны зерттеуші өзі жазады.
      </div>
      <section aria-labelledby="entries-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="entries-title" className="font-serif text-2xl font-bold text-forest">
            Зерттеу жазбалары ({entries.length})
          </h2>
          <button type="button" className="btn btn-primary" onClick={guard(() => setEditing("new"))}>
            <PlusCircle size={18} aria-hidden /> Жаңа жазба
          </button>
        </div>
        {sorted.length ? (
          <ul className="flex flex-col gap-3">
            {sorted.map((e) => (
              <EntryCard key={e.id} e={e} samples={samples} onEdit={() => setEditing(e)} />
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-white px-4 py-5 text-muted">
            <BookOpen className="shrink-0 text-forest" aria-hidden />
            Әзірге жазба жоқ. Зерттеу сұрағынан бастаңыз: не білгіңіз келеді?
          </div>
        )}
      </section>
      <section aria-labelledby="soil-entries-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="soil-entries-title" className="font-serif text-2xl font-bold text-forest">
            Топырақ үлгілері ({userSamples.length})
          </h2>
          <button type="button" className="btn btn-soft" onClick={guard(() => setSoilOpen(true))}>
            <PlusCircle size={18} aria-hidden /> Топырақ үлгісін зерттеу
          </button>
        </div>
        {userSorted.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {userSorted.map((s) => (
              <SoilSampleCard key={s.id} s={s} showRegion />
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-4 text-muted">Сіз енгізген топырақ үлгілері осында шығады.</p>
        )}
      </section>
      {editing && <EntryForm open={!!editing} onClose={() => setEditing(null)} initial={editing === "new" ? null : editing} samples={samples} />}
      {soilOpen && <SoilSampleForm open={soilOpen} onClose={() => setSoilOpen(false)} />}
    </div>
  );
}
