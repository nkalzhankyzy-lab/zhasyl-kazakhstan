"use client";

import { CloudSun, Droplets, FileSearch, FlaskConical, Info, Layers, Sprout } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DEMO_SOIL_SAMPLES } from "@/data/demo/soil-samples-demo";
import { regionById } from "@/data/regions";
import { useCollection } from "@/lib/storage/hooks";
import { repositories } from "@/lib/storage/repositories";
import { formatNumber } from "@/lib/metrics";
import { formatDate } from "@/lib/time";
import type { InfoSection, Region, SoilSample } from "@/lib/types";
import { PlantCatalog } from "./PlantCatalog";
import { SoilCutaway } from "./soil/SoilCutaway";
import { SoilGallery } from "./soil/SoilGallery";
import { SoilSampleForm } from "./soil/SoilSampleForm";
import { SoilSampleCard } from "./soil/SoilSampleList";
import { Pending, SourceList } from "./SourceList";
import { Badge } from "./ui/Badge";

export type RegionTab = "overview" | "soil" | "climate" | "water" | "plants" | "research";

const TABS: { key: RegionTab; label: string; icon: typeof Info }[] = [
  { key: "overview", label: "Шолу", icon: Info },
  { key: "soil", label: "Топырақ", icon: Layers },
  { key: "climate", label: "Климат", icon: CloudSun },
  { key: "water", label: "Су", icon: Droplets },
  { key: "plants", label: "Өсімдіктер", icon: Sprout },
  { key: "research", label: "Зерттеулер", icon: FileSearch },
];

function Section({ s }: { s?: InfoSection }) {
  if (!s || !s.paragraphs.length) return <Pending />;
  return (
    <div className="space-y-3">
      <div className="space-y-2 text-[15px] leading-relaxed">
        {s.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {s.facts && (
        <dl className="grid gap-2 sm:grid-cols-2">
          {s.facts.map((f) => (
            <div key={f.label} className="rounded-xl bg-mint/70 px-3 py-2">
              <dt className="text-xs text-muted">{f.label}</dt>
              <dd className="font-semibold text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <SourceList ids={s.sourceIds} />
    </div>
  );
}

const NOT_MEASURED = "Өлшем енгізілмеген";

/** Аймақтағы ең соңғы пайдаланушы өлшемдері (демо үлгілер көрсеткішке кірмейді) */
function SoilIndicators({ samples }: { samples: SoilSample[] }) {
  const latest = (pick: (s: SoilSample) => unknown) =>
    [...samples].filter((s) => s.status === "user" && pick(s) != null).sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))[0];
  const ph = latest((s) => s.ph);
  const moist = latest((s) => s.moisture);
  const ec = latest((s) => s.ec);
  const rows = [
    { label: "pH", value: ph ? String(ph.ph) : null, s: ph },
    { label: "Ылғалдылық", value: moist?.moisture ? `${moist.moisture.value} ${moist.moisture.unit}` : null, sub: moist?.moisture?.method, s: moist },
    { label: "Тұздылықты бағалау (электрөткізгіштік)", value: ec?.ec ? `${ec.ec.value} ${ec.ec.unit}` : null, sub: ec?.ec?.method, s: ec },
  ];
  return (
    <section aria-labelledby="indicators-title">
      <h3 id="indicators-title" className="font-serif text-lg font-bold text-forest">
        Негізгі көрсеткіштер
      </h3>
      <dl className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-3 px-3 py-2.5">
            <dt className="text-sm font-semibold">{r.label}</dt>
            <dd className="text-right text-sm">
              {r.value ? (
                <>
                  <span className="font-bold text-forest">{r.value}</span>
                  <span className="block text-xs text-muted">
                    {r.s?.name}, {formatDate(r.s!.collectedAt)}
                    {r.sub ? ` · ${r.sub}` : ""}
                  </span>
                </>
              ) : (
                <span className="text-muted">{NOT_MEASURED}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-1.5 text-xs text-muted">
        Көрсеткіштер тек сіз енгізген үлгілерден алынады. Бір үлгі бүкіл облыстың сипаттамасы емес. Тұздылықты деңгейге жіктеу әдіске сәйкес нұсқаулықты қажет етеді, сондықтан мұнда тек өлшенген мән көрсетіледі.
      </p>
    </section>
  );
}

interface Props {
  region: Region;
  tab: RegionTab;
  onTab: (t: RegionTab) => void;
  highlightSampleId?: string | null;
}

export function RegionPanel({ region, tab, onTab, highlightSampleId }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const userSamples = useCollection(repositories.soilSamples);
  const samples = useMemo(
    () => [...userSamples, ...DEMO_SOIL_SAMPLES].filter((s) => s.regionId === region.id).sort((a, b) => b.collectedAt.localeCompare(a.collectedAt)),
    [userSamples, region.id],
  );
  const full = region.detail === "full";

  useEffect(() => {
    if (highlightSampleId) document.getElementById(`sample-${highlightSampleId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightSampleId, tab]);

  const studyButton = (
    <button type="button" className="btn btn-primary w-full" onClick={() => setFormOpen(true)}>
      <FlaskConical size={18} aria-hidden />
      Топырақ үлгісін зерттеу
    </button>
  );

  return (
    <article aria-labelledby="region-title" className="flex flex-col gap-4">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="region-title" className="font-serif text-2xl font-bold text-forest sm:text-[28px]">
            {region.nameKk}
          </h2>
          {!full && <Badge tone="dev">Мәлімет толықтырылуда</Badge>}
        </div>
        <p className="text-sm text-muted">Аймақтың табиғи төлқұжаты</p>
      </header>

      <div role="tablist" aria-label="Аймақ бөлімдері" className="flex flex-wrap gap-1.5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls="region-tabpanel"
            type="button"
            onClick={() => onTab(key)}
            className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition ${
              tab === key ? "border-forest bg-forest text-white" : "border-line bg-white text-ink/80 hover:bg-mint"
            }`}
          >
            <Icon size={16} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div id="region-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="flex flex-col gap-4">
        {tab === "overview" && (
          <>
            <Section s={region.summary} />
            {!region.summary?.facts && region.areaKm2 && (
              <dl className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-mint/70 px-3 py-2">
                  <dt className="text-xs text-muted">{region.kind === "city" ? "Қала" : "Әкімшілік орталығы"}</dt>
                  <dd className="font-semibold">{region.center}</dd>
                </div>
                <div className="rounded-xl bg-mint/70 px-3 py-2">
                  <dt className="text-xs text-muted">Аумағы</dt>
                  <dd className="font-semibold">{formatNumber(region.areaKm2)} км²</dd>
                </div>
              </dl>
            )}
            {!full && (
              <p className="text-sm text-muted">
                Алғашқы нұсқада толық безендірілген панель — Қызылорда облысы. Басқа аймақтардың табиғи сипаттамасы тексерілген дереккөз бойынша кезең-кезеңімен қосылады.
              </p>
            )}
          </>
        )}

        {tab === "soil" &&
          (full && region.soil ? (
            <>
              <SoilGallery types={region.soil.types} />
              <SoilCutaway />
              <SoilIndicators samples={samples} />
              {studyButton}
              <section>
                <h3 className="font-serif text-lg font-bold text-forest">Облыс топырағының жалпы сипаттамасы</h3>
                <div className="mt-1 space-y-2 text-[15px] leading-relaxed">
                  {region.soil.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
                <SourceList ids={region.soil.sourceIds} className="mt-2" />
              </section>
            </>
          ) : (
            <>
              <Pending />
              <p className="text-sm text-muted">Картадағы «Топырақ» қабаты — шартты оқу схемасы. Облыстың тексерілген топырақ сипаттамасы әлі қосылмаған.</p>
              <SoilIndicators samples={samples} />
              {studyButton}
            </>
          ))}

        {tab === "climate" && <Section s={region.climate} />}
        {tab === "water" && <Section s={region.water} />}
        {tab === "plants" && (
          <>
            <Section s={region.plants} />
            <PlantCatalog compact />
          </>
        )}
        {tab === "research" && (
          <section aria-labelledby="samples-title" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 id="samples-title" className="font-serif text-lg font-bold text-forest">
                Топырақ үлгілері ({samples.length})
              </h3>
            </div>
            {samples.length ? (
              <ul className="flex flex-col gap-2">
                {samples.map((s) => (
                  <SoilSampleCard key={s.id} s={s} highlight={s.id === highlightSampleId} />
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-muted">Бұл аймақта әзірге үлгі жоқ.</p>
            )}
            {studyButton}
          </section>
        )}
      </div>
      {formOpen && <SoilSampleForm open={formOpen} onClose={() => setFormOpen(false)} defaultRegionId={region.id} onSaved={() => onTab("research")} />}
    </article>
  );
}

export function regionTitle(id: string) {
  return regionById(id)?.nameKk ?? id;
}
