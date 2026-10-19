// ШАРТТЫ ОҚУ СХЕМАСЫ — ресми топырақ картасы ЕМЕС.
// Қазақстандағы топырақтың солтүстіктен оңтүстікке қарай ендік бойынша өзгеруін (зоналылығын)
// және ірі құм массивтерінің шамамен орнын оқу мақсатында жалпылап көрсетеді.
// Шекаралар қолмен, шамамен сызылған; әкімшілік шекараларға байланбаған.
// Нақты кеңістіктік топырақ дерегі қосылғанда осы файл ауыстырылады.

import type { Feature, Polygon } from "geojson";

export const SOIL_SCHEME_TITLE = "Шартты оқу схемасы";
export const SOIL_SCHEME_DISCLAIMER =
  "Бұл ресми топырақ картасы емес. Топырақ белдеулері мен құм массивтері оқу мақсатында жалпыланып, шамамен сызылған. Бір облыс бір ғана топырақ түрінен тұрмайды.";

export type SoilZoneKey = "chernozem" | "chestnut" | "brown" | "desert" | "mountain";
export type SoilSymbolKey = "sand" | "saline" | "takyr";

export interface SoilZone {
  key: SoilZoneKey;
  name: string;
  short: string;
  color: string;
  /** Түстен басқа ажырату белгісі */
  mark: string;
}

export const SOIL_ZONES: SoilZone[] = [
  { key: "chernozem", name: "Қара топырақ белдеуі", short: "Қара топырақ", color: "#6b4a33", mark: "I" },
  { key: "chestnut", name: "Қара қоңыр және қоңыр топырақ белдеуі", short: "Қоңыр", color: "#9a6b45", mark: "II" },
  { key: "brown", name: "Ашық қоңыр және шөлейт топырақ белдеуі", short: "Шөлейт", color: "#c89b67", mark: "III" },
  { key: "desert", name: "Сұр-қоңыр шөл топырақ белдеуі", short: "Шөл", color: "#e2c48f", mark: "IV" },
  { key: "mountain", name: "Таулы аймақтар топырағы", short: "Таулы", color: "#8a8f6a", mark: "V" },
];

export const SOIL_SYMBOLS: { key: SoilSymbolKey; name: string; desc: string }[] = [
  { key: "sand", name: "Құмды массивтер", desc: "нүктелі белгі" },
  { key: "saline", name: "Сортаңдар таралған жерлер", desc: "торлы белгі" },
  { key: "takyr", name: "Тақырлар", desc: "жарықшақ белгісі" },
];

const W = 44;
const E = 89;
const lonSteps = (from: number, to: number, step = 1) => {
  const xs: number[] = [];
  if (from < to) for (let x = from; x <= to; x += step) xs.push(x);
  else for (let x = from; x >= to; x -= step) xs.push(x);
  return xs;
};

/** Белдеулер арасындағы шамамен шекара (ендік) */
const boundary = {
  north: () => 58,
  b1: (lon: number) => 52.4 + 0.5 * Math.sin((lon - 50) / 5),
  b2: (lon: number) => 49.7 + 0.5 * Math.sin((lon - 46) / 4),
  b3: (lon: number) => 46.9 + 0.6 * Math.sin((lon - 48) / 6),
  south: () => 39,
};

function band(top: (lon: number) => number, bottom: (lon: number) => number): Polygon {
  const ring: [number, number][] = [
    ...lonSteps(W, E).map((x) => [x, top(x)] as [number, number]),
    ...lonSteps(E, W).map((x) => [x, bottom(x)] as [number, number]),
  ];
  ring.push(ring[0]);
  return { type: "Polygon", coordinates: [ring] };
}

const poly = (pts: [number, number][]): Polygon => ({ type: "Polygon", coordinates: [[...pts, pts[0]]] });

function ellipse(cx: number, cy: number, rx: number, ry: number, rotDeg = 0): Polygon {
  const pts: [number, number][] = [];
  const r = (rotDeg * Math.PI) / 180;
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const x = rx * Math.cos(a);
    const y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return poly(pts);
}

type ZoneFeature = Feature<Polygon, { zone: SoilZoneKey }>;
type SymbolFeature = Feature<Polygon, { symbol: SoilSymbolKey; label?: string }>;

export const SOIL_ZONE_FEATURES: ZoneFeature[] = [
  { type: "Feature", properties: { zone: "chernozem" }, geometry: band(boundary.north, boundary.b1) },
  { type: "Feature", properties: { zone: "chestnut" }, geometry: band(boundary.b1, boundary.b2) },
  { type: "Feature", properties: { zone: "brown" }, geometry: band(boundary.b2, boundary.b3) },
  { type: "Feature", properties: { zone: "desert" }, geometry: band(boundary.b3, boundary.south) },
  // Тянь-Шань, Жетісу Алатауы, Батыс Тянь-Шань, Қаратау, Тарбағатай мен Алтай — шамамен
  {
    type: "Feature",
    properties: { zone: "mountain" },
    geometry: poly([[73.5, 42.4], [80.6, 42.4], [80.6, 43.4], [78.5, 43.5], [76.5, 43.35], [74.5, 43.0]]),
  },
  { type: "Feature", properties: { zone: "mountain" }, geometry: ellipse(80.6, 45.05, 1.9, 0.55, 8) },
  { type: "Feature", properties: { zone: "mountain" }, geometry: ellipse(70.2, 42.2, 1.0, 0.45, 35) },
  { type: "Feature", properties: { zone: "mountain" }, geometry: ellipse(69.1, 43.45, 1.3, 0.22, 35) },
  { type: "Feature", properties: { zone: "mountain" }, geometry: ellipse(82.8, 47.3, 1.8, 0.35, 0) },
  {
    type: "Feature",
    properties: { zone: "mountain" },
    geometry: poly([[83.2, 49.0], [84.5, 48.4], [86.5, 48.4], [88, 48.9], [88, 50.6], [86.5, 50.6], [84.6, 50.2]]),
  },
];

export const SOIL_SYMBOL_FEATURES: SymbolFeature[] = [
  { type: "Feature", properties: { symbol: "sand", label: "Қызылқұм" }, geometry: ellipse(65.2, 43.65, 2.1, 0.75, 25) },
  { type: "Feature", properties: { symbol: "sand", label: "Арал маңы Қарақұмы" }, geometry: ellipse(61.9, 46.75, 1.3, 0.55, -20) },
  { type: "Feature", properties: { symbol: "sand", label: "Мойынқұм" }, geometry: ellipse(72.2, 44.55, 1.7, 0.45, 25) },
  { type: "Feature", properties: { symbol: "sand", label: "Таукұм" }, geometry: ellipse(76.3, 45.15, 1.3, 0.45, 15) },
  { type: "Feature", properties: { symbol: "sand", label: "Нарын құмы" }, geometry: ellipse(48.9, 47.4, 1.2, 0.55, -30) },
  { type: "Feature", properties: { symbol: "sand", label: "Үлкен Борсық" }, geometry: ellipse(59.4, 47.55, 0.6, 0.35, 30) },
  { type: "Feature", properties: { symbol: "saline", label: "Каспий маңы" }, geometry: ellipse(50.6, 46.75, 2.3, 0.4, -12) },
  { type: "Feature", properties: { symbol: "saline", label: "Аралдың құрғаған табаны" }, geometry: ellipse(60.6, 45.55, 0.75, 0.5, 0) },
  { type: "Feature", properties: { symbol: "saline", label: "Сырдария жайылмасы" }, geometry: ellipse(64.2, 45.05, 1.5, 0.22, -25) },
  { type: "Feature", properties: { symbol: "takyr", label: "Тақырлар" }, geometry: ellipse(63.3, 44.35, 0.8, 0.28, 10) },
];

export const SOIL_SCHEME_SOURCE_IDS = ["yapiyev-2018", "invest-kyzylorda", "qazaqgeography-kyzylorda", "wiki-kyzylorda-region"];
