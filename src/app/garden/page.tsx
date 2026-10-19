import type { Metadata } from "next";
import { PlantCatalog } from "@/components/PlantCatalog";
import { PreviewPage } from "@/components/PreviewPage";

export const metadata: Metadata = { title: "Менің жасыл бағым" };

export default function GardenPage() {
  return (
    <PreviewPage
      title="Менің жасыл бағым"
      lead="Бұл бөлімде оқушы өз аймағына сай өсімдікті таңдап, виртуалды бақта отырғызады және оның өсуін бақылайды. Алғашқы нұсқада өсімдіктер каталогының бастапқы нұсқасы ғана дайын."
      image="/images/garden.png"
      alt="Ағаш жәшіктерде көкөніс пен гүлдер өсетін күнді экологиялық бақ"
      badge="Әзірленуде"
      features={[
        { title: "Аймақ бойынша өсімдік таңдау", text: "Әр облысқа жарамдылығы тексерілген өсімдіктер тізімі. Тексерілмеген ұсыныс автоматты түрде берілмейді." },
        { title: "Виртуалды отырғызу", text: "Таңдалған өсімдікті бақ жәшігіне орналастыру және күтім жоспарын құру." },
        { title: "Өсуді бақылау", text: "Суару, биіктік, жапырақ саны сияқты бақылауларды күнделікке жазу." },
      ]}
    >
      <section className="card mt-6 p-4 sm:p-6">
        <PlantCatalog />
      </section>
    </PreviewPage>
  );
}
