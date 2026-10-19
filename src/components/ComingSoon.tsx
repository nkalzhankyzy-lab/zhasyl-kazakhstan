"use client";

import { Hammer } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Badge } from "./ui/Badge";
import { Dialog } from "./ui/Dialog";

interface Info {
  title: string;
  text: string;
  badge?: "Әзірленуде" | "Келесі кезеңде қосылады";
}

const Ctx = createContext<(info: Info) => void>(() => {});

/** Әзір емес функцияны басқанда үнсіз қалмау үшін — түсіндірме панелі */
export function ComingSoonProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<Info | null>(null);
  const show = useCallback((i: Info) => setInfo(i), []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <Dialog
        open={!!info}
        onClose={() => setInfo(null)}
        title={info?.title ?? ""}
        footer={
          <button type="button" className="btn btn-primary" onClick={() => setInfo(null)}>
            Түсінікті
          </button>
        }
      >
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sand-2 text-bark">
            <Hammer size={22} aria-hidden />
          </div>
          <div>
            <Badge tone="dev">{info?.badge ?? "Әзірленуде"}</Badge>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">{info?.text}</p>
            <p className="mt-2 text-sm text-muted">Алғашқы нұсқада бұл әрекет әлі жұмыс істемейді. Платформаның құрылымы оны кейін қосуға дайын.</p>
          </div>
        </div>
      </Dialog>
    </Ctx.Provider>
  );
}

export const useComingSoon = () => useContext(Ctx);
