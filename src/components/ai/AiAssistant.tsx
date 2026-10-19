"use client";

import { Bot, Eraser, Send, Sparkles, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MAIN_CLASSROOM, MAIN_SCHOOL } from "@/data/schools";
import { useClassroomReadings } from "../sensors/useClassroomReadings";
import { useDataMode } from "../Providers";
import { Badge } from "../ui/Badge";
import { readingsContext } from "./readingsContext";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Кабинеттегі CO₂ графигін түсіндіріп берші",
  "Тақыр топырақ қалай пайда болады?",
  "Сынып бөлмесіне қандай гүл өсіруге болады?",
  "Ауа сапасы туралы зерттеу сұрағын құруға көмектес",
];

/** **қалың** және жол басындағы «- » тізімін ғана көрсететін қарапайым пішімдеу */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p.replace(/\*/g, "")}</Fragment>));
}
function Formatted({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) blocks.push(<ul key={blocks.length} className="my-1 list-disc space-y-1 pl-5">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>);
    list = [];
  };
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (m) list.push(m[1]);
    else {
      flush();
      if (line.trim()) blocks.push(<p key={blocks.length}>{inline(line.replace(/^#+\s*/, ""))}</p>);
    }
  }
  flush();
  return <div className="space-y-2">{blocks}</div>;
}

export function AiAssistant() {
  const { mode } = useDataMode();
  const { readings } = useClassroomReadings(MAIN_CLASSROOM.id, mode);
  const [useData, setUseData] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const context = useMemo(
    () => readingsContext(readings, `${MAIN_SCHOOL.shortName}, ${MAIN_CLASSROOM.name}`, mode === "demo"),
    [readings, mode],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context: useData ? context : "" }),
      });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!res.ok || !data.text) throw new Error(data.error || "ЖИ жауап бере алмады. Қайталап көріңіз.");
      setMessages([...next, { role: "assistant", content: data.text }]);
    } catch (e) {
      setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Желі қатесі. Интернетті тексеріп, қайталап көріңіз.");
      setMessages(messages);
      setInput(q);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[#fdf9f0]">
          <Image src="/images/ai-assistant.png" alt="Қолында көшеті бар эко-робот" fill sizes="96px" className="object-contain p-1" priority />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="font-serif text-3xl font-bold text-forest">ЖИ экокеңесші</h1>
          <p className="text-[16px] leading-relaxed text-ink/85">
            Топырақ, өсімдік, кабинет ауасы туралы сұрақ қойыңыз. Көмекші платформадағы деректерге сүйеніп, қазақ тілінде түсіндіреді. Ол ұсынады, ал қорытындыны өзіңіз жасайсыз.
          </p>
          <p className="flex items-start gap-1.5 text-sm text-muted">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-bark" aria-hidden />
            ЖИ қателесуі мүмкін. Маңызды мәліметті дереккөзден немесе мұғаліммен тексеріңіз. Жеке мәліметтеріңізді жазбаңыз.
          </p>
        </div>
      </section>

      <section className="card mt-4 flex min-h-[420px] flex-col p-0" aria-label="ЖИ-мен сұхбат">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-2 font-semibold text-forest">
                <Sparkles size={18} aria-hidden /> Мысалы, былай сұраңыз:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)} disabled={busy} className="rounded-full border border-mint-2 bg-mint px-3.5 py-2 text-left text-[15px] text-forest transition hover:bg-mint-2">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-forest px-4 py-2.5 text-[15px] leading-relaxed text-white">
                {m.content}
              </div>
            ) : (
              <div key={i} className="flex max-w-[92%] gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-2 text-forest">
                  <Bot size={18} aria-hidden />
                </div>
                <div className="rounded-2xl rounded-tl-md border border-line bg-paper px-4 py-3 text-[15px] leading-relaxed text-ink">
                  <Formatted text={m.content} />
                </div>
              </div>
            ),
          )}
          {busy && (
            <div className="flex items-center gap-3 text-muted">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-2 text-forest">
                <Bot size={18} aria-hidden />
              </div>
              <span className="animate-pulse">Ойланып жатыр…</span>
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-2.5 text-[15px] text-orange-900">
              {error}
            </p>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="border-t border-line p-3 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <div className="flex items-end gap-2">
            <label htmlFor="ai-input" className="sr-only">Сұрағыңыз</label>
            <textarea
              id="ai-input"
              rows={2}
              maxLength={2000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder="Сұрағыңызды жазыңыз…"
              className="min-h-[52px] flex-1 resize-y rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-leaf focus:ring-2 focus:ring-mint-2"
            />
            <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary h-[52px] px-4" aria-label="Жіберу">
              <Send size={18} aria-hidden />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useData} onChange={(e) => setUseData(e.target.checked)} className="h-4 w-4 accent-[var(--color-forest)]" />
              Кабинет өлшемдерін ЖИ-ге көрсету
              <Badge tone={mode === "demo" ? "demo" : "user"}>{mode === "demo" ? "демо дерек" : "нақты дерек"}</Badge>
            </label>
            {messages.length > 0 && (
              <button type="button" onClick={() => { setMessages([]); setError(null); }} className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-mint">
                <Eraser size={15} aria-hidden /> Жаңа сұхбат
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
