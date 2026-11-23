import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckPage } from "@/components/check/CheckPage";

export const metadata: Metadata = { title: "Өз бөлмеңді тексер · Проверь свою комнату" };

export default function Page() {
  return (
    <Suspense>
      <CheckPage />
    </Suspense>
  );
}
