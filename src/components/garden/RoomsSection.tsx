"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  DoorOpen,
  Lightbulb,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { spotById } from "@/data/school-map";
import {
  DIR_TIP,
  dirLabel,
  LIGHT_LABEL,
  roomLight,
} from "@/data/indoor-plants";
import { useCollection, useHydrated, useSyncStatus } from "@/lib/storage/hooks";
import { repositories } from "@/lib/storage/repositories";
import { formatDate } from "@/lib/time";
import type { Room } from "@/lib/types";
import { AskAi } from "../ai/AskAi";
import { useEditGuard, useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";
import { RoomForm as RoomFormLazy } from "./RoomForm";
import { roomNo,
  CONDITION_LABEL,
  DEFAULT_PUPILS,
  lightFit,
  plantCount,
  plantsPer10m2,
  roomArea,
  roomsContext,
  roomTips,
  roomVolume,
} from "./roomMath";
import { SchoolMap } from "./SchoolMap";

const fmt = (n: number, d = 1) =>
  n.toLocaleString("ru-RU", { maximumFractionDigits: d });

/** Терезе бағытын көрсететін шағын компас */
function DirCompass({ dir }: { dir: Room["windowDir"] }) {
  const angle = {
    N: 0,
    NE: 45,
    E: 90,
    SE: 135,
    S: 180,
    SW: 225,
    W: 270,
    NW: 315,
  } as const;
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-12 w-12 shrink-0"
      role="img"
      aria-label={`Терезе: ${dirLabel(dir)}`}
    >
      <circle
        cx="24"
        cy="24"
        r="21"
        fill="#fffbf2"
        stroke="#e2d8c0"
        strokeWidth="2"
      />
      <text
        x="24"
        y="10"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="#56634f"
      >
        С
      </text>
      <text x="24" y="44" textAnchor="middle" fontSize="8" fill="#56634f">
        О
      </text>
      <text x="40" y="27" textAnchor="middle" fontSize="8" fill="#56634f">
        Ш
      </text>
      <text x="8" y="27" textAnchor="middle" fontSize="8" fill="#56634f">
        Б
      </text>
      {dir && (
        <g transform={`rotate(${angle[dir]} 24 24)`}>
          <path d="M24 9 L28.5 22 L24 20 L19.5 22 Z" fill="#c2410c" />
          <circle cx="24" cy="24" r="3" fill="#1f4a2c" />
        </g>
      )}
    </svg>
  );
}

function RoomCard({ room, n, all }: { room: Room; n: number; all: Room[] }) {
  const guard = useEditGuard();
  const feedback = useSaveFeedback();
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const light = roomLight(room.windowDir);
  const tips = roomTips(room, all);

  return (
    <li
      id={`room-${room.id}`}
      className="card flex min-w-0 scroll-mt-28 flex-col gap-3 p-4"
    >
      <div className="flex items-start gap-3">
        <DirCompass dir={room.windowDir} />
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-forest px-1.5 text-xs font-bold text-white">
              {roomNo(room, n)}
            </span>
            {room.name}
          </h3>
          <p className="text-sm text-muted">
            {room.floor !== null ? `${room.floor}-қабат · ` : ""}Терезе:{" "}
            {dirLabel(room.windowDir)}
            {room.windows ? ` (${room.windows})` : ""} ·{" "}
            {room.pupils ?? DEFAULT_PUPILS} оқушы
          </p>
          {spotById(room.mapSpot) && (
            <p className="text-xs text-muted">
              {spotById(room.mapSpot)!.label}
            </p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="text-xs text-muted">Көлемі</dt>
          <dd className="font-semibold">{fmt(roomVolume(room))} м³</dd>
        </div>
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="text-xs text-muted">Гүл саны</dt>
          <dd className="font-semibold">{plantCount(room)}</dd>
        </div>
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="text-xs text-muted">10 м²-ге</dt>
          <dd className="font-semibold">{fmt(plantsPer10m2(room))} гүл</dd>
        </div>
      </dl>
      <p className="rounded-xl bg-sand-2/60 px-3 py-2 text-sm text-bark">
        <b>Математика:</b> көлемі {fmt(room.lengthM)} × {fmt(room.widthM)} ×{" "}
        {fmt(room.heightM)} = {fmt(roomVolume(room))} м³; еден ауданы{" "}
        {fmt(roomArea(room))} м²; тығыздығы {plantCount(room)} ÷{" "}
        {fmt(roomArea(room))} × 10 ≈ {fmt(plantsPer10m2(room))} гүл / 10 м².
      </p>

      {room.windowDir && (
        <p className="text-sm">
          <Compass size={15} className="mr-1 inline text-forest" aria-hidden />
          Жарық: <b>{LIGHT_LABEL[light!]}</b>. {DIR_TIP[room.windowDir]}
        </p>
      )}

      {room.plants.length > 0 ? (
        <ul className="divide-y divide-line text-sm">
          {room.plants.map((p) => {
            const fit = lightFit(p, light);
            return (
              <li
                key={p.id}
                className="flex items-start justify-between gap-2 py-1.5"
              >
                <span>
                  <b>{p.name}</b> × {p.count}
                  <span className="text-muted">
                    {" "}
                    · күйі {CONDITION_LABEL[p.condition]}
                    {p.plantedAt ? ` · ${formatDate(p.plantedAt)}` : ""}
                  </span>
                </span>
                {fit === "ok" && (
                  <CheckCircle2
                    size={17}
                    className="shrink-0 text-forest"
                    aria-label="Жарыққа сәйкес"
                  />
                )}
                {fit === "bad" && (
                  <AlertTriangle
                    size={17}
                    className="shrink-0 text-alert"
                    aria-label="Жарыққа сәйкес емес"
                  />
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">Гүл тіркелмеген.</p>
      )}

      <div className="flex flex-col gap-1.5">
        <h4 className="flex items-center gap-1 text-sm font-semibold text-forest">
          <Lightbulb size={15} aria-hidden /> Ұсыныстар
        </h4>
        <ul className="flex flex-col gap-1.5 text-sm">
          {tips.map((t, i) => (
            <li
              key={i}
              className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${t.tone === "warn" ? "bg-orange-50 text-orange-950" : t.tone === "good" ? "bg-mint/70" : "bg-sky-50 text-sky-950"}`}
            >
              {t.tone === "warn" ? (
                <TriangleAlert
                  size={15}
                  className="mt-0.5 shrink-0"
                  aria-hidden
                />
              ) : (
                <Lightbulb size={15} className="mt-0.5 shrink-0" aria-hidden />
              )}
              <span>{t.text}</span>
            </li>
          ))}
        </ul>
        <AskAi
          label="ЖИ-ден осы кабинетке кеңес алу"
          question={`«${room.name}» кабинетіне 3–4 нақты ұсыныс бер: гүлдерді орналастыру, қай гүлді қосу немесе ауыстыру, желдету уақыты. Терезе бағытын, Қызылорда климатын (қыста суық, мамыр–қыркүйекте өте ыстық) және кабинет көлемін ескер. Есептеу болса, қадамын көрсет.`}
          context={roomsContext(
            [room, ...all.filter((o) => o.id !== room.id)],
            false,
          )}
        />
      </div>

      {room.notes && <p className="text-sm text-ink/85">{room.notes}</p>}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          className="btn btn-primary !min-h-10"
          onClick={guard(() => setEditOpen(true))}
        >
          <Pencil size={15} aria-hidden /> Өңдеу
        </button>
        <button
          type="button"
          className="btn btn-ghost !min-h-10"
          onClick={guard(() => setConfirm(true))}
        >
          <Trash2 size={15} aria-hidden /> Өшіру
        </button>
      </div>
      {editOpen && (
        <RoomFormLazy open onClose={() => setEditOpen(false)} initial={room} />
      )}
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Кабинетті өшіру"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setConfirm(false)}
            >
              Бас тарту
            </button>
            <button
              type="button"
              className="btn btn-primary !bg-alert"
              onClick={async () => {
                if (
                  await feedback(
                    repositories.rooms.remove(room.id),
                    "Кабинет өшірілді",
                  )
                )
                  setConfirm(false);
              }}
            >
              Өшіру
            </button>
          </>
        }
      >
        <p>
          «{room.name}» және оның гүлдер тізімі өшіріледі. Бұл әрекетті қайтару
          мүмкін емес.
        </p>
      </Dialog>
    </li>
  );
}

function CompareTable({ rooms }: { rooms: Room[] }) {
  const sorted = [...rooms].sort((a, b) => plantsPer10m2(b) - plantsPer10m2(a));
  return (
    <div className="card relative overflow-x-auto p-0">
      <table className="w-full min-w-[560px] text-sm">
        <caption className="px-4 pt-3 text-left font-semibold text-forest">
          Кабинеттерді салыстыру (гүл тығыздығы бойынша)
        </caption>
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="px-4 py-2 font-medium">Кабинет</th>
            <th className="px-2 py-2 font-medium">Көлемі</th>
            <th className="px-2 py-2 font-medium">Терезе</th>
            <th className="px-2 py-2 font-medium">Гүл саны</th>
            <th className="px-2 py-2 font-medium">10 м²-ге</th>
            <th className="px-4 py-2 font-medium">Жарыққа сай</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const light = roomLight(r.windowDir);
            const known = r.plants.filter(
              (p) => lightFit(p, light) !== "unknown",
            );
            const ok = known.filter((p) => lightFit(p, light) === "ok");
            return (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2 font-semibold">{r.name}</td>
                <td className="px-2 py-2">{fmt(roomVolume(r))} м³</td>
                <td className="px-2 py-2">{dirLabel(r.windowDir)}</td>
                <td className="px-2 py-2">{plantCount(r)}</td>
                <td className="px-2 py-2">{fmt(plantsPer10m2(r))}</td>
                <td className="px-4 py-2">
                  {known.length ? `${ok.length} / ${known.length} түр` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function RoomsSection() {
  const user = useCollection(repositories.rooms);
  const sync = useSyncStatus();
  const guard = useEditGuard();
  const hydrated = useHydrated();
  const [addOpen, setAddOpen] = useState(false);
  const rooms = useMemo(
    () =>
      [...user]
        .filter((r) => r.status === "user")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [user],
  );

  return (
    <>
      <SchoolMap rooms={rooms} />
      <section
        aria-labelledby="rooms-title"
        className="mt-8 flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="rooms-title"
              className="flex items-center gap-2 font-serif text-2xl font-bold text-forest"
            >
              <DoorOpen size={24} aria-hidden /> Мектеп кабинеттері және гүлдері
            </h2>
            <p className="text-muted">
              Әр кабинеттің көлемі, терезе бағыты және ондағы гүлдер. Терезе
              бағыты бойынша гүлдің жарыққа сай келетіні тексеріледі.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={guard(() => setAddOpen(true))}
          >
            <Plus size={18} aria-hidden /> Кабинет қосу
          </button>
        </div>

        {!hydrated ? (
          <p className="text-muted">Жүктелуде…</p>
        ) : rooms.length === 0 ? (
          <div className="card flex flex-col items-start gap-2 p-5">
            {sync.state === "loading" ? (
              <p className="text-muted">Деректер жүктелуде…</p>
            ) : (
              <>
                <p className="font-semibold text-ink">
                  Әзірге кабинет тіркелмеген.
                </p>
                <p className="text-muted">
                  Кабинеттің өлшемін (рулеткамен), терезесінің қай жаққа
                  қарайтынын (телефон компасымен) және ондағы гүлдерді
                  енгізіңіз.
                </p>
                <button
                  type="button"
                  className="btn btn-primary mt-1"
                  onClick={guard(() => setAddOpen(true))}
                >
                  <Plus size={18} aria-hidden /> Алғашқы кабинетті қосу
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {rooms.length > 1 && <CompareTable rooms={rooms} />}
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {rooms.map((r, i) => (
                <RoomCard key={r.id} room={r} n={i + 1} all={rooms} />
              ))}
            </ul>
          </>
        )}
        <p className="text-xs text-muted">
          Бөлме гүлдері сыныптағы CO₂ мен оттегіні айтарлықтай өзгертпейді: оған
          желдету керек. Гүлдер ауаны аздап ылғалдандырады және көңіл күйге әсер
          етеді. Сондықтан кабинеттерді ылғалдылық пен CO₂ өлшемдерімен бірге
          салыстырыңыз.
        </p>
        {addOpen && <RoomFormLazy open onClose={() => setAddOpen(false)} />}
      </section>
    </>
  );
}
