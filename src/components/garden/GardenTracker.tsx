"use client";

import {
  Droplets,
  NotebookPen,
  Pencil,
  Plus,
  Ruler,
  Sprout,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCollection, useHydrated, useSyncStatus } from "@/lib/storage/hooks";
import { repositories } from "@/lib/storage/repositories";
import { formatDate, todayLocalDate } from "@/lib/time";
import type { GardenPlant } from "@/lib/types";
import { useEditGuard, useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";
import { daysBetween, growth, lastWatered, sortedLogs } from "./gardenMath";
import { LogForm, PlantForm } from "./PlantForms";

const fmt = (n: number) =>
  n.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
const shortDate = (ymd: string) => {
  const [, m, d] = ymd.split("-");
  return `${Number(d)}.${m}`;
};

function GrowthChart({ plant }: { plant: GardenPlant }) {
  const [metric, setMetric] = useState<"heightCm" | "leaves">("heightCm");
  const data = sortedLogs(plant)
    .filter((l) => l[metric] !== null)
    .map((l) => ({ date: l.date, v: l[metric] as number }));
  if (data.length < 2)
    return (
      <p className="rounded-xl bg-mint/60 px-3 py-2 text-sm text-muted">
        График шығу үшін кемінде екі өлшем керек.
      </p>
    );
  return (
    <div>
      <div
        role="radiogroup"
        aria-label="График көрсеткіші"
        className="mb-1 inline-flex rounded-xl bg-mint p-0.5 text-sm"
      >
        {(
          [
            ["heightCm", "Биіктік, см"],
            ["leaves", "Жапырақ саны"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={metric === k}
            onClick={() => setMetric(k)}
            className={`rounded-lg px-2.5 py-1 font-semibold ${metric === k ? "bg-white text-forest shadow-sm" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
          >
            <CartesianGrid stroke="#e2d8c0" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fontSize: 12, fill: "#56634f" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#56634f" }}
              allowDecimals={metric === "heightCm"}
              domain={["auto", "auto"]}
            />
            <Tooltip
              formatter={(v) => [
                fmt(Number(v)),
                metric === "heightCm" ? "Биіктік, см" : "Жапырақ",
              ]}
              labelFormatter={(l) => formatDate(String(l))}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke="#2c6239"
              strokeWidth={3}
              dot={{ r: 4, fill: "#2c6239" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PlantCard({ plant }: { plant: GardenPlant }) {
  const isDemo = plant.status === "demo";
  const guard = useEditGuard();
  const feedback = useSaveFeedback();
  const [logOpen, setLogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const g = growth(plant);
  const watered = lastWatered(plant);
  const today = todayLocalDate();
  const age = daysBetween(plant.plantedAt, today);
  const logs = sortedLogs(plant).reverse();
  const shown = showAll ? logs : logs.slice(0, 3);

  const removeLog = (id: string) =>
    feedback(
      repositories.garden.upsert({
        ...plant,
        logs: plant.logs.filter((l) => l.id !== id),
        updatedAt: new Date().toISOString(),
      }),
      "Жазба өшірілді",
    );

  return (
    <li className="card flex flex-col gap-3 p-4">
      <div className="flex gap-3">
        {plant.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plant.photo}
            alt={`${plant.name} — фото`}
            className="h-20 w-20 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-mint text-forest">
            <Sprout size={34} aria-hidden />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-ink">{plant.name}</h3>
          <p className="text-sm text-muted">
            {plant.location ? `${plant.location} · ` : ""}
            {formatDate(plant.plantedAt)}
            {!isDemo && age >= 0 ? ` · ${age} күн` : ""}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="flex items-center gap-1 text-xs text-muted">
            <Ruler size={13} aria-hidden /> Биіктігі
          </dt>
          <dd className="font-semibold">{g ? `${fmt(g.to)} см` : "—"}</dd>
        </div>
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="flex items-center gap-1 text-xs text-muted">
            <Sprout size={13} aria-hidden /> Өсім
          </dt>
          <dd className="font-semibold">
            {g
              ? `+${fmt(g.diff)} см${g.pct !== null ? ` (${g.pct}%)` : ""}`
              : "—"}
          </dd>
        </div>
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="flex items-center gap-1 text-xs text-muted">
            <Droplets size={13} aria-hidden /> Суарылды
          </dt>
          <dd className="font-semibold">
            {watered ? formatDate(watered) : "—"}
          </dd>
        </div>
      </dl>

      {g && g.days > 0 && (
        <p className="rounded-xl bg-sand-2/60 px-3 py-2 text-sm text-bark">
          <b>Математика:</b> {g.days} күнде {fmt(g.from)} см → {fmt(g.to)} см.
          Өсім: {fmt(g.to)} − {fmt(g.from)} = {fmt(g.diff)} см
          {g.pct !== null
            ? `, яғни ${fmt(g.diff)} ÷ ${fmt(g.from)} × 100 ≈ ${g.pct}%`
            : ""}
          {g.perWeek !== null
            ? `. Орташа есеппен аптасына ${fmt(g.perWeek)} см.`
            : "."}
        </p>
      )}

      <GrowthChart plant={plant} />

      {plant.notes && <p className="text-sm text-ink/85">{plant.notes}</p>}

      {logs.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-forest">
            Бақылау жазбалары
          </h4>
          <ul className="mt-1 divide-y divide-line text-sm">
            {shown.map((l) => (
              <li
                key={l.id}
                className="flex items-start justify-between gap-2 py-1.5"
              >
                <span>
                  <b>{formatDate(l.date)}</b>
                  {l.heightCm !== null ? ` · ${fmt(l.heightCm)} см` : ""}
                  {l.leaves !== null ? ` · ${l.leaves} жапырақ` : ""}
                  {l.watered ? " · суарылды" : ""}
                  {l.note ? ` · ${l.note}` : ""}
                </span>
                {!isDemo && (
                  <button
                    type="button"
                    className="rounded-lg p-1 text-muted hover:bg-mint"
                    aria-label={`${formatDate(l.date)} жазбасын өшіру`}
                    onClick={guard(() => void removeLog(l.id))}
                  >
                    <X size={15} aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {logs.length > 3 && (
            <button
              type="button"
              className="mt-1 text-sm font-semibold text-forest underline"
              onClick={() => setShowAll((x) => !x)}
            >
              {showAll ? "Жасыру" : `Барлығы (${logs.length})`}
            </button>
          )}
        </div>
      )}

      {!isDemo && (
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            className="btn btn-primary !min-h-10"
            onClick={guard(() => setLogOpen(true))}
          >
            <NotebookPen size={16} aria-hidden /> Бақылау жазу
          </button>
          <button
            type="button"
            className="btn btn-ghost !min-h-10"
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
      )}

      {logOpen && (
        <LogForm open onClose={() => setLogOpen(false)} plant={plant} />
      )}
      {editOpen && (
        <PlantForm open onClose={() => setEditOpen(false)} initial={plant} />
      )}
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Гүлді өшіру"
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
                    repositories.garden.remove(plant.id),
                    "Гүл өшірілді",
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
          «{plant.name}» және оның барлық бақылау жазбалары өшіріледі. Бұл
          әрекетті қайтару мүмкін емес.
        </p>
      </Dialog>
    </li>
  );
}

export function GardenTracker() {
  const user = useCollection(repositories.garden);
  const sync = useSyncStatus();
  const guard = useEditGuard();
  const [addOpen, setAddOpen] = useState(false);
  const hydrated = useHydrated();
  const plants = useMemo(
    () =>
      [...user]
        .filter((p) => p.status === "user")
        .sort((a, b) => a.plantedAt.localeCompare(b.plantedAt)),
    [user],
  );

  return (
    <section
      aria-labelledby="garden-title"
      className="mt-6 flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="garden-title"
            className="font-serif text-2xl font-bold text-forest"
          >
            Менің гүлім
          </h2>
          <p className="text-muted">
            Сыныптағы және үйдегі гүлдердің өсу күнделігі: суару, биіктік,
            жапырақ саны.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={guard(() => setAddOpen(true))}
        >
          <Plus size={18} aria-hidden /> Гүл қосу
        </button>
      </div>

      {!hydrated ? (
        <p className="text-muted">Жүктелуде…</p>
      ) : plants.length === 0 ? (
        <div className="card flex flex-col items-start gap-2 p-5">
          {sync.state === "loading" ? (
            <p className="text-muted">Деректер жүктелуде…</p>
          ) : (
            <>
              <p className="font-semibold text-ink">Әзірге гүл тіркелмеген.</p>
              <p className="text-muted">
                Кабинеттегі гүлді тіркеп, аптасына бір рет биіктігі мен жапырақ
                санын жазып отырыңыз. Бірнеше аптадан кейін өсу графигі шығады.
              </p>
              <button
                type="button"
                className="btn btn-primary mt-1"
                onClick={guard(() => setAddOpen(true))}
              >
                <Plus size={18} aria-hidden /> Алғашқы гүлді қосу
              </button>
            </>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {plants.map((p) => (
            <PlantCard key={p.id} plant={p} />
          ))}
        </ul>
      )}

      {addOpen && <PlantForm open onClose={() => setAddOpen(false)} />}
    </section>
  );
}
