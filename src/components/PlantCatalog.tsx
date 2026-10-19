"use client";

import Image from "next/image";
import { useState } from "react";
import { PLANTS } from "@/data/plants";
import type { Plant } from "@/lib/types";
import { useComingSoon } from "./ComingSoon";
import { Pending, SourceList } from "./SourceList";
import { Badge } from "./ui/Badge";
import { Dialog } from "./ui/Dialog";

export function PlantCatalog({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState<Plant | null>(null);
  const comingSoon = useComingSoon();
  return (
    <section aria-labelledby="plants-title">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="plants-title" className="font-serif text-lg font-bold text-forest">
          Өсімдіктер каталогы
        </h3>
        <Badge tone="dev">Каталогтың бастапқы нұсқасы</Badge>
      </div>
      <ul className={`mt-2 grid grid-cols-3 gap-2 ${compact ? "" : "sm:gap-4"}`}>
        {PLANTS.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => setOpen(p)} className="group block w-full overflow-hidden rounded-xl border border-line bg-[#fdf8ee] text-left shadow-sm hover:shadow-soft">
              <span className={`relative block ${compact ? "aspect-[4/3]" : "aspect-square"}`}>
                <Image src={p.image} alt={`${p.nameKk} (${p.latin}) — иллюстрация`} fill sizes="(max-width: 640px) 33vw, 220px" className="object-contain p-1 transition group-hover:scale-105" />
              </span>
              <span className="block px-2 pb-2 text-center">
                <span className="block text-sm font-semibold text-ink">{p.nameKk}</span>
                {!compact && <span className="block text-xs italic text-muted">{p.latin}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">Бұл тізім облысқа жарамдылық ұсынысы емес. Әр аймаққа сәйкестігі бөлек тексеріледі.</p>
      <Dialog
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? open.nameKk : ""}
        size="lg"
        footer={
          <button
            type="button"
            className="btn btn-soft"
            onClick={() =>
              comingSoon({ title: "Виртуалды өсіру", text: "Өсімдікті таңдап, виртуалды бақта отырғызу және өсіру сценарийі келесі кезеңде қосылады.", badge: "Келесі кезеңде қосылады" })
            }
          >
            Виртуалды отырғызу
          </button>
        }
      >
        {open && (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#fdf8ee]">
              <Image src={open.image} alt={`${open.nameKk} (${open.latin}) — үлкен иллюстрация`} fill sizes="(max-width: 768px) 100vw, 420px" className="object-contain" />
            </div>
            <div>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="dev">Каталогтың бастапқы нұсқасы</Badge>
                <Badge tone="illustration">Иллюстрация</Badge>
              </div>
              <p className="mt-2 text-sm italic text-muted">{open.latin}</p>
              {open.paragraphs.length ? (
                <div className="mt-2 space-y-2 text-[15px] leading-relaxed">
                  {open.paragraphs.map((t) => (
                    <p key={t}>{t}</p>
                  ))}
                </div>
              ) : (
                <div className="mt-2">
                  <Pending />
                </div>
              )}
              <SourceList ids={open.sourceIds} className="mt-3" />
              <div className="mt-3 rounded-xl bg-mint px-3 py-2 text-sm text-forest">
                Кейін осы өсімдікті таңдап, виртуалды отырғызу және өсіру сценарийі қосылады. Облысқа жарамдылығы тексерілмей автоматты ұсынылмайды.
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}
