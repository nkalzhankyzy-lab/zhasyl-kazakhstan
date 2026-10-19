import { ArrowRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SCHOOLS } from "@/data/schools";

export const metadata: Metadata = { title: "Мектептер" };

export default function SchoolsPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">Мектептер</h1>
      <p className="mt-1 max-w-3xl text-muted">
        Мектептің экопаспорты: кабинет ортасының өлшемдері, графиктер және зерттеу күнделігі. Алғашқы нұсқада бір мектеп қосылған; мектептер арасындағы ортақ дерек кейінгі кезеңде қосылады.
      </p>
      <ul className="mt-5 grid gap-4 md:grid-cols-2">
        {SCHOOLS.map((s) => (
          <li key={s.id}>
            <Link href={`/schools/${s.id}`} className="card group flex h-full flex-col overflow-hidden hover:shadow-lift">
              <div className="relative aspect-[16/8]">
                <Image src={s.classrooms[0].image} alt={`${s.classrooms[0].name} — иллюстрация`} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <h2 className="font-serif text-xl font-bold text-forest">{s.name}</h2>
                <p className="flex items-center gap-1 text-sm text-muted">
                  <MapPin size={14} aria-hidden /> {s.city} · орналасуы шамамен, нақтыланады
                </p>
                <span className="mt-2 inline-flex items-center gap-1 font-semibold text-forest">
                  Экопаспортты ашу <ArrowRight size={16} aria-hidden />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
