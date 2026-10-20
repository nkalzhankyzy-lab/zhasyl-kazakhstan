import type { WindowDir, YardItem } from "@/lib/types";

// №23 мектеп-лицей (Қызылорда) аумағының сызбасы: Google спутник суреті бойынша шамамен салынған.
// Координаттар — viewBox 0 0 480 600, солтүстік жоғарыда. Масштаб шамамен 1 бірлік ≈ 0,25 м.

export const MAP_W = 480;
export const MAP_H = 600;

export interface MapRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Мектеп ғимараттары (шатыр) */
export const BUILDINGS: MapRect[] = [
  { id: "nw", x: 148, y: 95, w: 140, h: 125 },
  { id: "ne", x: 338, y: 110, w: 102, h: 170 },
  { id: "bar", x: 148, y: 215, w: 292, h: 45 },
  { id: "spine", x: 232, y: 255, w: 45, h: 100 },
  { id: "sw", x: 145, y: 290, w: 95, h: 150 },
  { id: "s", x: 145, y: 350, w: 270, h: 90 },
];

export const ANNEXES: MapRect[] = [
  { id: "annex", x: 413, y: 376, w: 32, h: 52 },
  { id: "garage", x: 175, y: 495, w: 36, h: 48 },
];

export interface MapZone extends MapRect {
  label: string;
  kind: "field" | "sport" | "plaza" | "inner";
}

export const ZONES: MapZone[] = [
  { id: "football", x: 14, y: 312, w: 102, h: 226, label: "Футбол алаңы", kind: "field" },
  { id: "sport", x: 288, y: 268, w: 116, h: 76, label: "Спорт алаңы", kind: "sport" },
  { id: "plaza", x: 252, y: 446, w: 150, h: 34, label: "Салтанатты жиын алаңы", kind: "plaza" },
  { id: "inner", x: 292, y: 116, w: 42, h: 94, label: "Ішкі аула", kind: "inner" },
];

/** Ағаш егуге болатын ашық орындар (ұсыныс) */
export const OPEN_SPOTS = [
  { id: "field-north", x: 66, y: 296, label: "Футбол алаңының солтүстігі: көрермендерге көлеңке беретін ағаш қатары" },
  { id: "field-south", x: 66, y: 548, label: "Футбол алаңы мен қоршау арасы: шаңнан қорғайтын ағаш белдеуі" },
  { id: "east-gap", x: 462, y: 410, label: "Шығыс қоршау бойы: ағаш қатары арасындағы бос орын" },
];

/** Кабинет орналасуы мүмкін орындар (терезе бағытымен) */
export const ROOM_SPOTS: { id: string; label: string; x: number; y: number; dir: WindowDir }[] = [
  { id: "s-front", label: "Оңтүстік корпус, көшеге қараған жақ", x: 330, y: 425, dir: "S" },
  { id: "s-front-west", label: "Оңтүстік корпус, батыс бөлігі (көшеге қараған)", x: 190, y: 425, dir: "S" },
  { id: "sw-west", label: "Оңтүстік корпус, батыс қанаты (футбол алаңына қараған)", x: 160, y: 315, dir: "W" },
  { id: "s-inner", label: "Оңтүстік корпус, ішкі аулаға қараған жақ", x: 360, y: 362, dir: "N" },
  { id: "bar-inner", label: "Ортаңғы корпус, спорт алаңына қараған жақ", x: 330, y: 248, dir: "S" },
  { id: "nw-north", label: "Солтүстік корпус, солтүстік жақ", x: 215, y: 108, dir: "N" },
  { id: "nw-west", label: "Солтүстік корпус, батыс жақ", x: 162, y: 160, dir: "W" },
  { id: "ne-east", label: "Шығыс корпус, шығысқа қараған жақ", x: 428, y: 180, dir: "E" },
];

export const spotById = (id: string | null | undefined) => ROOM_SPOTS.find((s) => s.id === id);

export const KIND_LABEL: Record<YardItem["kind"], string> = { tree: "Ағаш", shrub: "Бұта", flowers: "Гүлзар" };

/** Аула өсімдіктері туралы қысқа дерек (ұсыныстар үшін) */
export const YARD_FACTS: { match: RegExp; text: string; lifespan?: number }[] = [
  { match: /терек/i, text: "Терек тез өседі, бірақ 40–60 жасында қартаяды, бұтақтары сынғыш болады. Мамырдағы мамығы аллергия тудыруы мүмкін.", lifespan: 50 },
  { match: /қарағаш/i, text: "Қарағаш ыстыққа, құрғақшылыққа және тұзды топыраққа төзімді. Қызылорда жағдайына ең лайық ағаштардың бірі.", lifespan: 100 },
  { match: /жиде/i, text: "Жиде тұзданған топыраққа өте төзімді, тамыры топырақты бекітеді. Жемісін құстар жейді.", lifespan: 60 },
  { match: /акация/i, text: "Ақ акация құрғақшылыққа төзімді. Бұршақ тұқымдас болғандықтан тамырындағы бактериялар арқылы топыраққа азот жинайды.", lifespan: 60 },
  { match: /тұт/i, text: "Тұт ағашы жалпақ көлеңке береді, жемісі жеуге жарамды. Ыстыққа төзімді.", lifespan: 80 },
  { match: /сирень/i, text: "Сирень көктемде хош иісті гүлдейді. Құрғақшылыққа орташа төзімді, гүлдегеннен кейін кесіп отыру керек.", lifespan: 50 },
  { match: /раушан/i, text: "Раушанға күн мен суару керек. Қыс алдында түбін жауып қою қажет.", lifespan: 15 },
  { match: /барқыт|бархат/i, text: "Барқытгүл (тагетес) ыстыққа төзімді. Кейбір топырақ зиянкестерін үркітеді деп саналады.", lifespan: 1 },
  { match: /петуния/i, text: "Петуния жазы бойы гүлдейді. Бір жылдық гүл, жыл сайын көшеттен отырғызылады.", lifespan: 1 },
  { match: /арша/i, text: "Арша мәңгі жасыл, құрғақшылыққа төзімді. Фитонцид бөледі.", lifespan: 200 },
];

export const factFor = (name: string) => YARD_FACTS.find((f) => f.match.test(name));

/** Бір ересек ағаш жылына шамамен 10–20 кг CO₂ сіңіреді (түріне, жасына қарай). Ортасын аламыз. */
export const TREE_CO2_KG_YEAR = 15;
/** Бір адам демімен тәулігіне шамамен 1 кг CO₂ шығарады */
export const PERSON_CO2_KG_DAY = 1;
