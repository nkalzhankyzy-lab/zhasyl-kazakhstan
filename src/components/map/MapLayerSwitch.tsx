"use client";

import { Droplets, FileSearch, Layers, School, Sprout } from "lucide-react";

export type MapLayer = "soil" | "plants" | "water" | "schools" | "research";

export const LAYERS: { key: MapLayer; label: string; icon: typeof Layers }[] = [
  { key: "soil", label: "Топырақ", icon: Layers },
  { key: "plants", label: "Өсімдіктер", icon: Sprout },
  { key: "water", label: "Су", icon: Droplets },
  { key: "schools", label: "Мектептер", icon: School },
  { key: "research", label: "Зерттеулер", icon: FileSearch },
];

export function MapLayerSwitch({ value, onChange }: { value: MapLayer; onChange: (l: MapLayer) => void }) {
  return (
    <div role="radiogroup" aria-label="Карта қабаты" className="flex max-w-full flex-wrap gap-1 rounded-2xl border border-line bg-paper/95 p-1 shadow-soft backdrop-blur">
      {LAYERS.map(({ key, label, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition ${
              active ? "bg-forest text-white shadow" : "text-ink/80 hover:bg-mint"
            }`}
          >
            <Icon size={16} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
