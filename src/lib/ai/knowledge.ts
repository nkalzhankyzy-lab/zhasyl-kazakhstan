import { PLANTS } from "@/data/plants";
import { KYZYLORDA_ID, regionById } from "@/data/regions";
import { SOIL_SYMBOLS, SOIL_ZONES } from "@/data/soil-scheme";
import { METRICS } from "@/lib/metrics";
import { researchContext } from "@/data/research";
import type { InfoSection } from "@/lib/types";

const section = (title: string, s?: InfoSection) =>
  s ? `${title}:\n${s.paragraphs.join(" ")}${s.facts?.length ? "\n" + s.facts.map((f) => `- ${f.label}: ${f.value}`).join("\n") : ""}` : "";

/** Платформадағы тексерілген мәліметтер — ЖИ осыған сүйеніп жауап береді. */
export function platformKnowledge(): string {
  const k = regionById(KYZYLORDA_ID);
  const parts = [
    "ПЛАТФОРМА: «Жасыл Қазақстан» — қазақ тіліндегі экологиялық білім беру ортасы. Бөлімдері: Экокарта (облыстар, топырақ белдеулері), Менің бағым (өсімдіктер), Зертхана (топырақ үлгілері: pH, ылғалдылық, EC), Мектептер (кабинет мониторингі: CO₂, температура, ылғалдылық, PM2.5), Зерттеу күнделігі (сұрақ, болжам, бақылау, қорытынды), ЖИ көмекші.",
    "ТОПЫРАҚ БЕЛДЕУЛЕРІ (шартты оқу схемасы): " + SOIL_ZONES.map((z) => z.name).join("; ") + ". Ерекше белгілер: " + SOIL_SYMBOLS.map((s) => s.name).join("; ") + ".",
    k ? [section("ҚЫЗЫЛОРДА ОБЛЫСЫ", k.summary), k.soil ? "Топырағы: " + k.soil.paragraphs.join(" ") + " Түрлері: " + k.soil.types.map((t) => `${t.name} — ${t.note}`).join("; ") : "", section("Климаты", k.climate), section("Су ресурстары", k.water), section("Өсімдіктері", k.plants)].filter(Boolean).join("\n") : "",
    "ӨСІМДІКТЕР КАТАЛОГЫ:\n" + PLANTS.map((p) => `- ${p.nameKk} (${p.latin}): ${p.paragraphs.join(" ")}`).join("\n"),
    "КАБИНЕТ КӨРСЕТКІШТЕРІ: " + METRICS.map((m) => `${m.label} (${m.unit})`).join(", ") + ". CO₂ — бөлменің қаншалықты желдетілгенін көрсететін жанама көрсеткіш; ол оттегінің мөлшерін тікелей көрсетпейді. Әдетте сыртқы ауада шамамен 420 ppm; 1000 ppm-нен асса, желдету керек деп есептеледі (бұл нормативтік шек емес, жалпы бағдар). Бөлме гүлдері CO₂-ні аз ғана азайтады, негізгі әсер — желдету.",
    researchContext(),
  ];
  return parts.filter(Boolean).join("\n\n");
}
