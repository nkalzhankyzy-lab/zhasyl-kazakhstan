"use client";

import { useState } from "react";
import { changePassword } from "@/lib/supabase/auth";
import { Dialog } from "./ui/Dialog";

/** Кірген мұғалімнің құпиясөзін өзгерту терезесі */
export function ChangePassword({ onClose }: { onClose: () => void }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function save() {
    if (a.length < 6) return setMsg({ ok: false, text: "Құпиясөз кемінде 6 таңба болсын." });
    if (a !== b) return setMsg({ ok: false, text: "Екі құпиясөз бірдей емес." });
    setBusy(true);
    const r = await changePassword(a);
    setBusy(false);
    setMsg({ ok: r.ok, text: r.message ?? "" });
    if (r.ok) {
      setA("");
      setB("");
    }
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title="Құпиясөзді өзгерту"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Жабу
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()}>
            Сақтау
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <label className="text-xs text-muted">
          Жаңа құпиясөз
          <input type="password" autoComplete="new-password" className="input mt-1 !min-h-10" value={a} onChange={(e) => setA(e.target.value)} />
        </label>
        <label className="text-xs text-muted">
          Жаңа құпиясөзді қайталаңыз
          <input type="password" autoComplete="new-password" className="input mt-1 !min-h-10" value={b} onChange={(e) => setB(e.target.value)} />
        </label>
        {msg && (
          <p className={`text-sm ${msg.ok ? "text-forest" : "text-alert"}`} role="alert">
            {msg.text}
          </p>
        )}
      </div>
    </Dialog>
  );
}
