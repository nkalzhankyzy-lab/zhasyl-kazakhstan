import type { Metadata } from "next";
import { GardenTracker } from "@/components/garden/GardenTracker";
import { PlantCatalog } from "@/components/PlantCatalog";
import { PreviewPage } from "@/components/PreviewPage";

export const metadata: Metadata = { title: "Менің жасыл бағым" };

export default function GardenPage() {
  return (
    <PreviewPage
      title="Менің жасыл бағым"
      lead="Сыныптағы және үйдегі гүлдерді тіркеп, олардың қалай өсіп жатқанын бақылаңыз: суару, биіктік, жапырақ саны. Өлшемдер графикке түседі, ал өсім пайызбен есептеледі."
      image="/images/garden.png"
      alt="Ағаш жәшіктерде көкөніс пен гүлдер өсетін күнді экологиялық бақ"
      featuresTitle="Келесі кезеңде"
      features={[
        { title: "Аймақ бойынша өсімдік таңдау", text: "Әр облысқа жарамдылығы тексерілген өсімдіктер тізімі. Тексерілмеген ұсыныс автоматты түрде берілмейді." },
        { title: "Виртуалды отырғызу", text: "Таңдалған өсімдікті виртуалды бақ жәшігіне орналастыру және күтім жоспарын құру." },
      ]}
    >
      <GardenTracker />
      <section className="card mt-6 p-4 sm:p-6">
        <PlantCatalog />
      </section>
    </PreviewPage>
  );
}
