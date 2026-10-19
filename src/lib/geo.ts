// Карта геометриясы: проекция, SVG жолдары, атау нүктелері.
// Барлығы бір рет есептеледі (модуль деңгейінде) және компоненттерде қайта қолданылады.

import { geoArea, geoCentroid, geoConicEqualArea, geoContains, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";
import regionsJson from "@/data/geo/regions.json";
import waterJson from "@/data/geo/water.json";
import { SOIL_SYMBOL_FEATURES, SOIL_ZONE_FEATURES } from "@/data/soil-scheme";

export const MAP_W = 1000;
export const MAP_H = 640;

const regions = regionsJson as unknown as FeatureCollection<Polygon | MultiPolygon, { iso: string; nameLatin: string }>;
const water = waterJson as unknown as FeatureCollection<Geometry, { kind: "sea" | "lake" | "river"; name: string }>;

/** Қазақстанға ыңғайлы тең аудандық конустық проекция */
export const projection = geoConicEqualArea()
  .parallels([44, 52])
  .rotate([-67, 0])
  .fitExtent(
    [
      [24, 18],
      [MAP_W - 24, MAP_H - 18],
    ],
    regions,
  );

// 1 ондық таңба жеткілікті (viewBox 1000 бірлік) — HTML көлемін азайтады
const path = geoPath(projection).digits(1);

/** d3 сфералық полигонды жарты әлемнен үлкен деп қабылдамас үшін орам бағытын түзету */
function fixWinding<T extends Feature<Polygon>>(f: T): T {
  if (geoArea(f) > 2 * Math.PI) {
    return { ...f, geometry: { ...f.geometry, coordinates: f.geometry.coordinates.map((r) => r.slice().reverse()) } };
  }
  return f;
}

// Атау нүктесін қолмен түзету қажет аймақтар (бойлық, ендік)
const LABEL_OVERRIDES: Record<string, [number, number]> = {
  "KZ-43": [63.2, 44.55], // Қызылорда — мектеп белгісімен қабаттаспас үшін батысырақ
  "KZ-19": [77.6, 44.75], // Алматы облысы — Алматы қаласының солтүстігінде
  "KZ-33": [80.0, 45.55],
  "KZ-35": [73.7, 48.6],
  "KZ-63": [83.6, 49.4],
  "KZ-11": [69.6, 52.6],
  "KZ-47": [53.5, 44.0],
  "KZ-23": [51.8, 47.5],
};

export interface RegionShape {
  id: string;
  d: string;
  label: [number, number];
  area: number;
  bounds: [[number, number], [number, number]];
}

export const REGION_SHAPES: RegionShape[] = regions.features.map((f) => {
  const id = String(f.id ?? f.properties.iso);
  const ll = LABEL_OVERRIDES[id] ?? (() => {
    const c = geoCentroid(f);
    return geoContains(f, c) ? c : (f.geometry.type === "Polygon" ? f.geometry.coordinates[0][0] : f.geometry.coordinates[0][0][0]);
  })();
  const p = projection(ll as [number, number])!;
  return { id, d: path(f) ?? "", label: [p[0], p[1]], area: path.area(f), bounds: path.bounds(f) };
});

/** Ел контуры (көлеңке мен көлемді жиек үшін) — барлық облыс жолдарын біріктіреміз */
export const COUNTRY_D = REGION_SHAPES.map((r) => r.d).join(" ");

export interface WaterShape {
  kind: "sea" | "lake" | "river";
  name: string;
  d: string;
}
export const WATER_SHAPES: WaterShape[] = water.features.map((f) => ({ kind: f.properties.kind, name: f.properties.name, d: path(f) ?? "" }));

export const SOIL_ZONE_SHAPES = SOIL_ZONE_FEATURES.map((f) => ({ zone: f.properties.zone, d: path(fixWinding(f)) ?? "" }));
export const SOIL_SYMBOL_SHAPES = SOIL_SYMBOL_FEATURES.map((f) => {
  const ff = fixWinding(f);
  const c = projection(geoCentroid(ff))!;
  return { symbol: f.properties.symbol, label: f.properties.label, d: path(ff) ?? "", c: [c[0], c[1]] as [number, number] };
});

export const WATER_LABELS: { name: string; at: [number, number]; min: number }[] = [
  { name: "Каспий теңізі", at: [50.2, 44.4], min: 1 },
  { name: "Арал теңізі", at: [60.6, 46.25], min: 1.6 },
  { name: "Балқаш көлі", at: [74.6, 46.55], min: 1.6 },
  { name: "Сырдария", at: [64.9, 45.0], min: 2.2 },
  { name: "Ертіс", at: [77.4, 52.6], min: 2.2 },
  { name: "Жайық", at: [51.6, 49.4], min: 2.2 },
  { name: "Іле", at: [76.4, 44.25], min: 2.4 },
  { name: "Есіл", at: [69.4, 51.35], min: 2.6 },
  { name: "Зайсан", at: [84.0, 48.25], min: 2.4 },
  { name: "Алакөл", at: [81.7, 46.0], min: 2.6 },
].map((w) => ({ ...w, at: projection(w.at as [number, number]) as [number, number] }));

export function project(lon: number, lat: number): [number, number] | null {
  const p = projection([lon, lat]);
  return p ? [p[0], p[1]] : null;
}
