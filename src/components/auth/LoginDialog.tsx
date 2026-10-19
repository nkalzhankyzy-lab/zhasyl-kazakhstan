"use client";

import { LogIn, LogOut, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/storage/hooks";
import { signIn, signOut, signUp } from "@/lib/supabase/auth";
import { Dialog } from "../ui/Dialog";

export function LoginDialog({ reason, onClose }: { reason?: string; onClose: () => void }) {
  const auth = useAuth();
  const [tab, setTab] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError("Email мен құпиясөзді жазыңыз.");
      return;
    }
    if (tab === "up" && password.length < 8) {
      setError("Құпиясөз кемінде 8 таңбадан тұруы керек.");
      return;
    }
    setBusy(true);
    const res = tab === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (!res.ok) setError(res.message);
    else if (res.message) setInfo(res.message);
  };

  const signedIn = Boolean(auth.userId);

  return (
    <Dialog open onClose={onClose} title={signedIn ? "Аккаунт" : "Мұғалім ретінде кіру"} size="md">
      {reason && !auth.canEdit && <p className="mb-3 rounded-xl bg-mint px-3 py-2 text-sm text-forest">{reason}</p>}
      {!auth.ready ? (
        <p className="text-muted">Тексерілуде…</p>
      ) : signedIn ? (
        <div className="flex flex-col gap-3">
          <p>
            Сіз <strong>{auth.email}</strong> ретінде кірдіңіз.
          </p>
          {auth.canEdit ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">Деректі енгізуге және өзгертуге рұқсатыңыз бар.</p>
          ) : (
            <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-950" role="alert">
              Аккаунтыңыз редакторлар тізіміне әлі қосылмаған. Деректі көре аласыз, бірақ енгізу үшін платформа әкімшісі сізді тізімге қосуы керек.
            </p>
          )}
          {info && <p className="text-sm text-forest">{info}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Жабу
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
              <LogOut size={18} aria-hidden /> Шығу
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
          <div role="tablist" aria-label="Кіру түрі" className="grid grid-cols-2 gap-1 rounded-xl bg-sand-2 p-1">
            {(
              [
                ["in", "Кіру"],
                ["up", "Тіркелу"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => (setTab(k), setError(null), setInfo(null))}
                className={`min-h-10 rounded-lg text-sm font-semibold ${tab === k ? "bg-white text-forest shadow-sm" : "text-ink/70"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="login-email" className="field-label">
              Email
            </label>
            <input id="login-email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="login-password" className="field-label">
              Құпиясөз
            </label>
            <input
              id="login-password"
              type="password"
              className="input"
              autoComplete={tab === "in" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {tab === "up" && <p className="mt-1 text-xs text-muted">Кемінде 8 таңба. Тіркелген соң әкімші сізді редакторлар тізіміне қосады.</p>}
          </div>
          {error && (
            <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-950" role="alert">
              {error}
            </p>
          )}
          {info && <p className="rounded-xl bg-mint px-3 py-2 text-sm text-forest">{info}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {tab === "in" ? <LogIn size={18} aria-hidden /> : <UserPlus size={18} aria-hidden />}
            {busy ? "Күте тұрыңыз…" : tab === "in" ? "Кіру" : "Тіркелу"}
          </button>
          <p className="text-xs text-muted">Деректі көру үшін кірудің қажеті жоқ. Аккаунт тек мұғалімдерге деректі енгізу үшін керек.</p>
        </form>
      )}
    </Dialog>
  );
}
