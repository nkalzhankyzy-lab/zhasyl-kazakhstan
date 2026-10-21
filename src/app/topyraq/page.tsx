import type { Metadata } from "next";
import { KyzylordaSoils } from "@/components/soil/KyzylordaSoils";
import { kyzylordaGeo } from "@/lib/geoKyzylorda";

export const metadata: Metadata = { title: "Қызылорда топырағы" };

export default function TopyraqPage() {
  const geo = kyzylordaGeo();
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">Қызылорда топырағы: жер-жерде қандай?</h1>
      <p className="mt-1 max-w-3xl text-muted">
        Картадағы нүктені таңдаңыз: топырақ кесіндісі, тұздылығы, pH мен грунт суы сол жерге қарай өзгереді. Арал маңы мен Сырдария атырауы неге сортаң, ал Қызылқұм неге тұзсыз екенін салыстырыңыз.
      </p>
      <div className="mt-5">
        <KyzylordaSoils geo={geo} />
      </div>
    </div>
  );
}
