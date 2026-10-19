import { formatValue, metricMeta } from "@/lib/metrics";
import { formatDateTime } from "@/lib/time";
import type { MetricKey } from "@/lib/types";

interface Props {
  metric: MetricKey;
  latest: { value: number; timestamp: string } | null;
  active?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

/** Бір көрсеткіштің соңғы мәні. Түспен «қауіпсіз/қауіпті» деп жіктелмейді. */
export function SensorCard({ metric, latest, active, onClick, compact }: Props) {
  const m = metricMeta(metric);
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick, "aria-pressed": active } : {})}
      className={`flex w-full flex-col rounded-2xl border px-3 py-2.5 text-left transition ${
        active ? "border-forest bg-mint shadow-sm" : "border-line bg-white"
      } ${onClick ? "hover:bg-mint/70" : ""}`}
    >
      <span className="text-sm font-semibold text-muted">{m.label}</span>
      {latest ? (
        <>
          <span className={`font-bold text-ink ${compact ? "text-xl" : "text-2xl"}`}>
            {formatValue(latest.value, metric)} <span className="text-sm font-semibold text-muted">{m.unit}</span>
          </span>
          <span className="text-xs text-muted">{formatDateTime(latest.timestamp)}</span>
        </>
      ) : (
        <span className="mt-1 text-sm text-muted">Өлшем енгізілмеген</span>
      )}
    </Tag>
  );
}
