import type { WindowDir } from "@/lib/types";

/** Жарық деңгейі: көлеңке (солтүстік), жартылай (шығыс), жарық күн (оңтүстік, батыс) */
export type Light = "shade" | "partial" | "bright";

export interface IndoorPlant {
  id: string;
  name: string;
  latin: string;
  /** Қолайлы жарық деңгейлері */
  light: Light[];
  care: string;
}

// Бөлме гүлдерінің қысқа анықтамалығы: жарыққа қойылатын талап — жалпы бағбандық ұсыныстар бойынша.
export const INDOOR_PLANTS: IndoorPlant[] = [
  { id: "chlorophytum", name: "Хлорофитум", latin: "Chlorophytum comosum", light: ["partial", "bright"], care: "Күтімі оңай, жиі суаруды ұнатады. Тікелей ыстық күнде жапырақ ұшы қурайды." },
  { id: "sansevieria", name: "Сансевиерия", latin: "Dracaena trifasciata", light: ["shade", "partial", "bright"], care: "Өте төзімді, сирек суарылады. Көлеңкеде де өседі." },
  { id: "zamioculcas", name: "Замиокулькас (доллар ағашы)", latin: "Zamioculcas zamiifolia", light: ["shade", "partial"], care: "Көлеңкеге төзімді, артық суаруды көтермейді." },
  { id: "spathiphyllum", name: "Спатифиллум (әйел бақыты)", latin: "Spathiphyllum", light: ["shade", "partial"], care: "Ылғалды ұнатады, тікелей күннен қорғау керек." },
  { id: "epipremnum", name: "Эпипремнум (сциндапсус)", latin: "Epipremnum aureum", light: ["shade", "partial"], care: "Шырмалғыш, көлеңкеге төзімді, тез өседі." },
  { id: "aloe", name: "Алоэ", latin: "Aloe vera", light: ["bright"], care: "Күн сүйгіш суккулент, сирек суарылады." },
  { id: "cactus", name: "Кактус", latin: "Cactaceae", light: ["bright"], care: "Ең жарық терезеге қойылады, қыста өте сирек суарылады." },
  { id: "pelargonium", name: "Пеларгония (герань)", latin: "Pelargonium", light: ["bright"], care: "Күн сүйгіш, жарық жетпесе созылып, гүлдемейді." },
  { id: "kalanchoe", name: "Каланхоэ", latin: "Kalanchoe", light: ["bright"], care: "Жарық сүйгіш суккулент." },
  { id: "ficus", name: "Фикус Бенджамин", latin: "Ficus benjamina", light: ["partial", "bright"], care: "Орнын ауыстыруды ұнатпайды, жарық, бірақ шашыраңқы жарық керек." },
  { id: "monstera", name: "Монстера", latin: "Monstera deliciosa", light: ["partial"], care: "Шашыраңқы жарық, жапырағын сүртіп тұру керек." },
  { id: "dracaena", name: "Драцена", latin: "Dracaena", light: ["partial", "bright"], care: "Төзімді, қыста суаруды азайту керек." },
  { id: "tradescantia", name: "Традесканция", latin: "Tradescantia", light: ["partial", "bright"], care: "Тез өседі, қалемшеден оңай көбейеді." },
  { id: "begonia", name: "Бегония", latin: "Begonia", light: ["partial"], care: "Шашыраңқы жарық, жапыраққа су тигізбеу керек." },
  { id: "saintpaulia", name: "Фиалка (сенполия)", latin: "Saintpaulia", light: ["partial"], care: "Тікелей күн тиіп кетсе, жапырағы күйеді." },
  { id: "nephrolepis", name: "Папоротник (нефролепис)", latin: "Nephrolepis exaltata", light: ["shade", "partial"], care: "Ылғалды ауаны ұнатады, құрғақ ауада жапырағы сарғаяды." },
  { id: "schefflera", name: "Шефлера", latin: "Schefflera arboricola", light: ["partial", "bright"], care: "Шашыраңқы жарықты ұнатады, бұтақтанып өсуі үшін ұшын қиып отыру керек." },
  { id: "lucky-bamboo", name: "Бамбук (драцена Сандера)", latin: "Dracaena sanderiana", light: ["shade", "partial"], care: "Суда немесе топырақта өседі, тікелей күн тимеуі керек. Суын аптасына бір ауыстырады." },
  { id: "lalagul", name: "Лалагүл", latin: "", light: ["bright"], care: "Пиязшықты гүл: жарық терезеге қойылады, гүлдегеннен кейін тыныштық кезеңі болады." },
  { id: "hedera", name: "Шырмауық (плющ)", latin: "Hedera helix", light: ["shade", "partial"], care: "Салқын жерді ұнатады, ыстықта нашар өседі." },
];

export const plantById = (id: string | null) => (id ? INDOOR_PLANTS.find((p) => p.id === id) : undefined);

export const WINDOW_DIRS: { id: WindowDir; label: string; short: string }[] = [
  { id: "N", label: "Солтүстік", short: "С" },
  { id: "NE", label: "Солтүстік-шығыс", short: "СШ" },
  { id: "E", label: "Шығыс", short: "Ш" },
  { id: "SE", label: "Оңтүстік-шығыс", short: "ОШ" },
  { id: "S", label: "Оңтүстік", short: "О" },
  { id: "SW", label: "Оңтүстік-батыс", short: "ОБ" },
  { id: "W", label: "Батыс", short: "Б" },
  { id: "NW", label: "Солтүстік-батыс", short: "СБ" },
];

export const dirLabel = (d: WindowDir | null) => WINDOW_DIRS.find((x) => x.id === d)?.label ?? "көрсетілмеген";

/** Терезе бағыты бойынша кабинеттің жарық деңгейі */
export function roomLight(d: WindowDir | null): Light | null {
  if (!d) return null;
  if (d === "N" || d === "NE" || d === "NW") return "shade";
  if (d === "E" || d === "SE") return "partial";
  return "bright";
}

export const LIGHT_LABEL: Record<Light, string> = {
  shade: "көлеңкелі (тікелей күн аз)",
  partial: "жартылай жарық (таңертеңгі күн)",
  bright: "жарық, түстен кейін қатты қызады",
};

/** Батыс пен оңтүстік-батыс жаз айларында (Қызылорда) түстен кейін қатты қызады */
export const DIR_TIP: Record<WindowDir, string> = {
  N: "Күн тікелей түспейді: көлеңкеге төзімді гүлдер лайық. Қыста салқындау болады.",
  NE: "Таңертең аз ғана күн түседі: көлеңкеге төзімді гүлдер лайық.",
  NW: "Кешке қарай аз күн түседі: көлеңкеге төзімді гүлдер лайық.",
  E: "Таңертең күн түседі, түсте жайлы: көп гүлге қолайлы. Таңертеңгі сабақтарда перде керек болуы мүмкін.",
  SE: "Таңертең және түске дейін жарық: көп гүлге қолайлы.",
  S: "Күні бойы жарық: күн сүйгіш гүлдер лайық. Мамыр–қыркүйекте түсте перде керек.",
  SW: "Түстен кейін қатты қызады: күн сүйгіш гүлдер лайық. Ыстықта таңертең ерте желдету тиімді.",
  W: "Түстен кейін қатты қызады: күн сүйгіш гүлдер лайық. Ыстықта таңертең ерте желдету тиімді.",
};
