import { FeatureCard } from "@/components/FeatureCard";
import { HomeExplorer } from "@/components/HomeExplorer";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-6 pt-4 sm:px-6 sm:pt-6">
      <div className="relative mb-4 overflow-hidden sm:mb-5">
        <h1 className="font-serif text-[28px] font-bold leading-tight text-forest sm:text-4xl xl:text-[44px]">
          Топырақты зертте. Өсімдік өсір. Ортаңды жақсарт.
        </h1>
        <p className="mt-1 max-w-3xl text-[15px] text-muted sm:text-base">
          Қазақстан картасы арқылы туған өлкенің табиғатын зерттеп, мектептің нақты ортасын өлшеу арқылы экологиялық мәдениетті бірге қалыптастырайық.
        </p>
      </div>
      <HomeExplorer />
      <section aria-labelledby="features-title" className="mt-6">
        <h2 id="features-title" className="sr-only">
          Платформа бөлімдері
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <li>
            <FeatureCard href="/garden" title="Менің жасыл бағым" subtitle="Өсімдік таңдау және өсіру" image="/images/garden.png" alt="Ағаш жәшіктердегі көкөніс пен гүлдер өсетін күнді экологиялық бақ" badge="Әзірленуде" />
          </li>
          <li>
            <FeatureCard href="/lab" title="Био-химиялық зертхана" subtitle="Тәжірибелер мен өлшемдер" image="/images/laboratory.png" alt="Микроскоп, колбалар мен өсімдік үлгілері бар жарық зертхана" badge="Әзірленуде" />
          </li>
          <li>
            <FeatureCard href="/schools/kzo-23" title="Мектеп экопаспорты" subtitle="№23 мектеп-лицей, Қызылорда" image="/images/classroom.png" alt="Қабырғасында датчигі бар, өсімдіктер қойылған жарық биология кабинеті" />
          </li>
          <li>
            <FeatureCard href="/ai" title="ЖИ экокеңесші" subtitle="Сұрақ қойыңыз, деректі бірге талдаймыз" image="/images/ai-assistant.png" alt="Қолында көшеті бар мейірімді эко-робот" imageFit="contain" />
          </li>
        </ul>
      </section>
    </div>
  );
}
