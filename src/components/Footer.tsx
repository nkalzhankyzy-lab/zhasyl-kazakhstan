import Link from "next/link";
import { STORAGE_WHERE } from "@/lib/supabase/client";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-line bg-sand-2/50">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-6 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>
          <strong className="text-forest">Жасыл Қазақстан</strong> — экологиялық білім беру платформасының алғашқы нұсқасы. Деректер {STORAGE_WHERE} сақталады.
        </p>
        <nav aria-label="Төменгі мәзір" className="flex flex-wrap gap-x-4 gap-y-1">
          <Link className="underline-offset-4 hover:underline" href="/sources">
            Дереккөздер
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/data">
            Менің деректерім
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/journal">
            Зерттеу күнделігі
          </Link>
          <a className="underline-offset-4 hover:underline" href="https://www.amcharts.com/" target="_blank" rel="noopener noreferrer">
            Карта геометриясы: amCharts
          </a>
        </nav>
      </div>
    </footer>
  );
}
