import { BookOpen, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassroomMonitor } from "@/components/school/ClassroomMonitor";
import { ClassroomPhoto } from "@/components/school/ClassroomPhoto";
import { EcoPassport } from "@/components/school/EcoPassport";
import { SCHOOLS, schoolById } from "@/data/schools";

export function generateStaticParams() {
  return SCHOOLS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: schoolById(id)?.shortName ?? "Мектеп" };
}

export default async function SchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = schoolById(id);
  if (!school) notFound();
  const classroom = school.classrooms[0];
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <nav aria-label="Жол" className="text-sm text-muted">
        <Link href="/" className="hover:underline">Экокарта</Link> / <Link href="/schools" className="hover:underline">Мектептер</Link> / {school.shortName}
      </nav>
      <header className="mt-2">
        <p className="text-sm font-semibold text-muted">Мектеп экопаспорты · Қызылорда облысы</p>
        <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">{school.name}</h1>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
          <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden /> {school.location.note}
        </p>
      </header>
      <div className="mt-6">
        <EcoPassport />
      </div>
      <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <aside className="flex min-w-0 flex-col gap-3">
          <h2 className="font-serif text-2xl font-bold text-forest">{classroom.name}</h2>
          <ClassroomPhoto classroom={classroom} />
          <Link href="/journal" className="btn btn-soft">
            <BookOpen size={18} aria-hidden /> Зерттеу күнделігі
          </Link>
          <p className="text-sm text-muted">Температура мен ылғалдылық TA318 термогигрометрімен өлшеніп, қолмен енгізіледі. CO₂ өлшегіш әлі жоқ, сондықтан CO₂ экопаспортта бағаланады.</p>
        </aside>
        <div className="card p-4 sm:p-5">
          <ClassroomMonitor classroom={classroom} />
        </div>
      </div>
    </div>
  );
}
