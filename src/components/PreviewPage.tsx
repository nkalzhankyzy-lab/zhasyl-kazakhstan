"use client";

import { Lock } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { useComingSoon } from "./ComingSoon";
import { Badge } from "./ui/Badge";

export interface PlannedFeature {
  title: string;
  text: string;
}

interface Props {
  title: string;
  lead: string;
  image: string;
  alt: string;
  /** Бет толық жұмыс істесе — берілмейді */
  badge?: "Әзірленуде" | "Келесі кезеңде қосылады";
  featuresTitle?: string;
  features: PlannedFeature[];
  imageFit?: "cover" | "contain";
  children?: ReactNode;
}

/** Әзір емес бөлімнің сапалы бастапқы беті: не болатынын түсіндіреді, жұмыс істеп тұрғандай көрсетпейді */
export function PreviewPage({
  title,
  lead,
  image,
  alt,
  badge,
  features,
  featuresTitle = "Жоспарланған мүмкіндіктер",
  imageFit = "cover",
  children,
}: Props) {
  const featureBadge = badge ?? "Келесі кезеңде қосылады";
  const comingSoon = useComingSoon();
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <section className="card grid overflow-hidden md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex flex-col justify-center gap-3 p-5 sm:p-8">
          {badge && (
            <Badge tone="dev" className="self-start text-sm">
              {badge}
            </Badge>
          )}
          <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">
            {title}
          </h1>
          <p className="text-[17px] leading-relaxed text-ink/85">{lead}</p>
        </div>
        <div
          className={`relative min-h-64 md:min-h-[360px] ${imageFit === "contain" ? "bg-[#fdf9f0]" : ""}`}
        >
          <Image
            src={image}
            alt={alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 560px"
            className={
              imageFit === "contain" ? "object-contain p-4" : "object-cover"
            }
          />
        </div>
      </section>
      {children}
      {features.length > 0 && (
        <section aria-labelledby="planned-title" className="mt-8">
          <h2
            id="planned-title"
            className="font-serif text-2xl font-bold text-forest"
          >
            {featuresTitle}
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li key={f.title}>
                <button
                  type="button"
                  onClick={() =>
                    comingSoon({
                      title: f.title,
                      text: f.text,
                      badge: featureBadge,
                    })
                  }
                  className="flex h-full w-full flex-col gap-1.5 rounded-2xl border border-line bg-paper p-4 text-left shadow-sm transition hover:bg-mint/60"
                >
                  <span className="flex items-center gap-2 font-semibold text-ink">
                    <Lock size={16} className="text-bark" aria-hidden />{" "}
                    {f.title}
                  </span>
                  <span className="text-sm text-muted">{f.text}</span>
                  <Badge tone="dev" className="mt-auto self-start">
                    {featureBadge}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
