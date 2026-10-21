"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { useCollection, useHydrated } from "@/lib/storage/hooks";
import { newId, repositories } from "@/lib/storage/repositories";
import { getSupabase, SUPABASE_ENABLED } from "@/lib/supabase/client";
import { todayLocalDate } from "@/lib/time";
import type { SurveyResponse } from "@/lib/types";
import { FACES, QUESTIONS, type SurveyKey } from "./surveyMath";

/** Оқушыға арналған атсыз сауалнама: QR-код арқылы телефоннан ашылады */
export function SurveyForm({ roomId }: { roomId?: string }) {
  const hydrated = useHydrated();
  const rooms = useCollection(repositories.rooms).filter((r) => r.status === "user");
  const [room, setRoom] = useState(roomId ?? "");
  const [cls, setCls] = useState("");
  const [ans, setAns] = useState<Partial<Record<SurveyKey, number>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);
  const roomObj = rooms.find((r) => r.id === room);
  const complete = QUESTIONS.every((q) => ans[q.key]);

  async function send() {
    setErr(null);
    if (!room) return setErr("Кабинетті таңдаңыз");
    if (!cls.trim()) return setErr("Сыныбыңызды жазыңыз");
    if (!complete) return setErr("Барлық сұраққа жауап беріңіз");
    setState("sending");
    try {
      if (SUPABASE_ENABLED) {
        const sb = getSupabase();
        const { error } = await sb!.rpc("zk_submit_survey", {
          p_room: room,
          p_class: cls.trim(),
          p_air: ans.air,
          p_energy: ans.energy,
          p_head: ans.head,
          p_dry: ans.dry,
          p_mood: ans.mood,
        });
        if (error) throw new Error(error.message);
      } else {
        const now = new Date().toISOString();
        const r: SurveyResponse = {
          id: newId("survey"),
          status: "user",
          roomId: room,
          className: cls.trim(),
          date: todayLocalDate(),
          air: ans.air!,
          energy: ans.energy!,
          head: ans.head!,
          dry: ans.dry!,
          mood: ans.mood!,
          createdAt: now,
          updatedAt: now,
        };
        const res = await repositories.survey.upsert(r);
        if (!res.ok) throw new Error(res.message);
      }
      setState("done");
    } catch (e) {
      setState("idle");
      setErr(`Жіберілмеді. Интернетті тексеріп, қайталап көріңіз. (${(e as Error).message})`);
    }
  }

  if (state === "done")
    return (
      <div className="card flex flex-col items-center gap-3 p-6 text-center">
        <CheckCircle2 size={48} className="text-leaf" aria-hidden />
        <p className="font-serif text-2xl font-bold text-forest">Рақмет! Жауабыңыз жіберілді.</p>
        <p className="text-muted">Сіздің атыңыз жазылмайды. Жауаптар кабинеттердің жалпы нәтижесіне қосылады.</p>
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => {
            setAns({});
            setState("idle");
          }}
        >
          Келесі оқушы жауап береді
        </button>
      </div>
    );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
      noValidate
    >
      <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Кабинет
          {roomId && roomObj ? (
            <p className="mt-1 text-lg text-forest">{roomObj.name}</p>
          ) : (
            <select className="input mt-1" value={room} onChange={(e) => setRoom(e.target.value)} disabled={!hydrated}>
              <option value="">— таңдаңыз —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="text-sm font-semibold">
          Сыныбың
          <input className="input mt-1" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="мыс. 8 «А»" maxLength={20} list="survey-classes" />
          <datalist id="survey-classes">
            {["8 «А»", "8 «Б»", "7 «А»", "9 «А»"].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
      </div>

      {QUESTIONS.map((q, qi) => (
        <fieldset key={q.key} className="card p-4">
          <legend className="sr-only">{q.text}</legend>
          <p className="font-semibold" aria-hidden>
            {qi + 1}. {q.text}
          </p>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {FACES.map((f, i) => {
              const v = i + 1;
              const on = ans[q.key] === v;
              return (
                <label
                  key={v}
                  className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-xl border py-2 text-2xl transition ${on ? "border-forest bg-mint ring-2 ring-forest" : "border-line bg-white hover:bg-mint/60"}`}
                >
                  <input type="radio" name={q.key} value={v} className="sr-only" checked={on} onChange={() => setAns((a) => ({ ...a, [q.key]: v }))} />
                  <span aria-hidden>{f}</span>
                  <span className="text-xs font-semibold text-muted">{v}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>1 — {q.low}</span>
            <span className="text-right">5 — {q.high}</span>
          </div>
        </fieldset>
      ))}

      {err && (
        <p className="text-sm text-alert" role="alert">
          {err}
        </p>
      )}
      <button type="submit" className="btn btn-primary self-start" disabled={state === "sending"}>
        <Send size={18} aria-hidden /> {state === "sending" ? "Жіберілуде…" : "Жіберу"}
      </button>
    </form>
  );
}
