import type { ReactNode } from "react";

type Tone = "demo" | "user" | "dev" | "info" | "illustration" | "neutral" | "warn";

const TONES: Record<Tone, string> = {
  demo: "bg-amber-100 text-amber-900 border-amber-300",
  user: "bg-emerald-50 text-emerald-900 border-emerald-300",
  dev: "bg-sand-2 text-bark border-sand",
  info: "bg-sky-50 text-sky-900 border-sky-200",
  illustration: "bg-white/90 text-muted border-line",
  neutral: "bg-mint text-forest border-mint-2",
  warn: "bg-orange-50 text-orange-900 border-orange-300",
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5 ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** Демо деректің үнемі көрінетін белгісі */
export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <Badge tone="demo" className={className}>
      ДЕМО — нақты өлшем емес
    </Badge>
  );
}
