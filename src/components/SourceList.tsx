import { ExternalLink } from "lucide-react";
import { sourceById } from "@/data/sources";

/** Бөлім астындағы қысқа дереккөз тізімі */
export function SourceList({ ids, className = "" }: { ids: string[]; className?: string }) {
  const items = ids.map(sourceById).filter(Boolean);
  if (!items.length) return null;
  return (
    <div className={`text-xs text-muted ${className}`}>
      <span className="font-semibold">Дереккөз: </span>
      {items.map((s, i) => (
        <span key={s!.id}>
          {s!.url ? (
            <a href={s!.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-forest">
              {s!.publisher}: {s!.title.length > 60 ? s!.title.slice(0, 57) + "…" : s!.title}
              <ExternalLink size={11} aria-hidden />
            </a>
          ) : (
            `${s!.publisher}: ${s!.title}`
          )}
          {` (тексерілді ${s!.accessedAt})`}
          {i < items.length - 1 ? "; " : ""}
        </span>
      ))}
    </div>
  );
}

export function Pending({ text = "Мәлімет толықтырылуда" }: { text?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-sand bg-sand-2/60 px-4 py-3 text-sm text-bark">
      <strong>{text}.</strong> Тексерілген дереккөз табылғанда осы бөлімге қосылады.
    </div>
  );
}
