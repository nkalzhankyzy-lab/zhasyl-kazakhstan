"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/storage/hooks";
import type { SaveResult } from "@/lib/storage/kv";
import { LoginDialog } from "./auth/LoginDialog";
import { ComingSoonProvider } from "./ComingSoon";

export type DataMode = "demo" | "user";

const ModeCtx = createContext<{ mode: DataMode; setMode: (m: DataMode) => void }>({ mode: "user", setMode: () => {} });

interface Toast {
  id: number;
  kind: "ok" | "error";
  text: string;
}
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
/** Кіру терезесін ашу (себебімен) */
const LoginCtx = createContext<(reason?: string) => void>(() => {});

export function Providers({ children }: { children: ReactNode }) {
  // Демо режимі алынды: сайт тек мұғалім енгізген деректерді көрсетеді.
  const [mode, setMode] = useState<DataMode>("user");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [login, setLogin] = useState<{ reason?: string } | null>(null);
  const openLogin = useCallback((reason?: string) => setLogin({ reason }), []);
  const toast = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 9000 : 3500);
  }, []);
  return (
    <ModeCtx.Provider value={{ mode, setMode }}>
      <ToastCtx.Provider value={toast}>
        <LoginCtx.Provider value={openLogin}>
          <ComingSoonProvider>{children}</ComingSoonProvider>
          {login && <LoginDialog reason={login.reason} onClose={() => setLogin(null)} />}
        </LoginCtx.Provider>
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
export const useLogin = () => useContext(LoginCtx);

export const EDIT_LOGIN_REASON = "Деректі енгізу және өзгерту үшін мұғалім (редактор) аккаунтымен кіріңіз. Көру үшін кірудің қажеті жоқ.";

/**
 * Өзгерту әрекетін қорғау: рұқсат болса әрекет орындалады, болмаса кіру терезесі ашылады.
 * Нағыз шектеу дерекқорда (RLS) — бұл тек ыңғайлылық үшін.
 */
export function useEditGuard() {
  const { canEdit } = useAuth();
  const login = useLogin();
  return useCallback(
    <A extends unknown[]>(fn: (...args: A) => void) =>
      (...args: A) => {
        if (canEdit) fn(...args);
        else login(EDIT_LOGIN_REASON);
      },
    [canEdit, login],
  );
}

/** Сақтау нәтижесін хабарламаға айналдыру */
export function useSaveFeedback() {
  const toast = useToast();
  const login = useLogin();
  return useCallback(
    async (pending: SaveResult | Promise<SaveResult>, okText: string) => {
      const res = await pending;
      if (res.ok) toast("ok", okText);
      else if (res.reason === "forbidden") login(res.message);
      else toast("error", res.message);
      return res.ok;
    },
    [toast, login],
  );
}
