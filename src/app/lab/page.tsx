import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LabGuides } from "@/components/lab/LabGuides";
import { SoilCompare } from "@/components/lab/SoilCompare";
import { PreviewPage } from "@/components/PreviewPage";

export const metadata: Metadata = { title: "Био-химиялық зертхана" };

export default function LabPage() {
  return (
    <PreviewPage
      title="Био-химиялық зертхана"
      lead="Топырақ үлгісін зерттеудің қадамдық нұсқаулықтары, ылғалдылық калькуляторы және енгізілген үлгілерді салыстыру. Өлшемдерді «Зерттеу күнделігіне» енгізесіз, ал мұнда оларды қатар көресіз."
      image="/images/laboratory.png"
      alt="Микроскоп, колбалар және өсімдік үлгілері бар жарық био-химиялық зертхана"
      featuresTitle="Келесі кезеңде"
      features={[
        {
          title: "Виртуалды тәжірибе",
          text: "Реактивтер мен құралдарды қолданып, тәжірибені қауіпсіз виртуалды ортада қайталау.",
        },
      ]}
    >
      <section className="card mt-6 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-forest">
            Өлшемді енгізу
          </h2>
          <p className="text-muted">
            Топырақ үлгісі мен оның pH, ылғалдылық, ЭӨ мәндері зерттеу
            күнделігінде енгізіледі.
          </p>
        </div>
        <Link href="/journal" className="btn btn-primary">
          <FlaskConical size={18} aria-hidden /> Топырақ үлгісін енгізу
        </Link>
      </section>
      <LabGuides />
      <SoilCompare />
    </PreviewPage>
  );
}
