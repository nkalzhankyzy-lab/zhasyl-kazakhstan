// Қызылорда облысының жеке картасы: облысқа бейімделген проекция және SVG жолдары (серверде бір рет есептеледі)

import { geoConicEqualArea, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";
import regionsJson from "@/data/geo/regions.json";
import waterJson from "@/data/geo/water.json";
import { KYZYLORDA_PLACES, KYZYLORDA_TOWNS } from "@/data/kyzylorda-soils";

import { KZO_H, KZO_W } from "./geoKyzylorda.shared";

const regions = regionsJson as unknown as FeatureCollection<Polygon | MultiPolygon, { iso: string }>;
const water = waterJson as unknown as FeatureCollection<Geometry, { kind: string; name: string }>;
const region = regions.features.find((f) => String(f.id ?? f.properties.iso) === "KZ-43") as Feature<Polygon | MultiPolygon>;

const projection = geoConicEqualArea()
  .parallels([43, 47])
  .rotate([-64, 0])
  .fitExtent(
    [
      [16, 16],
      [KZO_W - 16, KZO_H - 16],
    ],
    region,
  );
const path = geoPath(projection).digits(1);
const pt = (ll: [number, number]) => {
  const p = projection(ll)!;
  return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10] as [number, number];
};

export interface KzoGeo {
  region: string;
  neighbours: string;
  lakes: { name: string; d: string }[];
  river: string;
  places: Record<string, [number, number]>;
  towns: { name: string; xy: [number, number]; main?: boolean }[];
}

export function kyzylordaGeo(): KzoGeo {
  return {
    region: path(region) ?? "",
    neighbours: regions.features.filter((f) => f !== region).map((f) => path(f) ?? "").join(" "),
    lakes: water.features.filter((f) => /Aral/.test(f.properties.name)).map((f) => ({ name: f.properties.name, d: path(f) ?? "" })),
    river: water.features.filter((f) => f.properties.name === "Syr Darya").map((f) => path(f) ?? "").join(" "),
    places: Object.fromEntries(KYZYLORDA_PLACES.map((p) => [p.id, pt(p.at)])),
    towns: KYZYLORDA_TOWNS.map((t) => ({ name: t.name, xy: pt(t.at), main: t.main })),
  };
}
