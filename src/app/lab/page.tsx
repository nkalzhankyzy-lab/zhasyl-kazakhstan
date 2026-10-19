import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PreviewPage } from "@/components/PreviewPage";

export const metadata: Metadata = { title: "Био-химиялық зертхана" };

export default function LabPage() {
  return (
    <PreviewPage
      title="Био-химиялық зертхана"
      lead="Толық виртуалды зертхана келесі кезеңде қосылады. Қазірдің өзінде нақты топырақ үлгісінің pH, ылғалдылық және электрөткізгіштік өлшемдерін енгізіп, зерттеу күнделігіне сақтауға болады."
      image="/images/laboratory.png"
      alt="Микроскоп, колбалар және өсімдік үлгілері бар жарық био-химиялық зертхана"
      badge="Әзірленуде"
      features={[
        { title: "Тәжірибе нұсқаулықтары", text: "Топырақ pH-ын, тұздылығын, ылғалдылығын өлшеудің қадамдық әдістемесі." },
        { title: "Виртуалды тәжірибе", text: "Реактивтер мен құралдарды қолданып, тәжірибені қауіпсіз ортада қайталау." },
        { title: "Нәтижелерді салыстыру", text: "Әр түрлі үлгілердің өлшемдерін кесте мен графикте салыстыру." },
      ]}
    >
      <section className="card mt-6 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-forest">Қазір жұмыс істейтін бөлік</h2>
          <p className="text-muted">Топырақ үлгісінің өлшемдерін енгізу — зерттеу күнделігінде.</p>
        </div>
        <Link href="/journal" className="btn btn-primary">
          <FlaskConical size={18} aria-hidden /> Топырақ үлгісін енгізу
        </Link>
      </section>
    </PreviewPage>
  );
}
