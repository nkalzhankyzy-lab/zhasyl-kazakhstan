// Дереккөз файлдарынан жеңілдетілген GeoJSON жасайды.
// Іске қосу: npm run geo
import { readFileSync, writeFileSync } from "node:fs";
import { geoArea } from "d3-geo";

const src = (f) => JSON.parse(readFileSync(new URL(`./source-data/${f}`, import.meta.url)));
const out = (f, d) => writeFileSync(new URL(`../src/data/geo/${f}`, import.meta.url), JSON.stringify(d));

const P = 2; // ~1 км дәлдік (облыс деңгейіндегі карта үшін жеткілікті)
const r = (n) => Math.round(n * 10 ** P) / 10 ** P;
function roundRing(ring) {
  const res = [];
  for (const [x, y] of ring) {
    const p = [r(x), r(y)];
    const last = res[res.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) res.push(p);
  }
  return res;
}
// Дөңгелектегенде құлап қалған (4 нүктеден аз) сақиналарды тастаймыз
const roundPoly = (poly) => {
  const rings = poly.map(roundRing);
  if (rings[0].length < 4) return null;
  return rings.filter((x) => x.length >= 4);
};
function roundGeom(g) {
  if (g.type === "Polygon") return { type: g.type, coordinates: roundPoly(g.coordinates) };
  if (g.type === "MultiPolygon") {
    const polys = g.coordinates.map(roundPoly).filter(Boolean);
    return polys.length === 1 ? { type: "Polygon", coordinates: polys[0] } : { type: g.type, coordinates: polys };
  }
  if (g.type === "LineString") return { type: g.type, coordinates: roundRing(g.coordinates) };
  if (g.type === "MultiLineString") return { type: g.type, coordinates: g.coordinates.map(roundRing) };
  throw new Error(g.type);
}

// 1) Әкімшілік шекаралар: amCharts geodata 5.1.6, kazakhstan2023High (ISO 3166-2:KZ 2023 кодтары)
const am = src("kazakhstan2023High.json");
const regions = {
  type: "FeatureCollection",
  features: am.features.map((f) => {
    const feat = { type: "Feature", id: f.id, properties: { iso: f.id, nameLatin: f.properties.name }, geometry: roundGeom(f.geometry) };
    // d3-geo сфералық орам бағытын тексеру: аудан жер шарының жартысынан үлкен болса, бағыт қате
    if (geoArea(feat) > 2 * Math.PI) throw new Error("winding " + f.id);
    return feat;
  }),
};
out("regions.json", regions);

// 2) Су нысандары: Natural Earth (қоғамдық игілік)
const LAKES = ["Balkhash", "Zaysan", "Alakol", "North Aral Sea", "South Aral Sea", "Barsakelmes Lake", "Kapchagay", "Chardara Reservoir", "Tengiz", "Sasykkol", "Markakol", "Kushmurun"];
const lakes = src("ne_10m_lakes.full.geojson").features.filter((f) => f.geometry && LAKES.includes(f.properties.name_en));
const RIVERS = ["Syr  Darya", "Ural", "Ertis", "Irtysh", "Ile", "Esil", "Ishim", "Tobol"];
const rivers = src("ne_10m_rivers_lake_centerlines.full.geojson").features.filter(
  (f) => f.geometry && RIVERS.includes(f.properties.name_en) && f.properties.featurecla === "River",
);
const ocean = src("ocean50.geojson").features[0];
const caspian = (ocean.geometry.type === "MultiPolygon" ? ocean.geometry.coordinates : [ocean.geometry.coordinates]).find((p) => {
  const xs = p[0].map((c) => c[0]);
  return Math.min(...xs) > 40 && Math.max(...xs) < 60;
});
const water = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { kind: "sea", name: "Caspian Sea" }, geometry: roundGeom({ type: "Polygon", coordinates: caspian }) },
    ...lakes.map((f) => ({ type: "Feature", properties: { kind: "lake", name: f.properties.name_en }, geometry: roundGeom(f.geometry) })),
    ...rivers.map((f) => ({ type: "Feature", properties: { kind: "river", name: f.properties.name_en.replace(/\s+/g, " ") }, geometry: roundGeom(f.geometry) })),
  ].filter((f) => f.geometry.coordinates && f.geometry.coordinates.length),
};
for (const f of water.features) if (f.properties.kind !== "river" && geoArea(f) > 2 * Math.PI) {
  // Natural Earth сақиналары кері бағытта болуы мүмкін — сақиналарды аударамыз
  const g = f.geometry;
  if (g.type === "Polygon") g.coordinates = g.coordinates.map((x) => x.slice().reverse());
  else g.coordinates = g.coordinates.map((p) => p.map((x) => x.slice().reverse()));
}
out("water.json", water);
console.log("regions:", regions.features.length, "water:", water.features.length);
