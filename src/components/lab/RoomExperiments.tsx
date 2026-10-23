"use client";

import { Droplet, FlaskRound, Microscope, Pencil, Plus, ShieldAlert, Trash2, Wind } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { parseOptionalNumber } from "@/lib/metrics";
import { useCollection, useHydrated } from "@/lib/storage/hooks";
import { newId, repositories } from "@/lib/storage/repositories";
import { formatDate, todayLocalDate } from "@/lib/time";
import type { Co2Sample, LabKind, LabResult, Room } from "@/lib/types";
import { AskAi } from "../ai/AskAi";
import { useEditGuard, useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";
import { co2FromPushes, co2Summary, gPerDay, labContext, SAMPLE_LABEL, transpirationSummary } from "./labMath";

const fmt = (n: number, d = 1) => n.toLocaleString("ru-RU", { maximumFractionDigits: d });

type TabId = LabKind | "dust";

interface Guide {
  id: TabId;
  icon: ReactNode;
  title: string;
  short: string;
  goal: string;
  tools: string[];
  steps: string[];
  safety?: string[];
  math: string;
}

const GUIDES: Guide[] = [
  {
    id: "co2",
    icon: <FlaskRound size={20} aria-hidden />,
    title: "CO₂-ні индикатормен анықтау",
    short: "CO₂ (химия)",
    goal: "Сабақ басы мен соңындағы кабинет ауасында CO₂ қаншалықты көбейгенін датчиксіз, химиялық реакция арқылы көрсету.",
    tools: [
      "Инесіз 60 мл шприц (дәріханада бар)",
      "20–30 см жіңішке түтік (тамшылатқыш жүйенің түтігі немесе аквариум түтігі)",
      "Пробиркалар, тамшуыр",
      "Фенолфталеин ерітіндісі және өте сұйық NaOH ерітіндісі (немесе бромтимол көк)",
    ],
    steps: [
      "Мұғалім ерітінді дайындайды: 5 мл суға 1 тамшы өте сұйық NaOH және 2 тамшы фенолфталеин. Ерітінді ашық қызғылт болуы керек. Барлық пробиркаға бірдей ерітінді құйылады.",
      "Кабинеттің ортасында, оқушылардың бас биіктігінде шприцтің поршенін соңына дейін тартыңыз: шприц кабинет ауасына толады.",
      "Шприцке түтікті кигізіп, ұшын пробирканың түбіне батырыңыз. Поршенді баяу басып, ауаны ерітінді арқылы өткізіңіз.",
      "Қызғылт түс жоғалғанша қайталаңыз және неше рет басқаныңызды санаңыз.",
      "Мұны сабақ басында, сабақ соңында және сыртқы ауамен (бақылау) жасаңыз. Мүмкін болса, гүлді (118) және гүлсіз (207) кабинетте бірдей жасаңыз.",
      "Көрнекілік үшін: түтікпен ерітіндіге дем үрлесеңіз, түс бірден жоғалады — демде CO₂ көп.",
    ],
    safety: ["Көзілдірік киіңіз.", "NaOH ерітіндісін тек мұғалім дайындайды, теріге тигізбеңіз.", "Түтікпен ерітіндіні ауызға тартпаңыз — тек үрлеңіз."],
    math: "Ерітіндідегі сілті бірдей болғандықтан, түс өзгеруіне бірдей мөлшерде CO₂ керек. Сондықтан басу саны аз болса — ауада CO₂ көп. Сыртқы ауада CO₂ ≈ 420 ppm десек: CO₂ ≈ 420 × (сыртқы ауаның басу саны ÷ сынаманың басу саны). Мысалы: сыртта 15 рет, сабақ соңында 6 рет → 420 × 15 ÷ 6 ≈ 1050 ppm.",
  },
  {
    id: "transpiration",
    icon: <Droplet size={20} aria-hidden />,
    title: "Гүл қанша су буландырады",
    short: "Буландыру (биология)",
    goal: "Бір гүлдің тәулігіне ауаға қанша су буын шығаратынын өлшеп, гүлді кабинетте ылғалдылықтың неге жоғары екенін түсіндіру.",
    tools: ["Ас үй таразысы (1 г дәлдікпен)", "Тағамдық пленка", "Сағат"],
    steps: [
      "Гүлді суарып, артық су ағып біткенше 1 сағат күтіңіз.",
      "Топырақ бетін және құмыраны тағамдық пленкамен ораңыз: су тек жапырақтан булансын.",
      "Құмырасымен бірге таразыда өлшеп, массасы мен уақытын жазыңыз.",
      "Гүлді орнына қойып, 24 сағаттан кейін қайта өлшеңіз.",
      "Бірнеше түрлі гүлмен қайталаңыз (хлорофитум, спатифиллум, шефлера…).",
    ],
    math: "Буланған су = бастапқы масса − соңғы масса. Тәулікке шаққанда: (m₁ − m₂) ÷ сағат × 24. Кабинетке: бір гүлдің орташасы × гүл саны. Бұл мән экопаспорттағы CO₂ бағасына да ескеріледі: гүлдің суы оқушылардың демінен бөлек есептеледі.",
  },
  {
    id: "stomata",
    icon: <Microscope size={20} aria-hidden />,
    title: "Жапырақ лептесігін микроскоппен көру",
    short: "Лептесік (микроскоп)",
    goal: "Жапырақ су буын және газдарды қандай тесіктер арқылы шығаратынын көру және түрлі гүлдердің лептесік санын салыстыру.",
    tools: ["Мөлдір тырнақ лагы", "Мөлдір скотч", "Заттық шыны", "Микроскоп (×100–×400)"],
    steps: [
      "Жапырақтың астыңғы бетіне 1×1 см аумаққа тырнақ лагын жұқа жағыңыз.",
      "Лак кепкен соң (5–10 мин) үстіне скотч жапсырып, абайлап сыпырып алыңыз: лактың қабықшасы скотчқа жабысады.",
      "Скотчты заттық шыныға жапсырыңыз.",
      "Микроскоппен қарап, бір көру алаңындағы лептесік санын санаңыз. Үш алаңды санап, орташасын алыңыз.",
      "Суретке түсіріп, семинарда көрсетіңіз.",
    ],
    math: "Орташа = (a + b + c) ÷ 3. Түрлерді салыстырыңыз: лептесігі көп гүл көбірек су буландыра ма? Буландыру тәжірибесінің нәтижесімен салыстырыңыз.",
  },
  {
    id: "dust",
    icon: <Wind size={20} aria-hidden />,
    title: "Шаң тәжірибесі",
    short: "Шаң",
    goal: "Гүлді және гүлсіз кабинетте бір аптада қанша шаң жиналатынын салыстыру.",
    tools: ["Ақ картон", "Мөлдір скотч", "Лупа", "Сызғыш"],
    steps: ["Нұсқаулығы мен нәтиже енгізетін жер экопаспортта тұр."],
    math: "Айырма, %: (гүлсіз − гүлді) ÷ гүлсіз × 100.",
  },
];

function ResultForm({ kind, rooms, initial, onClose }: { kind: LabKind; rooms: Room[]; initial?: LabResult; onClose: () => void }) {
  const feedback = useSaveFeedback();
  const s = (v: number | null | undefined) => (v == null ? "" : String(v));
  const [f, setF] = useState({
    roomId: initial?.roomId ?? (kind === "co2" ? (rooms[0]?.id ?? "") : ""),
    date: initial?.date ?? todayLocalDate(),
    sample: initial?.sample ?? ("start" as Co2Sample),
    pushes: s(initial?.pushes),
    plant: initial?.plant ?? "",
    m1: s(initial?.m1),
    m2: s(initial?.m2),
    hours: s(initial?.hours ?? 24),
    stomata: s(initial?.stomata),
    mag: s(initial?.mag ?? 400),
    note: initial?.note ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const field = (k: keyof typeof f, label: string, placeholder = "") => (
    <label className="text-xs text-muted">
      {label}
      <input className="input mt-1 !min-h-10" inputMode="decimal" value={f[k]} placeholder={placeholder} onChange={set(k)} />
    </label>
  );
  async function save() {
    setErr(null);
    const num = (v: string, min: number, max: number) => {
      const n = parseOptionalNumber(v);
      return n === null || Number.isNaN(n) || n < min || n > max ? null : n;
    };
    const base = { id: initial?.id ?? newId("lab"), status: "user" as const, kind, date: f.date, note: f.note.trim(), createdAt: initial?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() };
    let rec: LabResult;
    if (kind === "co2") {
      const pushes = num(f.pushes, 1, 500);
      if (pushes === null) return setErr("Шприц басу санын жазыңыз (1–500)");
      if (f.sample !== "outdoor" && !f.roomId) return setErr("Кабинетті таңдаңыз");
      rec = { ...base, roomId: f.sample === "outdoor" ? null : f.roomId, sample: f.sample, pushes };
    } else if (kind === "transpiration") {
      const m1 = num(f.m1, 1, 50000);
      const m2 = num(f.m2, 1, 50000);
      const hours = num(f.hours, 1, 240);
      if (!f.plant.trim()) return setErr("Гүлдің атын жазыңыз");
      if (m1 === null || m2 === null || hours === null) return setErr("Массаны (г) және уақытты (сағ) жазыңыз");
      if (m2 >= m1) return setErr("Соңғы масса бастапқыдан аз болуы керек");
      rec = { ...base, roomId: f.roomId || null, plant: f.plant.trim(), m1, m2, hours };
    } else {
      const stomata = num(f.stomata, 0, 5000);
      if (!f.plant.trim()) return setErr("Гүлдің атын жазыңыз");
      if (stomata === null) return setErr("Лептесік санын жазыңыз");
      rec = { ...base, roomId: f.roomId || null, plant: f.plant.trim(), stomata, mag: num(f.mag, 10, 2000) };
    }
    if (await feedback(repositories.lab.upsert(rec), initial ? "Нәтиже жаңартылды" : "Нәтиже қосылды")) onClose();
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title={initial ? "Нәтижені өңдеу" : "Нәтиже қосу"}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Бас тарту
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void save()}>
            Сақтау
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">
          Күні
          <input type="date" className="input mt-1 !min-h-10" value={f.date} onChange={set("date")} />
        </label>
        {kind === "co2" && (
          <label className="text-xs text-muted">
            Ауа сынамасы
            <select className="input mt-1 !min-h-10" value={f.sample} onChange={set("sample")}>
              {(Object.keys(SAMPLE_LABEL) as Co2Sample[]).map((k) => (
                <option key={k} value={k}>
                  {SAMPLE_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        )}
        {!(kind === "co2" && f.sample === "outdoor") && (
          <label className="col-span-2 text-xs text-muted">
            Кабинет{kind !== "co2" && " (міндетті емес)"}
            <select className="input mt-1 !min-h-10" value={f.roomId} onChange={set("roomId")}>
              {kind !== "co2" && <option value="">—</option>}
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {kind === "co2" && field("pushes", "Түс өзгергенге дейін басу саны", "мыс. 12")}
        {kind !== "co2" && (
          <label className="col-span-2 text-xs text-muted">
            Гүл
            <input className="input mt-1 !min-h-10" list="lab-plants" value={f.plant} onChange={set("plant")} placeholder="мыс. Хлорофитум" />
            <datalist id="lab-plants">
              {["Хлорофитум", "Спатифиллум (әйел бақыты)", "Замиокулькас (доллар ағашы)", "Шефлера", "Традесканция", "Бамбук", "Лалагүл"].map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </label>
        )}
        {kind === "transpiration" && (
          <>
            {field("m1", "Басында, г", "мыс. 1240")}
            {field("m2", "Соңында, г", "мыс. 1215")}
            {field("hours", "Уақыты, сағ")}
          </>
        )}
        {kind === "stomata" && (
          <>
            {field("stomata", "Бір көру алаңындағы лептесік (орташа)", "мыс. 34")}
            {field("mag", "Үлкейту, ×")}
          </>
        )}
        <label className="col-span-2 text-xs text-muted">
          Ескертпе
          <input className="input mt-1 !min-h-10" value={f.note} onChange={set("note")} />
        </label>
      </div>
      {err && (
        <p className="mt-2 text-sm text-alert" role="alert">
          {err}
        </p>
      )}
    </Dialog>
  );
}

function RowActions({ r, rooms }: { r: LabResult; rooms: Room[] }) {
  const guard = useEditGuard();
  const feedback = useSaveFeedback();
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  return (
    <td className="whitespace-nowrap px-2 py-1.5">
      <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-mint" aria-label="Өңдеу" onClick={guard(() => setEdit(true))}>
        <Pencil size={15} aria-hidden />
      </button>
      <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-mint" aria-label="Өшіру" onClick={guard(() => setDel(true))}>
        <Trash2 size={15} aria-hidden />
      </button>
      {edit && <ResultForm kind={r.kind} rooms={rooms} initial={r} onClose={() => setEdit(false)} />}
      <Dialog
        open={del}
        onClose={() => setDel(false)}
        title="Нәтижені өшіру"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDel(false)}>
              Бас тарту
            </button>
            <button
              type="button"
              className="btn btn-primary !bg-alert"
              onClick={async () => {
                if (await feedback(repositories.lab.remove(r.id), "Нәтиже өшірілді")) setDel(false);
              }}
            >
              Өшіру
            </button>
          </>
        }
      >
        <p>{formatDate(r.date)} нәтижесі өшіріледі.</p>
      </Dialog>
    </td>
  );
}

function Results({ kind, rooms, results }: { kind: LabKind; rooms: Room[]; results: LabResult[] }) {
  const list = results.filter((r) => r.kind === kind);
  const roomName = (id: string | null) => (id ? (rooms.find((r) => r.id === id)?.name ?? "—") : "—");
  if (kind === "co2") {
    const c = co2Summary(results, rooms);
    return (
      <>
        {c.byRoom.length > 0 && (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {c.byRoom.map((x) => (
              <li key={x.room.id} className="rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-line">
                <p className="font-semibold">{x.room.name}</p>
                <p>
                  Басу саны: басында <b>{x.start ? fmt(x.start) : "—"}</b>, соңында <b>{x.end ? fmt(x.end) : "—"}</b>
                </p>
                {x.ratio && <p>Сабақ соңында CO₂ шамамен {fmt(x.ratio)} есе көп.</p>}
                {x.ppmEnd && (
                  <p className="text-muted">
                    Сыртқы ауамен салыстырғанда: басы ≈ {x.ppmStart ? fmt(x.ppmStart, 0) : "—"} ppm, соңы ≈ {fmt(x.ppmEnd, 0)} ppm
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {c.byRoom.length > 0 && !c.outdoor && <p className="text-xs text-muted">ppm-ге айналдыру үшін сыртқы ауамен де бір өлшем жасаңыз.</p>}
        {list.length > 0 && (
          <div className="relative overflow-x-auto rounded-xl ring-1 ring-line">
            <table className="w-full min-w-[520px] bg-white text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Күні</th>
                  <th className="px-2 py-2 font-medium">Кабинет</th>
                  <th className="px-2 py-2 font-medium">Сынама</th>
                  <th className="px-2 py-2 font-medium">Басу саны</th>
                  <th className="px-2 py-2 font-medium">≈ ppm</th>
                  <th className="px-2 py-2 font-medium">
                    <span className="sr-only">Әрекеттер</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => {
                  const ppm = r.sample === "outdoor" ? 420 : r.pushes ? co2FromPushes(r.pushes, c.outdoor) : null;
                  return (
                    <tr key={r.id} className="border-b border-line last:border-0">
                      <td className="whitespace-nowrap px-3 py-1.5">{formatDate(r.date)}</td>
                      <td className="px-2 py-1.5">{r.sample === "outdoor" ? "Сыртта" : roomName(r.roomId)}</td>
                      <td className="px-2 py-1.5">{r.sample ? SAMPLE_LABEL[r.sample] : "—"}</td>
                      <td className="px-2 py-1.5 font-semibold">{r.pushes ?? "—"}</td>
                      <td className="px-2 py-1.5">{ppm ? fmt(ppm, 0) : "—"}</td>
                      <RowActions r={r} rooms={rooms} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  }
  if (kind === "transpiration") {
    const t = transpirationSummary(results, rooms);
    return (
      <>
        {t.perPot !== null && (
          <div className="rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-line">
            <p>
              Бір гүл орташа тәулігіне <b>{fmt(t.perPot, 0)} г</b> су буландырады ({t.list.length} өлшем).
            </p>
            <ul className="mt-1 list-disc pl-5">
              {t.byRoom
                .filter((x) => x.gDay !== null)
                .map((x) => (
                  <li key={x.room.id}>
                    {x.room.name}: {x.plants} гүл × {fmt(t.perPot!, 0)} г ≈ <b>{fmt(x.gDay! / 1000, 2)} л</b> су тәулігіне
                  </li>
                ))}
            </ul>
          </div>
        )}
        {list.length > 0 && (
          <div className="relative overflow-x-auto rounded-xl ring-1 ring-line">
            <table className="w-full min-w-[560px] bg-white text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Күні</th>
                  <th className="px-2 py-2 font-medium">Гүл</th>
                  <th className="px-2 py-2 font-medium">m₁ → m₂, г</th>
                  <th className="px-2 py-2 font-medium">Уақыты</th>
                  <th className="px-2 py-2 font-medium">г / тәулік</th>
                  <th className="px-2 py-2 font-medium">
                    <span className="sr-only">Әрекеттер</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="whitespace-nowrap px-3 py-1.5">{formatDate(r.date)}</td>
                    <td className="px-2 py-1.5">
                      {r.plant}
                      {r.roomId && <span className="block text-xs text-muted">{roomName(r.roomId)}</span>}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5">
                      {r.m1} → {r.m2}
                    </td>
                    <td className="px-2 py-1.5">{r.hours} сағ</td>
                    <td className="px-2 py-1.5 font-semibold">{gPerDay(r) !== null ? fmt(gPerDay(r)!, 0) : "—"}</td>
                    <RowActions r={r} rooms={rooms} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  }
  return list.length > 0 ? (
    <div className="relative overflow-x-auto rounded-xl ring-1 ring-line">
      <table className="w-full min-w-[480px] bg-white text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="px-3 py-2 font-medium">Күні</th>
            <th className="px-2 py-2 font-medium">Гүл</th>
            <th className="px-2 py-2 font-medium">Лептесік / алаң</th>
            <th className="px-2 py-2 font-medium">Үлкейту</th>
            <th className="px-2 py-2 font-medium">
              <span className="sr-only">Әрекеттер</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0">
              <td className="whitespace-nowrap px-3 py-1.5">{formatDate(r.date)}</td>
              <td className="px-2 py-1.5">{r.plant}</td>
              <td className="px-2 py-1.5 font-semibold">{r.stomata}</td>
              <td className="px-2 py-1.5">{r.mag ? `×${r.mag}` : "—"}</td>
              <RowActions r={r} rooms={rooms} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : null;
}

export function RoomExperiments() {
  const hydrated = useHydrated();
  const guard = useEditGuard();
  const allRooms = useCollection(repositories.rooms);
  const allResults = useCollection(repositories.lab);
  const rooms = useMemo(() => allRooms.filter((r) => r.status === "user").sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [allRooms]);
  const results = useMemo(() => allResults.filter((r) => r.status === "user").sort((a, b) => `${a.date}${a.createdAt}`.localeCompare(`${b.date}${b.createdAt}`)), [allResults]);
  const [tab, setTab] = useState<TabId>("co2");
  const [add, setAdd] = useState(false);
  const g = GUIDES.find((x) => x.id === tab)!;
  const count = (k: TabId) => results.filter((r) => r.kind === k).length;

  return (
    <section id="room-experiments" aria-labelledby="rx-title" className="mt-8 flex flex-col gap-4">
      <div>
        <h2 id="rx-title" className="font-serif text-2xl font-bold text-forest">
          Кабинет зерттеуіне арналған тәжірибелер
        </h2>
        <p className="mt-1 max-w-3xl text-muted">Гүлді және гүлсіз кабинеттің ауасын химия, биология және математика арқылы зерттейміз. Нәтижелер экопаспорт пен ЖИ талдауына қосылады.</p>
      </div>
      <div role="tablist" aria-label="Тәжірибе" className="flex flex-wrap gap-1">
        {GUIDES.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold ${tab === x.id ? "border-forest bg-forest text-white" : "border-line bg-white hover:bg-mint"}`}
          >
            {x.icon}
            {x.short}
            {hydrated && x.id !== "dust" && count(x.id) > 0 && <span className={`rounded-full px-1.5 text-xs ${tab === x.id ? "bg-white/25" : "bg-mint text-forest"}`}>{count(x.id)}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="card grid min-w-0 grid-cols-1 gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-forest">
            {g.icon} {g.title}
          </h3>
          <p>
            <b>Мақсаты: </b>
            {g.goal}
          </p>
          <div>
            <p className="font-semibold">Құралдар</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[15px]">
              {g.tools.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Қадамдар</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-[15px]">
              {g.steps.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
          {g.safety && (
            <div className="flex items-start gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-950">
              <ShieldAlert size={18} className="mt-0.5 shrink-0" aria-hidden />
              <span>{g.safety.join(" ")}</span>
            </div>
          )}
          <p className="rounded-xl bg-sand-2/60 px-3 py-2 text-sm text-bark">
            <b>Математика: </b>
            {g.math}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {tab === "dust" ? (
            <div className="flex flex-col items-start gap-3">
              <p>Шаң тәжірибесінің толық нұсқаулығы мен нәтижелері экопаспортта, кабинеттер рейтингінің астында.</p>
              <Link href="/schools/kzo-23#dust-title" className="btn btn-primary">
                <Wind size={18} aria-hidden /> Экопаспорттағы шаң тәжірибесі
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-forest">Нәтижелер</h4>
                <button type="button" className="btn btn-soft !min-h-10" disabled={!rooms.length} onClick={guard(() => setAdd(true))}>
                  <Plus size={18} aria-hidden /> Нәтиже қосу
                </button>
              </div>
              {hydrated && count(tab) === 0 && <p className="rounded-xl border border-dashed border-line bg-white px-3 py-3 text-sm text-muted">Әзірге нәтиже жоқ. Тәжірибені жасап, нәтижесін осында енгізіңіз.</p>}
              {hydrated && <Results kind={tab} rooms={rooms} results={results} />}
              {hydrated && count(tab) > 0 && (
                <AskAi
                  label="ЖИ: нәтижені талдау"
                  question={`«${g.title}» тәжірибесінің нәтижесін талда: не байқалды, гүлді және гүлсіз кабинет арасында айырма бар ма, қателік көздері қандай, келесі қадам не. Әлемдік зерттеулерге (Автор, жыл) сілте. Қысқа жаз.`}
                  context={labContext(results, rooms)}
                />
              )}
              {add && <ResultForm kind={tab} rooms={rooms} onClose={() => setAdd(false)} />}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
