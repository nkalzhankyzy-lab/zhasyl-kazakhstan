import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { SOIL_SCHEME_DISCLAIMER } from "@/data/soil-scheme";
import { SOURCES } from "@/data/sources";

export const metadata: Metadata = { title: "Дереккөздер" };

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
      <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">Дереккөздер</h1>
      <p className="mt-1 text-muted">Платформада қолданылған географиялық және анықтамалық дереккөздер. Әр сілтеме көрсетілген күні ашылып, тексерілді.</p>
      <section className="card mt-5 p-5">
        <h2 className="font-serif text-xl font-bold text-forest">Маңызды ескертпелер</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px]">
          <li>Әкімшілік шекаралар мен топырақ белдеулері — екі бөлек қабат.</li>
          <li>{SOIL_SCHEME_DISCLAIMER}</li>
          <li>Тіркелген көркем суреттер (карта рельефі, топырақ, өсімдіктер, кабинет) — иллюстрация. Олар географиялық дерек ретінде қолданылмайды.</li>
          <li>Мектеп белгісі қала деңгейінде шамамен қойылған. Нақты координат тексерілгеннен кейін жаңартылады.</li>
          <li>Демо кабинет деректері — алдын ала дайындалған көрсетілім сценарийі, нақты зерттеу нәтижесі емес.</li>
          <li>Байқоңыр қаласы (жалға берілген аумақ) картада бөлек көрсетілмейді.</li>
        </ul>
      </section>
      <ol className="mt-5 flex flex-col gap-3">
        {SOURCES.map((s, i) => (
          <li key={s.id} className="card p-4">
            <p className="text-sm text-muted">
              [{i + 1}] {s.publisher}
            </p>
            <p className="font-semibold text-ink">{s.title}</p>
            {s.url && (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-sm text-forest underline underline-offset-2">
                {s.url} <ExternalLink size={13} aria-hidden />
              </a>
            )}
            <dl className="mt-1 grid gap-x-4 text-sm text-muted sm:grid-cols-2">
              <div>
                <dt className="inline">Тексерілді: </dt>
                <dd className="inline">{s.accessedAt}</dd>
              </div>
              {s.edition && (
                <div>
                  <dt className="inline">Нұсқа/мерзім: </dt>
                  <dd className="inline">{s.edition}</dd>
                </div>
              )}
              {s.license && (
                <div className="sm:col-span-2">
                  <dt className="inline">Лицензия: </dt>
                  <dd className="inline">{s.license}</dd>
                </div>
              )}
            </dl>
            {s.note && <p className="mt-1 text-sm">{s.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
