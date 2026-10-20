"use client";

import { Bot, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Formatted } from "./AiAssistant";

/** Бір сұрақты ЖИ-ге жіберіп, жауабын сол жерде көрсететін батырма */
export function AskAi({
  label,
  question,
  context,
}: {
  label: string;
  question: string;
  context: string;
}) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
          context,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        text?: string;
        error?: string;
      };
      if (!res.ok || !data.text)
        throw new Error(
          data.error || "ЖИ жауап бере алмады. Қайталап көріңіз.",
        );
      setText(data.text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="btn btn-ghost !min-h-10 self-start"
        onClick={() => void ask()}
        disabled={busy}
        aria-busy={busy}
      >
        {text ? (
          <RefreshCw size={16} aria-hidden />
        ) : (
          <Bot size={16} aria-hidden />
        )}{" "}
        {busy ? "ЖИ ойланып жатыр…" : text ? "ЖИ-ден қайта сұрау" : label}
      </button>
      {error && (
        <p
          className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-950"
          role="alert"
        >
          {error}
        </p>
      )}
      {text && (
        <div
          className="rounded-xl border border-mint-2 bg-mint/50 px-3 py-2 text-[15px]"
          aria-live="polite"
        >
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-forest">
            <Bot size={14} aria-hidden /> ЖИ кеңесі (тексеріп қолданыңыз)
          </p>
          <Formatted text={text} />
        </div>
      )}
    </div>
  );
}
