"use client";

import Image from "next/image";
import { useState } from "react";
import type { SoilDescription } from "@/lib/types";
import { Badge } from "../ui/Badge";
import { Dialog } from "../ui/Dialog";

export function SoilGallery({ types }: { types: SoilDescription["types"] }) {
  const [open, setOpen] = useState<SoilDescription["types"][number] | null>(null);
  return (
    <section aria-labelledby="soil-gallery-title">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="soil-gallery-title" className="font-serif text-lg font-bold text-forest">
          Топырақ үлгілері
        </h3>
        <Badge tone="illustration">Көрнекі иллюстрация</Badge>
      </div>
      <ul className="mt-2 grid grid-cols-3 gap-2">
        {types.map((t) => (
          <li key={t.key}>
            <button type="button" onClick={() => setOpen(t)} className="group block w-full overflow-hidden rounded-xl border border-line bg-white text-left shadow-sm hover:shadow-soft">
              <span className="relative block aspect-[4/3]">
                <Image src={t.image} alt={`${t.name} топырақтың көрнекі иллюстрациясы`} fill sizes="(max-width: 640px) 33vw, 160px" className="object-cover transition group-hover:scale-105" />
              </span>
              <span className="block px-2 py-1.5 text-center text-sm font-semibold text-ink">{t.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={!!open} onClose={() => setOpen(null)} title={open ? `${open.name} топырақ` : ""} size="lg">
        {open && (
          <div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
              <Image src={open.image} alt={`${open.name} топырақтың көрнекі иллюстрациясы`} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
              <Badge tone="illustration" className="absolute left-3 top-3">
                Көрнекі иллюстрация — нақты сынама фотосы емес
              </Badge>
            </div>
            <p className="mt-3 text-[15px]">{open.note}</p>
            <p className="mt-2 text-sm text-muted">
              Суреттен pH, тұздылық немесе қоректік заттар анықталмайды. Ол үшін өлшем құралдарымен жасалған зерттеу қажет.
            </p>
          </div>
        )}
      </Dialog>
    </section>
  );
}
