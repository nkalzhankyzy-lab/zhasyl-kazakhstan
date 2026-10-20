import type { Metadata } from "next";
import { GardenTracker } from "@/components/garden/GardenTracker";
import { RoomsSection } from "@/components/garden/RoomsSection";
import { PlantCatalog } from "@/components/PlantCatalog";
import { PreviewPage } from "@/components/PreviewPage";

export const metadata: Metadata = { title: "Менің жасыл бағым" };

export default function GardenPage() {
  return (
    <PreviewPage
      title="Менің жасыл бағым"
      lead="Мектеп кабинеттерін және ондағы гүлдерді тіркеп, салыстырыңыз: көлемі, терезе бағыты, гүл саны. Әр гүлдің өсуін бақылаңыз: суару, биіктік, жапырақ саны."
      image="/images/garden.png"
      alt="Ағаш жәшіктерде көкөніс пен гүлдер өсетін күнді экологиялық бақ"
      featuresTitle="Келесі кезеңде"
      features={[
        { title: "Аймақ бойынша өсімдік таңдау", text: "Әр облысқа жарамдылығы тексерілген өсімдіктер тізімі. Тексерілмеген ұсыныс автоматты түрде берілмейді." },
        { title: "Виртуалды отырғызу", text: "Таңдалған өсімдікті виртуалды бақ жәшігіне орналастыру және күтім жоспарын құру." },
      ]}
    >
      <RoomsSection />
      <GardenTracker />
      <section className="card mt-6 p-4 sm:p-6">
        <PlantCatalog />
      </section>
    </PreviewPage>
  );
}
