import type { Metadata } from "next";
import { DataManager } from "@/components/DataManager";

export const metadata: Metadata = { title: "Менің деректерім" };

export default function DataPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
      <h1 className="mb-4 font-serif text-3xl font-bold text-forest sm:text-4xl">Менің деректерім</h1>
      <DataManager />
    </div>
  );
}
