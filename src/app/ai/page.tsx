import type { Metadata } from "next";
import { AiAssistant } from "@/components/ai/AiAssistant";

export const metadata: Metadata = { title: "ЖИ экокеңесші" };

export default function AiPage() {
  return <AiAssistant />;
}
