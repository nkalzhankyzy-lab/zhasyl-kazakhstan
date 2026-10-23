"use client";

import {
  Info,
  Lightbulb,
  MapPin,
  Move,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  Trees,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, type MouseEvent } from "react";
import {
  ANNEXES,
  BUILDINGS,
  CANTEEN,
  factFor,
  KIND_LABEL,
  MAP_H,
  MAP_W,
  OPEN_SPOTS,
  spotById,
  TREE_CO2_KG_YEAR,
  ZONES,
} from "@/data/school-map";
import { useCollection, useHydrated, useSyncStatus } from "@/lib/storage/hooks";
import { repositories } from "@/lib/storage/repositories";
import type { Room, YardItem } from "@/lib/types";
import { AskAi } from "../ai/AskAi";
import { useEditGuard, useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";
import { roomNo, roomsContext } from "./roomMath";
import {
  CONDITION_YARD,
  seeded,
  yardContext,
  yardTips,
  yardTotals,
} from "./yardMath";
import { YardForm } from "./YardForm";

const fmt = (n: number, d = 0) =>
  n.toLocaleString("ru-RU", { maximumFractionDigits: d });

const FLOWER_COLORS = [
  "#e11d48",
  "#f59e0b",
  "#db2777",
  "#f97316",
  "#a855f7",
  "#facc15",
];

function ItemGlyphs({ item, selected }: { item: YardItem; selected: boolean }) {
  const pts = useMemo(() => {
    const rnd = seeded(item.id);
    const cap = item.kind === "flowers" ? 70 : item.kind === "shrub" ? 45 : 60;
    const n = Math.min(item.count, cap);
    return Array.from({ length: n }, () => {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd());
      return {
        x: item.x + Math.cos(a) * r * item.rx,
        y: item.y + Math.sin(a) * r * item.ry,
        c: FLOWER_COLORS[Math.floor(rnd() * FLOWER_COLORS.length)],
      };
    });
  }, [item]);
  const poor = item.condition === "poor";
  return (
    <g>
      {selected && (
        <ellipse
          cx={item.x}
          cy={item.y}
          rx={item.rx + 8}
          ry={item.ry + 8}
          fill="none"
          stroke="#c2410c"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      )}
      {pts.map((p, i) =>
        item.kind === "tree" ? (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={5.2}
            fill={poor ? "#a3a35a" : "#3f7d3a"}
            stroke="#24502a"
            strokeWidth={1}
            opacity={0.92}
          />
        ) : item.kind === "shrub" ? (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.4}
            fill={poor ? "#b5b36a" : "#79a83f"}
            stroke="#4b6d2a"
            strokeWidth={0.8}
          />
        ) : (
          <circle key={i} cx={p.x} cy={p.y} r={2.2} fill={p.c} />
        ),
      )}
    </g>
  );
}

export function SchoolMap({ rooms }: { rooms: Room[] }) {
  const all = useCollection(repositories.yard);
  const items = useMemo(() => all.filter((i) => i.status === "user"), [all]);
  const sync = useSyncStatus();
  const hydrated = useHydrated();
  const guard = useEditGuard();
  const feedback = useSaveFeedback();
  const svgRef = useRef<SVGSVGElement>(null);
  const [sel, setSel] = useState<{
    type: "item" | "room" | "spot";
    id: string;
  } | null>(null);
  const [mode, setMode] = useState<"view" | "add" | "move">("view");
  const [addAt, setAddAt] = useState<{ x: number; y: number } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const totals = yardTotals(items);
  const tips = useMemo(() => yardTips(items), [items]);
  const selItem =
    sel?.type === "item" ? items.find((i) => i.id === sel.id) : undefined;
  const selRoom =
    sel?.type === "room" ? rooms.find((r) => r.id === sel.id) : undefined;
  const selSpot =
    sel?.type === "spot" ? OPEN_SPOTS.find((s) => s.id === sel.id) : undefined;
  const placedRooms = rooms
    .map((r, i) => ({ room: r, n: i + 1, spot: spotById(r.mapSpot) }))
    .filter((x) => x.spot);

  function toMap(e: MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return {
      x: Math.round(Math.min(MAP_W - 6, Math.max(6, p.x))),
      y: Math.round(Math.min(MAP_H - 6, Math.max(6, p.y))),
    };
  }

  async function onMapClick(e: MouseEvent<SVGSVGElement>) {
    if (mode === "view") return;
    const p = toMap(e);
    if (!p) return;
    if (mode === "add") {
      setAddAt(p);
      setMode("view");
    } else if (mode === "move" && selItem) {
      setMode("view");
      await feedback(
        repositories.yard.upsert({
          ...selItem,
          x: p.x,
          y: p.y,
          updatedAt: new Date().toISOString(),
        }),
        "Орны ауыстырылды",
      );
    }
  }

  return (
    <section aria-labelledby="map-title" className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="map-title"
            className="flex items-center gap-2 font-serif text-2xl font-bold text-forest"
          >
            <MapPin size={24} aria-hidden /> Мектеп картасы: №23 мектеп-лицей
          </h2>
          <p className="text-muted">
            Спутник суреті бойынша шамамен салынған. Ағашты, гүлзарды немесе
            кабинетті басып, толық мәліметін көріңіз.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={guard(() => {
            setSel(null);
            setMode(mode === "add" ? "view" : "add");
          })}
        >
          {mode === "add" ? (
            <X size={18} aria-hidden />
          ) : (
            <Plus size={18} aria-hidden />
          )}{" "}
          {mode === "add" ? "Болдырмау" : "Аулаға өсімдік қосу"}
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[
          ["Барлығы", `${fmt(totals.total)} өсімдік`],
          ["Ағаш", fmt(totals.trees)],
          ["Бұта", fmt(totals.shrubs)],
          ["Гүл", fmt(totals.flowers)],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-xl bg-white px-3 py-2 ring-1 ring-line"
          >
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="text-lg font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      {mode !== "view" && (
        <p
          className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="status"
        >
          {mode === "add"
            ? "Картадан жаңа өсімдіктің орнын басыңыз."
            : "Картадан жаңа орынды басыңыз."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="card min-w-0 overflow-hidden p-2">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            className={`h-auto w-full touch-manipulation select-none ${mode !== "view" ? "cursor-crosshair" : ""}`}
            role="img"
            aria-label="Мектеп аумағының сызбасы: ғимараттар, футбол алаңы, ағаштар мен гүлзарлар"
            onClick={(e) => void onMapClick(e)}
          >
            <defs>
              <pattern
                id="grass"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
              >
                <rect width="8" height="8" fill="#4f9a4a" />
                <path d="M0 4h8" stroke="#5aa654" strokeWidth="2" />
              </pattern>
              <pattern
                id="pave"
                width="12"
                height="12"
                patternUnits="userSpaceOnUse"
              >
                <rect width="12" height="12" fill="#e6dccb" />
                <path
                  d="M0 0h12v12"
                  fill="none"
                  stroke="#d7cab3"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            {/* көрші аумақ */}
            <rect width={MAP_W} height={MAP_H} fill="#efe7d6" />
            {/* мектеп аумағы */}
            <rect
              x={4}
              y={62}
              width={474}
              height={492}
              rx={6}
              fill="#f4ecd9"
              stroke="#8b7a5c"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            {/* көше (солтүстікте, кіреберіс жақта) */}
            <rect x={0} y={8} width={MAP_W} height={38} fill="#9aa0a6" />
            <path
              d={`M0 27H${MAP_W}`}
              stroke="#f8fafc"
              strokeWidth={2}
              strokeDasharray="14 10"
            />
            <text x={18} y={40} fontSize={11} fill="#f8fafc" fontWeight={600}>
              Көше
            </text>
            {/* ішкі аула (оңтүстікте) */}
            <text
              x={304}
              y={546}
              fontSize={10}
              textAnchor="middle"
              fill="#6b4b2f"
              fontWeight={600}
            >
              Ішкі аула
            </text>
            {/* аймақтар */}
            {ZONES.map((z) => (
              <g key={z.id}>
                {z.kind === "field" ? (
                  <>
                    <rect
                      x={z.x}
                      y={z.y}
                      width={z.w}
                      height={z.h}
                      rx={4}
                      fill="url(#grass)"
                    />
                    <rect
                      x={z.x + 6}
                      y={z.y + 6}
                      width={z.w - 12}
                      height={z.h - 12}
                      fill="none"
                      stroke="#e8f5e9"
                      strokeWidth={1.5}
                    />
                    <path
                      d={`M${z.x + 6} ${z.y + z.h / 2}h${z.w - 12}`}
                      stroke="#e8f5e9"
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={z.x + z.w / 2}
                      cy={z.y + z.h / 2}
                      r={14}
                      fill="none"
                      stroke="#e8f5e9"
                      strokeWidth={1.5}
                    />
                    <text
                      x={z.x + z.w / 2}
                      y={z.y + z.h / 2 + 32}
                      fontSize={11}
                      textAnchor="middle"
                      fill="#fff"
                      fontWeight={700}
                    >
                      {z.label}
                    </text>
                  </>
                ) : (
                  <>
                    <rect
                      x={z.x}
                      y={z.y}
                      width={z.w}
                      height={z.h}
                      rx={4}
                      fill={z.kind === "sport" ? "#c9d6c0" : "url(#pave)"}
                      stroke="#b9ab90"
                      strokeWidth={1}
                    />
                    <text
                      x={z.x + z.w / 2}
                      y={z.y + z.h / 2 + 4}
                      fontSize={z.kind === "inner" ? 8 : 10}
                      textAnchor="middle"
                      fill="#56634f"
                      fontWeight={600}
                    >
                      {z.label}
                    </text>
                  </>
                )}
              </g>
            ))}
            {/* ғимараттар */}
            {BUILDINGS.map((b) => (
              <rect
                key={b.id}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill="#7c3f3a"
              />
            ))}
            {BUILDINGS.map((b) => (
              <path
                key={`r${b.id}`}
                d={
                  b.w > b.h
                    ? `M${b.x + 4} ${b.y + b.h / 2}H${b.x + b.w - 4}`
                    : `M${b.x + b.w / 2} ${b.y + 4}V${b.y + b.h - 4}`
                }
                stroke="#5c2c28"
                strokeWidth={1.5}
              />
            ))}
            {ANNEXES.map((b) => (
              <rect
                key={b.id}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill="#c9c2b6"
                stroke="#a39a8a"
              />
            ))}
            <text
              x={300}
              y={404}
              fontSize={13}
              textAnchor="middle"
              fill="#fdf2e9"
              fontWeight={700}
            >
              Мектеп-лицей №23
            </text>
            <text
              x={CANTEEN.x}
              y={CANTEEN.y}
              fontSize={11}
              textAnchor="middle"
              fill="#fdf2e9"
              fontWeight={600}
            >
              {CANTEEN.label}
            </text>
            {/* ашық орындар */}
            {OPEN_SPOTS.map((s) => (
              <g
                key={s.id}
                className="cursor-pointer"
                onClick={(e) => {
                  if (mode !== "view") return;
                  e.stopPropagation();
                  setSel({ type: "spot", id: s.id });
                }}
              >
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={10}
                  fill="#fffbeb"
                  stroke="#d97706"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                />
                <path
                  d={`M${s.x - 4} ${s.y}h8M${s.x} ${s.y - 4}v8`}
                  stroke="#d97706"
                  strokeWidth={2}
                />
              </g>
            ))}
            {/* аула өсімдіктері */}
            {items.map((i) => (
              <g
                key={i.id}
                className="cursor-pointer"
                onClick={(e) => {
                  if (mode !== "view") return;
                  e.stopPropagation();
                  setSel({ type: "item", id: i.id });
                }}
              >
                <ellipse
                  cx={i.x}
                  cy={i.y}
                  rx={i.rx + 4}
                  ry={i.ry + 4}
                  fill="transparent"
                />
                <ItemGlyphs
                  item={i}
                  selected={sel?.type === "item" && sel.id === i.id}
                />
              </g>
            ))}
            {/* қақпа (ағаштардың үстінен салынады) мен кіреберіс жолы */}
            <rect x={300} y={46} width={26} height={70} fill="url(#pave)" pointerEvents="none" />
            <rect x={296} y={58} width={34} height={8} fill="#e6dccb" pointerEvents="none" />
            {/* кабинеттер */}
            {placedRooms.map(({ room, spot, n }) => (
              <g
                key={room.id}
                className="cursor-pointer"
                onClick={(e) => {
                  if (mode !== "view") return;
                  e.stopPropagation();
                  setSel({ type: "room", id: room.id });
                }}
              >
                <rect
                  x={spot!.x - (roomNo(room, n).length > 1 ? 18 : 11)}
                  y={spot!.y - 11}
                  width={roomNo(room, n).length > 1 ? 36 : 22}
                  height={22}
                  rx={11}
                  fill={
                    sel?.type === "room" && sel.id === room.id
                      ? "#c2410c"
                      : "#1f4a2c"
                  }
                  stroke="#fff"
                  strokeWidth={2.5}
                />
                <text
                  x={spot!.x}
                  y={spot!.y + 4}
                  fontSize={11}
                  textAnchor="middle"
                  fill="#fff"
                  fontWeight={700}
                >
                  {roomNo(room, n)}
                </text>
              </g>
            ))}
            {/* компас */}
            <g transform="translate(446 574)">
              <circle r={22} fill="#fffbf2" stroke="#8b7a5c" />
              <path d="M0 -7 L4.5 5 L0 2 L-4.5 5 Z" fill="#c2410c" />
              <text
                x={0}
                y={-11}
                fontSize={10}
                textAnchor="middle"
                fill="#1c2a1f"
                fontWeight={700}
              >
                С
              </text>
              <text
                x={0}
                y={18}
                fontSize={9}
                textAnchor="middle"
                fill="#56634f"
              >
                О
              </text>
              <text
                x={15}
                y={3}
                fontSize={9}
                textAnchor="middle"
                fill="#56634f"
              >
                Ш
              </text>
              <text
                x={-15}
                y={3}
                fontSize={9}
                textAnchor="middle"
                fill="#56634f"
              >
                Б
              </text>
            </g>
            {/* масштаб */}
            <g transform="translate(14 578)">
              <path d="M0 0h40" stroke="#56634f" strokeWidth={2} />
              <path d="M0 -3v6M40 -3v6" stroke="#56634f" strokeWidth={2} />
              <text x={46} y={4} fontSize={9} fill="#56634f">
                ≈ 10 м
              </text>
            </g>
          </svg>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 px-2 pb-1 pt-2 text-xs text-muted">
            <li className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-[#3f7d3a]" />{" "}
              ағаш
            </li>
            <li className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#79a83f]" />{" "}
              бұта
            </li>
            <li className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#e11d48]" />{" "}
              гүлзар
            </li>
            <li className="flex items-center gap-1">
              <span className="inline-flex h-4 items-center justify-center rounded-full bg-forest px-1 text-[9px] font-bold text-white">
                118
              </span>{" "}
              кабинет (нөмірі)
            </li>
            <li className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full border border-dashed border-amber-600 bg-amber-50" />{" "}
              ағаш егуге болатын бос орын
            </li>
          </ul>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {selItem ? (
            <div className="card flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted">
                    {KIND_LABEL[selItem.kind]}
                  </p>
                  <h3 className="text-lg font-semibold">
                    {selItem.name} × {fmt(selItem.count)}
                  </h3>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1 text-muted hover:bg-mint"
                  aria-label="Жабу"
                  onClick={() => setSel(null)}
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
              <p className="text-sm">
                {selItem.plantedYear
                  ? `${selItem.plantedYear} жылы егілген (${new Date().getFullYear() - selItem.plantedYear} жыл). `
                  : ""}
                Күйі: <b>{CONDITION_YARD[selItem.condition]}</b>.
              </p>
              {selItem.kind === "tree" && (
                <p className="rounded-xl bg-sand-2/60 px-3 py-2 text-sm text-bark">
                  <b>Математика:</b> {fmt(selItem.count)} ағаш × ~
                  {TREE_CO2_KG_YEAR} кг ≈{" "}
                  {fmt(selItem.count * TREE_CO2_KG_YEAR)} кг CO₂ жылына сіңіреді
                  (болжам).
                </p>
              )}
              {factFor(selItem.name) && (
                <p className="flex items-start gap-2 text-sm">
                  <Info
                    size={16}
                    className="mt-0.5 shrink-0 text-forest"
                    aria-hidden
                  />
                  {factFor(selItem.name)!.text}
                </p>
              )}
              {selItem.notes && (
                <p className="text-sm text-ink/85">{selItem.notes}</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
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
                  onClick={guard(() => setMode("move"))}
                >
                  <Move size={15} aria-hidden /> Орнын ауыстыру
                </button>
                <button
                  type="button"
                  className="btn btn-ghost !min-h-10"
                  onClick={guard(() => setConfirm(true))}
                >
                  <Trash2 size={15} aria-hidden /> Өшіру
                </button>
              </div>
            </div>
          ) : selRoom ? (
            <div className="card flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold">{selRoom.name}</h3>
                <button
                  type="button"
                  className="rounded-lg p-1 text-muted hover:bg-mint"
                  aria-label="Жабу"
                  onClick={() => setSel(null)}
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
              <p className="text-sm text-muted">
                {spotById(selRoom.mapSpot)?.label}
              </p>
              <p className="text-sm">
                Гүл саны:{" "}
                <b>{selRoom.plants.reduce((a, p) => a + p.count, 0)}</b>
              </p>
              <a
                href={`#room-${selRoom.id}`}
                className="btn btn-ghost !min-h-10 self-start"
              >
                Кабинет картасына өту
              </a>
            </div>
          ) : selSpot ? (
            <div className="card flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold">Бос орын</h3>
                <button
                  type="button"
                  className="rounded-lg p-1 text-muted hover:bg-mint"
                  aria-label="Жабу"
                  onClick={() => setSel(null)}
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
              <p className="text-sm">{selSpot.label}.</p>
              <p className="text-sm text-muted">
                Қызылорда жағдайына лайық: қарағаш, жиде, ақ акация, тұт (ыстық
                пен тұзды топыраққа төзімді).
              </p>
            </div>
          ) : (
            <div className="card flex flex-col gap-2 p-4">
              <h3 className="flex items-center gap-2 font-semibold text-forest">
                <Trees size={18} aria-hidden /> Ауладағы ағаштар не береді?
              </h3>
              <p className="rounded-xl bg-sand-2/60 px-3 py-2 text-sm text-bark">
                <b>Математика (болжам):</b> {fmt(totals.trees)} ағаш × ~
                {TREE_CO2_KG_YEAR} кг ={" "}
                <b>{fmt(totals.co2Kg / 1000, 1)} т CO₂</b> жылына. Бір адам
                демімен жылына ~365 кг CO₂ шығарады, яғни ағаштар шамамен{" "}
                <b>{fmt(totals.people)} адамның</b> жылдық тынысын теңестіреді.
              </p>
              <p className="text-xs text-muted">
                Бір ағаш жылына 10–20 кг CO₂ сіңіреді деп алынды: нақты сан
                түріне, жасына және суаруға байланысты.
              </p>
            </div>
          )}

          <div className="card flex flex-col gap-2 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-forest">
              <Lightbulb size={18} aria-hidden /> Ұсыныстар
            </h3>
            {!hydrated || (sync.state === "loading" && !items.length) ? (
              <p className="text-sm text-muted">Жүктелуде…</p>
            ) : (
              <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto text-sm">
                {tips.map((t, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${t.tone === "warn" ? "bg-orange-50 text-orange-950" : t.tone === "good" ? "bg-amber-50/70" : "bg-sky-50 text-sky-950"}`}
                  >
                    {t.tone === "warn" ? (
                      <TriangleAlert
                        size={15}
                        className="mt-0.5 shrink-0"
                        aria-hidden
                      />
                    ) : (
                      <Lightbulb
                        size={15}
                        className="mt-0.5 shrink-0"
                        aria-hidden
                      />
                    )}
                    {t.text}
                  </li>
                ))}
              </ul>
            )}
            <AskAi
              label="ЖИ-ден аула бойынша кеңес алу"
              question="Мектеп ауласындағы ағаштар мен гүлдердің тізіміне қарап, 4–5 нақты ұсыныс бер: қай жерге қандай ағаш егу керек, қайсысын ауыстыру керек, күтім. Қызылорданың ыстық, құрғақ климатын және тұзды топырағын ескер. Есептеу болса, қадамын көрсет."
              context={`${yardContext(items)}\n\n${roomsContext(rooms, false)}`}
            />
          </div>
        </div>
      </div>

      {addAt && <YardForm open at={addAt} onClose={() => setAddAt(null)} />}
      {editOpen && selItem && (
        <YardForm open initial={selItem} onClose={() => setEditOpen(false)} />
      )}
      <Dialog
        open={confirm && !!selItem}
        onClose={() => setConfirm(false)}
        title="Өшіру"
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
                  selItem &&
                  (await feedback(
                    repositories.yard.remove(selItem.id),
                    "Өшірілді",
                  ))
                ) {
                  setConfirm(false);
                  setSel(null);
                }
              }}
            >
              Өшіру
            </button>
          </>
        }
      >
        <p>
          «{selItem?.name}» картадан өшіріледі. Бұл әрекетті қайтару мүмкін
          емес.
        </p>
      </Dialog>
    </section>
  );
}
