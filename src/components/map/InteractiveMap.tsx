"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { REGIONS, regionById } from "@/data/regions";
import { SCHOOLS } from "@/data/schools";
import { SOIL_ZONES } from "@/data/soil-scheme";
import {
  COUNTRY_D,
  MAP_H,
  MAP_W,
  project,
  REGION_SHAPES,
  SOIL_SYMBOL_SHAPES,
  SOIL_ZONE_SHAPES,
  WATER_LABELS,
  WATER_SHAPES,
} from "@/lib/geo";
import type { DataStatus } from "@/lib/types";
import { MapDefs } from "./MapPatterns";
import type { MapLayer } from "./MapLayerSwitch";

export interface MapPoint {
  id: string;
  lat: number;
  lon: number;
  status: DataStatus;
  name: string;
  regionId: string;
}

interface Props {
  layer: MapLayer;
  selectedRegionId: string | null;
  selectedSchoolId: string | null;
  points: MapPoint[];
  onSelectRegion: (id: string) => void;
  onSelectSchool: (id: string) => void;
  onSelectPoint: (p: MapPoint) => void;
}

interface View {
  k: number;
  x: number;
  y: number;
}
const MIN_K = 1;
const MAX_K = 9;
const INITIAL: View = { k: 1, x: 0, y: 0 };

function clampView(v: View): View {
  const k = Math.min(MAX_K, Math.max(MIN_K, v.k));
  const minX = MAP_W * (1 - k);
  const minY = MAP_H * (1 - k);
  return { k, x: Math.min(0, Math.max(minX, v.x)), y: Math.min(0, Math.max(minY, v.y)) };
}

// Облыстардың табиғи түстері (қабатқа байланысты)
const NATURAL = ["#e6cf9c", "#dcc08a", "#ead7a8", "#d6b97f", "#e1c793", "#d9c79a"];
const GREENISH = ["#d6dfae", "#cbd89f", "#dfe5b9", "#c4d398", "#d2dcab", "#dbe2b4"];

const ZONE_MARKS: { zone: string; at: [number, number] }[] = [
  { zone: "chernozem", at: [66.5, 53.75] },
  { zone: "chestnut", at: [61.2, 50.85] },
  { zone: "brown", at: [57.2, 48.35] },
  { zone: "desert", at: [56.0, 45.0] },
  { zone: "mountain", at: [79.2, 42.95] },
];

export function InteractiveMap({ layer, selectedRegionId, selectedSchoolId, points, onSelectRegion, onSelectSchool, onSelectPoint }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>(INITIAL);
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  const [pxPerUnit, setPxPerUnit] = useState(0.8);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: boolean; startDist: number; startView: View; startMid: [number, number]; last: [number, number] } | null>(null);
  const suppressClick = useRef(false);

  const showHint = useCallback((text: string) => {
    setHint(text);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), 1800);
  }, []);

  // Экран пикселінен viewBox бірлігіне
  const toUnits = useCallback((clientX: number, clientY: number): [number, number] => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((clientX - r.left) / r.width) * MAP_W, ((clientY - r.top) / r.height) * MAP_H];
  }, []);

  const zoomAt = useCallback((factor: number, at: [number, number] = [MAP_W / 2, MAP_H / 2]) => {
    setView((v) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
      const f = k / v.k;
      return clampView({ k, x: at[0] - (at[0] - v.x) * f, y: at[1] - (at[1] - v.y) * f });
    });
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPxPerUnit(el.getBoundingClientRect().width / MAP_W));
    ro.observe(el);
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomAt(Math.exp(-e.deltaY * 0.0025), toUnits(e.clientX, e.clientY));
      } else {
        showHint("Масштабтау үшін Ctrl (Mac-та ⌘) пернесін басып тұрып, тышқан дөңгелегін айналдырыңыз");
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", onWheel);
    };
  }, [zoomAt, toUnits, showHint]);

  // Жылжыту және саусақпен масштабтау (Pointer Events)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const mid: [number, number] =
      pts.length >= 2 ? toUnits((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2) : toUnits(e.clientX, e.clientY);
    gesture.current = {
      moved: false,
      startDist: pts.length >= 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0,
      startView: viewRef.current,
      startMid: mid,
      last: [e.clientX, e.clientY],
    };
    suppressClick.current = false;
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId) || !gesture.current) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const g = gesture.current;
      const pts = [...pointers.current.values()];
      const r = svgRef.current!.getBoundingClientRect();
      const unit = MAP_W / r.width;
      if (pts.length >= 2) {
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const mid = toUnits((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
        const sv = g.startView;
        const k = Math.min(MAX_K, Math.max(MIN_K, sv.k * (g.startDist ? dist / g.startDist : 1)));
        const f = k / sv.k;
        g.moved = true;
        setView(clampView({ k, x: mid[0] - (g.startMid[0] - sv.x) * f, y: mid[1] - (g.startMid[1] - sv.y) * f }));
      } else {
        const dx = e.clientX - g.last[0];
        const dy = e.clientY - g.last[1];
        if (!g.moved && Math.hypot(e.clientX - g.last[0], e.clientY - g.last[1]) < 4) return;
        g.moved = true;
        g.last = [e.clientX, e.clientY];
        if (e.pointerType === "touch" && viewRef.current.k <= 1.01) {
          showHint("Картаны үлкейту үшін екі саусақпен ажыратыңыз немесе «+» батырмасын басыңыз");
          return;
        }
        setView((v) => clampView({ ...v, x: v.x + dx * unit, y: v.y + dy * unit }));
      }
    };
    const up = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.delete(e.pointerId);
      if (gesture.current?.moved) suppressClick.current = true;
      if (pointers.current.size === 0) gesture.current = null;
      else if (gesture.current) {
        const p = [...pointers.current.values()][0];
        gesture.current = { ...gesture.current, startView: viewRef.current, startDist: 0, last: [p.x, p.y] };
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [toUnits, showHint]);

  const handleRegionClick = (id: string) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onSelectRegion(id);
  };

  const onRegionKey = (e: ReactKeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectRegion(id);
    }
  };

  const onMapKey = (e: ReactKeyboardEvent) => {
    const step = 40 / view.k;
    const map: Record<string, () => void> = {
      "+": () => zoomAt(1.4),
      "=": () => zoomAt(1.4),
      "-": () => zoomAt(1 / 1.4),
      "0": () => setView(INITIAL),
      ArrowLeft: () => setView((v) => clampView({ ...v, x: v.x + step * v.k })),
      ArrowRight: () => setView((v) => clampView({ ...v, x: v.x - step * v.k })),
      ArrowUp: () => setView((v) => clampView({ ...v, y: v.y + step * v.k })),
      ArrowDown: () => setView((v) => clampView({ ...v, y: v.y - step * v.k })),
    };
    // Бағыт пернелері тек карта өзі фокуста болғанда жұмыс істейді
    if (e.key.startsWith("Arrow") && e.target !== e.currentTarget) return;
    const fn = map[e.key];
    if (!fn) return;
    e.preventDefault();
    fn();
  };

  // Таңдалған облысқа жақындату
  useEffect(() => {
    if (!selectedRegionId) return;
    const s = REGION_SHAPES.find((r) => r.id === selectedRegionId);
    if (!s) return;
    const v = viewRef.current;
    const [[x0, y0], [x1, y1]] = s.bounds;
    // Шағын қалалар үшін ғана автоматты түрде жақындатамыз
    if (x1 - x0 < 40 && v.k < 3) {
      const k = 4;
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      setView(clampView({ k, x: MAP_W / 2 - cx * k, y: MAP_H / 2 - cy * k }));
    }
  }, [selectedRegionId]);

  const k = view.k;
  const inv = 1 / k;
  const unitPx = pxPerUnit * k; // 1 viewBox бірлігі экранда неше пиксель

  // Атауларды масштабқа қарай, үйілмейтіндей орналастыру
  const labels = useMemo(() => {
    const placed: [number, number, number, number][] = [];
    const out: { id: string; x: number; y: number; text: string; size: number; city: boolean }[] = [];
    const candidates = [...REGION_SHAPES]
      .map((s) => ({ s, r: regionById(s.id)! }))
      .filter(({ r }) => r)
      .sort((a, b) => {
        if (a.s.id === selectedRegionId) return -1;
        if (b.s.id === selectedRegionId) return 1;
        if (a.r.kind !== b.r.kind) return a.r.kind === "oblys" ? -1 : 1;
        return b.s.area - a.s.area;
      });
    for (const { s, r } of candidates) {
      const city = r.kind === "city";
      if (city && k < 2.2 && s.id !== selectedRegionId) continue;
      // Кіші экранда атаулар сәл кішірейеді (бірақ 9,5 px-тен кем емес)
      const fit = Math.min(1.1, Math.max(0.76, pxPerUnit / 0.8));
      const sizePx = (city ? 12 : s.id === selectedRegionId ? 14 : 12.5) * fit;
      const size = sizePx / unitPx;
      const text = r.shortKk;
      const w = text.length * sizePx * 0.58 + 8;
      const h = sizePx * 1.35;
      const sx = (s.label[0] * k + view.x) * pxPerUnit;
      const sy = (s.label[1] * k + view.y) * pxPerUnit + (city ? -12 : 0);
      if (sx < -w || sy < -h || sx > MAP_W * pxPerUnit + w || sy > MAP_H * pxPerUnit + h) continue;
      const box: [number, number, number, number] = [sx - w / 2, sy - h / 2, sx + w / 2, sy + h / 2];
      if (placed.some((b) => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]))) continue;
      // Облыс экранда тым кішкентай болса — атау сыймайды
      const regionPxWidth = (s.bounds[1][0] - s.bounds[0][0]) * unitPx;
      if (!city && regionPxWidth < w * 0.7 && s.id !== selectedRegionId) continue;
      placed.push(box);
      out.push({ id: s.id, x: s.label[0], y: s.label[1] + (city ? -12 / unitPx : 0), text, size, city });
    }
    return out;
  }, [k, view.x, view.y, pxPerUnit, unitPx, selectedRegionId]);

  const school = SCHOOLS[0];
  const schoolXY = project(school.location.lon, school.location.lat)!;
  const fillFor = (id: string, i: number) => {
    const selected = id === selectedRegionId;
    const hovered = hover?.id === id;
    if (layer === "soil") return selected ? "rgba(255,255,255,0.28)" : hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.001)";
    const base = layer === "plants" ? GREENISH[i % 6] : NATURAL[i % 6];
    if (selected) return layer === "plants" ? "#b9d28a" : "#c9df9f";
    if (hovered) return "#f1e2bd";
    return base;
  };

  const hoverRegion = hover ? regionById(hover.id) : null;
  const selectedShape = REGION_SHAPES.find((r) => r.id === selectedRegionId);
  const touchAction = k > 1.01 ? "none" : "pan-y";

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        className="map-surface relative w-full overflow-hidden rounded-[1.5rem]"
        style={{ aspectRatio: `${MAP_W} / ${MAP_H}`, touchAction }}
        tabIndex={0}
        role="application"
        aria-label="Қазақстанның интерактивті картасы. Облысты таңдау үшін Tab пернесімен өтіп, Enter басыңыз. Жылжыту — бағыт пернелері, масштаб — плюс және минус."
        onKeyDown={onMapKey}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="absolute inset-0 h-full w-full"
          onPointerDown={onPointerDown}
          onDoubleClick={(e) => zoomAt(1.8, toUnits(e.clientX, e.clientY))}
          onPointerLeave={() => setHover(null)}
        >
          <MapDefs countryD={COUNTRY_D} k={view.k} />
          <rect width={MAP_W} height={MAP_H} fill="#f1e8d2" />
          <g transform={`translate(${view.x} ${view.y}) scale(${k})`}>
            {/* Теңіз бен көлдер (контекст) */}
            {WATER_SHAPES.filter((w) => w.kind === "sea").map((w) => (
              <path key={w.name} d={w.d} fill="#8fc0de" stroke="#5f97bd" strokeWidth={0.8 * inv} />
            ))}
            {/* Көлемді әсер: көлеңке және қабатталған жиек */}
            <use href="#country-shape" fill="#3b2a17" opacity="0.35" filter="url(#map-shadow)" transform="translate(6 14)" />
            {[9, 7, 5, 3].map((dy) => (
              <use key={dy} href="#country-shape" fill={dy > 6 ? "#7a5634" : "#9a7048"} transform={`translate(0 ${dy})`} />
            ))}
            <use href="#country-shape" fill="#e9d6a8" />

            {/* Топырақ қабаты: шартты схема, ел шекарасымен қиылған */}
            {layer === "soil" && (
              <g clipPath="url(#clip-country)" aria-hidden>
                {SOIL_ZONE_SHAPES.map((z, i) => (
                  <path key={i} d={z.d} fill={`url(#zone-${z.zone})`} opacity={0.92} />
                ))}
                {SOIL_SYMBOL_SHAPES.map((s, i) => (
                  <path key={i} d={s.d} fill={`url(#sym-${s.symbol})`} stroke="#5b4026" strokeWidth={0.6 * inv} strokeDasharray={`${3 * inv} ${2 * inv}`} opacity={0.95} />
                ))}
              </g>
            )}

            {/* Табиғи текстура мен жарық */}
            <g clipPath="url(#clip-country)" pointerEvents="none">
              <rect width={MAP_W} height={MAP_H} filter="url(#texture)" opacity={layer === "soil" ? 0.25 : 0.4} />
              <rect width={MAP_W} height={MAP_H} fill="url(#light)" />
            </g>

            {/* Облыстар */}
            <g>
              {REGION_SHAPES.map((s, i) => {
                const r = regionById(s.id);
                return (
                  <path
                    key={s.id}
                    d={s.d}
                    data-region={s.id}
                    className="map-region"
                    fill={fillFor(s.id, i)}
                    stroke="#6b4b2f"
                    strokeOpacity={0.75}
                    strokeWidth={(r?.kind === "city" ? 0.7 : 1.1) * inv}
                    strokeLinejoin="round"
                    tabIndex={0}
                    role="button"
                    aria-label={`${r?.nameKk ?? s.id}${s.id === selectedRegionId ? ", таңдалған" : ""}`}
                    aria-pressed={s.id === selectedRegionId}
                    onClick={() => handleRegionClick(s.id)}
                    onKeyDown={(e) => onRegionKey(e, s.id)}
                    onPointerMove={(e) => {
                      if (e.pointerType !== "mouse") return;
                      const rect = wrapRef.current!.getBoundingClientRect();
                      setHover({ id: s.id, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onFocus={() => setHover({ id: s.id, x: (s.label[0] * k + view.x) * pxPerUnit, y: (s.label[1] * k + view.y) * pxPerUnit })}
                    onBlur={() => setHover(null)}
                  />
                );
              })}
            </g>

            {/* Су қабаты: өзендер мен көлдер */}
            <g pointerEvents="none">
              {WATER_SHAPES.filter((w) => w.kind === "river").map((w, i) => (
                <path
                  key={i}
                  d={w.d}
                  fill="none"
                  stroke="#3f86bd"
                  strokeOpacity={layer === "water" ? 0.95 : 0.35}
                  strokeWidth={(layer === "water" ? 1.8 : 0.9) * inv}
                  clipPath="url(#clip-country)"
                />
              ))}
              {WATER_SHAPES.filter((w) => w.kind === "lake").map((w, i) => (
                <path key={i} d={w.d} fill="#8fc0de" stroke="#4f8ab4" strokeWidth={0.6 * inv} opacity={layer === "water" ? 1 : 0.85} />
              ))}
              {(layer === "water" ? WATER_LABELS : WATER_LABELS.filter((w) => w.min <= 1.6)).map(
                (w) =>
                  k >= (layer === "water" ? w.min - 0.6 : w.min) && (
                    <text
                      key={w.name}
                      x={w.at[0]}
                      y={w.at[1]}
                      fontSize={11.5 / unitPx}
                      textAnchor="middle"
                      fill="#1e5f8f"
                      fontStyle="italic"
                      stroke="#f4efe2"
                      strokeWidth={3 / unitPx}
                      paintOrder="stroke"
                    >
                      {w.name}
                    </text>
                  ),
              )}
            </g>

            {/* Таңдалған облыс — көтерілген контур */}
            {selectedShape && (
              <g pointerEvents="none" filter="url(#lift-shadow)">
                <path d={selectedShape.d} fill="none" stroke="#ffffff" strokeWidth={5 * inv} strokeOpacity={0.9} strokeLinejoin="round" />
                <path d={selectedShape.d} fill="none" stroke="#2f8a3a" strokeWidth={2.6 * inv} strokeLinejoin="round" />
              </g>
            )}

            {/* Топырақ белдеулерінің нөмірлері — түстен басқа ажырату белгісі */}
            {layer === "soil" &&
              ZONE_MARKS.map((m) => {
                const z = SOIL_ZONES.find((x) => x.key === m.zone)!;
                const p = project(m.at[0], m.at[1])!;
                return (
                  <g key={m.zone} transform={`translate(${p[0]} ${p[1]}) scale(${inv})`} pointerEvents="none">
                    <circle r={13} fill="#fffbf2" stroke={z.color} strokeWidth={3} />
                    <text textAnchor="middle" dy="4.5" fontSize="12.5" fontWeight="700" fill="#3b2a17">
                      {z.mark}
                    </text>
                  </g>
                );
              })}
            {layer === "soil" &&
              k >= 2 &&
              SOIL_SYMBOL_SHAPES.filter((s) => s.label).map((s) => (
                <text
                  key={s.label}
                  x={s.c[0]}
                  y={s.c[1]}
                  fontSize={10.5 / unitPx}
                  textAnchor="middle"
                  fill="#4a3018"
                  stroke="#fbf3df"
                  strokeWidth={3 / unitPx}
                  paintOrder="stroke"
                  pointerEvents="none"
                >
                  {s.label}
                </text>
              ))}

            {/* Облыс атаулары */}
            <g pointerEvents="none">
              {labels.map((l) => (
                <text
                  key={l.id}
                  x={l.x}
                  y={l.y}
                  fontSize={l.size}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontWeight={l.id === selectedRegionId ? 800 : 650}
                  fill={l.id === selectedRegionId ? "#14391f" : "#2d2112"}
                  stroke="#fbf5e6"
                  strokeWidth={3.2 / unitPx}
                  paintOrder="stroke"
                >
                  {l.text}
                </text>
              ))}
              {/* Республикалық маңызы бар қалалар — нүкте */}
              {REGIONS.filter((r) => r.kind === "city").map((r) => {
                const s = REGION_SHAPES.find((x) => x.id === r.id)!;
                const cx = (s.bounds[0][0] + s.bounds[1][0]) / 2;
                const cy = (s.bounds[0][1] + s.bounds[1][1]) / 2;
                return k < 3 ? <circle key={r.id} cx={cx} cy={cy} r={3.2 * inv} fill="#fffbf2" stroke="#6b4b2f" strokeWidth={1.4 * inv} /> : null;
              })}
            </g>

            {/* Зерттеу нүктелері */}
            {(layer === "research" || layer === "soil") &&
              points.map((p) => {
                const xy = project(p.lon, p.lat);
                if (!xy) return null;
                const s = (layer === "research" ? 1.15 : 0.9) * inv;
                return (
                  <g
                    key={p.id}
                    transform={`translate(${xy[0]} ${xy[1]}) scale(${s})`}
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-label={`${p.status === "demo" ? "Демо үлгі" : "Топырақ үлгісі"}: ${p.name}`}
                    onClick={() => !suppressClick.current && onSelectPoint(p)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelectPoint(p))}
                  >
                    <circle r={9} fill={p.status === "demo" ? "#fff7e0" : "#2f8a3a"} stroke={p.status === "demo" ? "#b7791f" : "#fff"} strokeWidth={2.2} strokeDasharray={p.status === "demo" ? "3 2" : undefined} />
                    <text textAnchor="middle" dy="3.6" fontSize="9.5" fontWeight="800" fill={p.status === "demo" ? "#8a5a12" : "#fff"}>
                      {p.status === "demo" ? "Д" : "Ү"}
                    </text>
                  </g>
                );
              })}

            {/* Мектеп белгісі (координаты шамамен) */}
            <g
              transform={`translate(${schoolXY[0]} ${schoolXY[1]})`}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${school.name}. Орналасуы шамамен көрсетілген, координат нақтыланады.`}
              aria-pressed={selectedSchoolId === school.id}
              onClick={() => !suppressClick.current && onSelectSchool(school.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelectSchool(school.id))}
            >
              <circle r={(layer === "schools" ? 26 : 18) * inv} fill="#2f8a3a" fillOpacity={0.12} stroke="#2f8a3a" strokeWidth={1.2 * inv} strokeDasharray={`${4 * inv} ${3 * inv}`} />
              <g transform={`scale(${inv * (layer === "schools" ? 1.25 : 1)})`}>
                <path d="M0 6 L-9 -8 A11 11 0 1 1 9 -8 Z" fill={selectedSchoolId === school.id ? "#14391f" : "#1f4a2c"} stroke="#fff" strokeWidth={2} transform="translate(0 -8)" />
                <path d="M-5 -19 L0 -22 L5 -19 L5 -14 L-5 -14 Z" fill="#fff" />
              </g>
              {(layer === "schools" || k >= 1.8 || selectedSchoolId) && (
                <text y={16 * inv} fontSize={11.5 / unitPx} textAnchor="middle" fontWeight={700} fill="#14391f" stroke="#fbf5e6" strokeWidth={3 / unitPx} paintOrder="stroke">
                  {school.shortName} (шамамен)
                </text>
              )}
            </g>
          </g>
        </svg>

        {/* Tooltip */}
        {hover && hoverRegion && (
          <div
            className="pointer-events-none absolute z-10 max-w-60 -translate-x-1/2 rounded-xl bg-ink/90 px-3 py-2 text-sm text-white shadow-lift"
            style={{ left: Math.min(Math.max(hover.x, 90), pxPerUnit * MAP_W - 90), top: Math.max(hover.y - 64, 4) }}
            role="tooltip"
          >
            <div className="font-semibold">{hoverRegion.nameKk}</div>
            <div className="text-xs text-white/80">
              {hoverRegion.kind === "city" ? "Республикалық маңызы бар қала" : `Орталығы: ${hoverRegion.center}`}
              {hoverRegion.detail === "full" ? " · толық панель" : ""}
            </div>
          </div>
        )}

        {hint && (
          <div className="pointer-events-none absolute inset-x-3 top-1/2 z-10 mx-auto max-w-sm -translate-y-1/2 rounded-2xl bg-ink/80 px-4 py-3 text-center text-sm font-medium text-white" role="status">
            {hint}
          </div>
        )}

        {/* Басқару батырмалары */}
        <div className="absolute bottom-2 left-2 z-10 flex flex-col sm:bottom-3 sm:left-3 overflow-hidden rounded-2xl border border-line bg-paper/95 shadow-soft">
          <button type="button" className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center text-forest hover:bg-mint" onClick={() => zoomAt(1.5)} aria-label="Үлкейту">
            <Plus size={20} />
          </button>
          <button type="button" className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center border-y border-line text-forest hover:bg-mint" onClick={() => zoomAt(1 / 1.5)} aria-label="Кішірейту">
            <Minus size={20} />
          </button>
          <button type="button" className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center text-forest hover:bg-mint" onClick={() => setView(INITIAL)} aria-label="Бастапқы көрініске қайту">
            <RotateCcw size={18} />
          </button>
        </div>
        <a
          href="https://www.amcharts.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1 right-1.5 z-10 rounded bg-paper/80 px-1.5 text-[10px] sm:text-[11px] text-muted hover:text-forest"
        >
          Шекаралар: amCharts geodata
        </a>
      </div>
    </div>
  );
}
