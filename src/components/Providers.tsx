"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { SaveResult } from "@/lib/storage/kv";
import { ComingSoonProvider } from "./ComingSoon";

export type DataMode = "demo" | "user";

const ModeCtx = createContext<{ mode: DataMode; setMode: (m: DataMode) => void }>({ mode: "demo", setMode: () => {} });

interface Toast {
  id: number;
  kind: "ok" | "error";
  text: string;
}
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});

export function Providers({ children }: { children: ReactNode }) {
  // Әдепкіде демо режимі — сайтты бірден көрсетуге болады. Режим сақталмайды: әр ашқанда демо.
  const [mode, setMode] = useState<DataMode>("demo");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 9000 : 3500);
  }, []);
  return (
    <ModeCtx.Provider value={{ mode, setMode }}>
      <ToastCtx.Provider value={toast}>
        <ComingSoonProvider>{children}</ComingSoonProvider>
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite" role="status">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex max-w-lg items-start gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-lift ${
                t.kind === "ok" ? "bg-forest text-white" : "bg-orange-50 text-orange-950 ring-1 ring-orange-300"
              }`}
            >
              {t.kind === "ok" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden /> : <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />}
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </ToastCtx.Provider>
    </ModeCtx.Provider>
  );
}

export const useDataMode = () => useContext(ModeCtx);
export const useToast = () => useContext(ToastCtx);

/** Сақтау нәтижесін хабарламаға айналдыру */
export function useSaveFeedback() {
  const toast = useToast();
  return useCallback(
    (res: SaveResult, okText: string) => {
      if (res.ok) toast("ok", okText);
      else toast("error", res.message);
      return res.ok;
    },
    [toast],
  );
}
