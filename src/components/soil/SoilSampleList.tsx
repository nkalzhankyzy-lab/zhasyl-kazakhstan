"use client";

import { MapPin, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { regionById } from "@/data/regions";
import { repositories } from "@/lib/storage/repositories";
import { formatDate } from "@/lib/time";
import type { SoilSample } from "@/lib/types";
import { useSaveFeedback } from "../Providers";
import { Badge } from "../ui/Badge";
import { Dialog } from "../ui/Dialog";
import { SoilSampleForm } from "./SoilSampleForm";

const NOT_MEASURED = "Өлшем енгізілмеген";

export function SoilSampleCard({ s, highlight, showRegion }: { s: SoilSample; highlight?: boolean; showRegion?: boolean }) {
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const feedback = useSaveFeedback();
  const isDemo = s.status === "demo";
  return (
    <li id={`sample-${s.id}`} className={`rounded-2xl border bg-white p-3 ${highlight ? "border-forest ring-2 ring-forest/30" : "border-line"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={isDemo ? "demo" : "user"}>{isDemo ? "Демо үлгі" : "Пайдаланушы енгізген"}</Badge>
            {s.coordinates ? (
              <Badge tone="info">
                <MapPin size={12} aria-hidden /> картада
              </Badge>
            ) : (
              <Badge tone="neutral">координатсыз</Badge>
            )}
          </div>
          <h4 className="mt-1 font-semibold text-ink">{s.name}</h4>
          <p className="text-sm text-muted">
            {formatDate(s.collectedAt)}
            {showRegion ? ` · ${regionById(s.regionId)?.nameKk ?? ""}` : ""}
            {s.locationDescription ? ` · ${s.locationDescription}` : ""}
            {s.depthCm != null ? ` · ${s.depthCm} см` : ""}
          </p>
        </div>
        {s.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.photo} alt={`${s.name} — үлгі фотосы`} className="h-14 w-20 rounded-lg object-cover" />
        )}
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="text-xs text-muted">pH</dt>
          <dd className="font-semibold">{s.ph ?? <span className="font-normal text-muted">{NOT_MEASURED}</span>}</dd>
        </div>
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="text-xs text-muted">Ылғалдылық</dt>
          <dd className="font-semibold">{s.moisture ? `${s.moisture.value} ${s.moisture.unit}` : <span className="font-normal text-muted">{NOT_MEASURED}</span>}</dd>
        </div>
        <div className="rounded-xl bg-mint/60 px-2 py-1.5">
          <dt className="text-xs text-muted">ЭӨ</dt>
          <dd className="font-semibold">{s.ec ? `${s.ec.value} ${s.ec.unit}` : <span className="font-normal text-muted">{NOT_MEASURED}</span>}</dd>
        </div>
      </dl>
      {(s.observations || s.conclusion) && (
        <div className="mt-2 space-y-1 text-sm">
          {s.observations && (
            <p>
              <span className="font-semibold">Бақылау:</span> {s.observations}
            </p>
          )}
          {s.conclusion && (
            <p>
              <span className="font-semibold">Қорытынды:</span> {s.conclusion}
            </p>
          )}
        </div>
      )}
      {!isDemo && (
        <div className="mt-2 flex gap-2">
          <button type="button" className="btn btn-ghost !min-h-9 !px-3 text-sm" onClick={() => setEdit(true)}>
            <Pencil size={15} aria-hidden /> Өңдеу
          </button>
          <button type="button" className="btn btn-danger !min-h-9 !px-3 text-sm" onClick={() => setConfirm(true)}>
            <Trash2 size={15} aria-hidden /> Жою
          </button>
        </div>
      )}
      {edit && <SoilSampleForm open={edit} onClose={() => setEdit(false)} initial={s} />}
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Үлгіні жою"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>
              Бас тарту
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                feedback(repositories.soilSamples.remove(s.id), "Үлгі жойылды");
                setConfirm(false);
              }}
            >
              Иә, жою
            </button>
          </>
        }
      >
        <p>«{s.name}» үлгісі осы браузерден біржола жойылады.</p>
      </Dialog>
    </li>
  );
}
