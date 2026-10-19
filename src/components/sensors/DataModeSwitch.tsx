"use client";

import { useDataMode } from "../Providers";

export function DataModeSwitch() {
  const { mode, setMode } = useDataMode();
  const opts = [
    { key: "demo" as const, label: "Демо" },
    { key: "user" as const, label: "Мен енгізген өлшемдер" },
  ];
  return (
    <div role="radiogroup" aria-label="Дерек режимі" className="inline-flex rounded-2xl border border-line bg-white p-1 shadow-sm">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={mode === o.key}
          onClick={() => setMode(o.key)}
          className={`min-h-10 rounded-xl px-3.5 text-sm font-semibold transition ${
            mode === o.key ? (o.key === "demo" ? "bg-amber-200 text-amber-950" : "bg-forest text-white") : "text-ink/75 hover:bg-mint"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
