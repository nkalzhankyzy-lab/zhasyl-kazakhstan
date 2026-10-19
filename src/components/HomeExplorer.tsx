"use client";

import { useMemo, useRef, useState } from "react";
import { DEMO_SOIL_SAMPLES } from "@/data/demo/soil-samples-demo";
import { KYZYLORDA_ID, REGIONS, regionById } from "@/data/regions";
import { schoolById } from "@/data/schools";
import { useCollection, useHydrated } from "@/lib/storage/hooks";
import { repositories } from "@/lib/storage/repositories";
import { InteractiveMap, type MapPoint } from "./map/InteractiveMap";
import { MapLayerSwitch, type MapLayer } from "./map/MapLayerSwitch";
import { MapLegend } from "./map/MapLegend";
import { RegionPanel, type RegionTab } from "./RegionPanel";
import { SchoolPanel } from "./SchoolPanel";

type Selection = { kind: "region"; id: string } | { kind: "school"; id: string };

export function HomeExplorer() {
  const [layer, setLayer] = useState<MapLayer>("soil");
  const [sel, setSel] = useState<Selection>({ kind: "region", id: KYZYLORDA_ID });
  const [tab, setTab] = useState<RegionTab>("soil");
  const [highlight, setHighlight] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const userSamples = useCollection(repositories.soilSamples);
  // Карта тек браузерде сызылады: SSR мен клиент арасындағы өзгешелік болмайды және HTML жеңіл болады
  const hydrated = useHydrated();

  const points: MapPoint[] = useMemo(
    () =>
      [...userSamples, ...DEMO_SOIL_SAMPLES]
        .filter((s) => s.coordinates)
        .map((s) => ({ id: s.id, lat: s.coordinates!.lat, lon: s.coordinates!.lon, status: s.status, name: s.name, regionId: s.regionId })),
    [userSamples],
  );

  // Телефонда таңдаудан кейін панельге жылжу
  const revealPanel = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  const selectRegion = (id: string) => {
    setSel({ kind: "region", id });
    setHighlight(null);
    if (layer === "research") setTab("research");
    else if (layer === "water") setTab("water");
    else if (layer === "plants") setTab("plants");
    else if (layer === "soil") setTab("soil");
    revealPanel();
  };

  const selectedRegionId = sel.kind === "region" ? sel.id : schoolById(sel.id)?.regionId ?? null;
  const region = sel.kind === "region" ? regionById(sel.id) : null;
  const school = sel.kind === "school" ? schoolById(sel.id) : null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)] xl:gap-6">
      <section aria-labelledby="map-title" className="card relative flex min-w-0 flex-col gap-3 p-3 sm:p-4">
        <h2 id="map-title" className="sr-only">
          Экокарта
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <MapLayerSwitch value={layer} onChange={(l) => setLayer(l)} />
          <label className="flex min-w-0 max-w-full items-center gap-2 text-sm">
            <span className="font-semibold text-muted">Аймақ:</span>
            <select
              className="input !min-h-10 !w-auto min-w-0 max-w-full !py-1.5"
              value={sel.kind === "region" ? sel.id : ""}
              onChange={(e) => e.target.value && selectRegion(e.target.value)}
              aria-label="Аймақты тізімнен таңдау"
            >
              {sel.kind === "school" && <option value="">— мектеп таңдалған —</option>}
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameKk}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!hydrated ? (
          <div className="flex w-full items-center justify-center rounded-[1.5rem] bg-[#f1e8d2] text-muted" style={{ aspectRatio: "1000 / 640" }}>
            Карта жүктелуде…
          </div>
        ) : (
        <InteractiveMap
          layer={layer}
          selectedRegionId={selectedRegionId}
          selectedSchoolId={sel.kind === "school" ? sel.id : null}
          points={points}
          onSelectRegion={selectRegion}
          onSelectSchool={(id) => {
            setSel({ kind: "school", id });
            revealPanel();
          }}
          onSelectPoint={(p) => {
            setSel({ kind: "region", id: p.regionId });
            setTab("research");
            setHighlight(p.id);
            revealPanel();
          }}
        />
        )}
        <MapLegend layer={layer} />
        <p className="text-xs text-muted lg:hidden">Картаны жылжыту: екі саусақпен немесе үлкейткеннен кейін бір саусақпен. Бетті айналдыру — картадан тыс жерде немесе тігінен сырғыту.</p>
      </section>

      <aside ref={panelRef} aria-label="Таңдалған аймақ немесе мектеп панелі" className="card min-w-0 scroll-mt-32 p-4 sm:p-5 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
        {region && <RegionPanel region={region} tab={tab} onTab={setTab} highlightSampleId={highlight} />}
        {school && <SchoolPanel school={school} />}
      </aside>
    </div>
  );
}
