import type { Metadata } from "next";
import Link from "next/link";
import { RoomCheck } from "@/components/check/RoomCheck";

export const metadata: Metadata = { title: "Өз бөлмеңді тексер" };

export default function CheckPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <p className="text-sm font-semibold text-muted">QR-код арқылы ашылатын бет</p>
      <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">Өз бөлмеңді тексер</h1>
      <p className="mt-1 max-w-3xl text-[17px] text-ink/85">
        Сынып, зал немесе үй бөлмесінің өлшемін және ондағы адам санын енгізіңіз. Сайт CO₂ қаншалықты тез жиналатынын бағалап, ЖИ кеңес береді. Есептеу әдістері мен әлемдік зерттеулер{" "}
        <Link href="/lab#research" className="font-semibold text-forest underline underline-offset-2">
          Зертхана
        </Link>{" "}
        бетінде.
      </p>
      <div className="mt-5">
        <RoomCheck qrSrc="/images/qr-tekser.svg" />
      </div>
    </div>
  );
}
