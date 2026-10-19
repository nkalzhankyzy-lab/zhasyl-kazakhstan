// Платформаның негізгі дерек құрылымдары.
// Анықтамалық дерек (Region, SoilDescription, Plant, School, SourceReference) — кодпен бірге келеді.
// Пайдаланушы дерегі (SoilSample, SensorReading, ResearchEntry) — сақтау қабаты арқылы жазылады.

/** Дерек мәртебесі: демо сценарийі немесе пайдаланушы енгізген. */
export type DataStatus = "demo" | "user";

export interface SourceReference {
  id: string;
  title: string;
  publisher: string;
  url?: string;
  /** Тексерілген күні, YYYY-MM-DD */
  accessedAt: string;
  /** Дерек мерзімі немесе нұсқасы */
  edition?: string;
  license?: string;
  note?: string;
}

/** Мәтіндік бөлім: тексерілген сөйлемдер және олардың дереккөздері. */
export interface InfoSection {
  paragraphs: string[];
  facts?: { label: string; value: string }[];
  sourceIds: string[];
}

export interface SoilDescription {
  regionId: string;
  /** Облыс туралы тексерілген жалпы сипаттама (бір облыс — бір топырақ емес) */
  paragraphs: string[];
  /** Аймақта кездесетін топырақ түрлері (иллюстрациясы бар болса) */
  types: { key: "sandy" | "takyr" | "saline"; name: string; note: string; image: string }[];
  sourceIds: string[];
}

export type RegionKind = "oblys" | "city";

export interface Region {
  /** ISO 3166-2:KZ коды, мысалы KZ-43 */
  id: string;
  slug: string;
  nameKk: string;
  shortKk: string;
  kind: RegionKind;
  center: string;
  areaKm2?: number;
  /** Толық безендірілген панель бар ма */
  detail: "full" | "basic";
  summary?: InfoSection;
  soil?: SoilDescription;
  climate?: InfoSection;
  water?: InfoSection;
  plants?: InfoSection;
  sourceIds: string[];
}

export interface Measurement {
  value: number;
  unit: string;
  method: string;
}

export interface SoilSample {
  id: string;
  status: DataStatus;
  name: string;
  regionId: string;
  locationDescription: string;
  coordinates: { lat: number; lon: number } | null;
  /** YYYY-MM-DD */
  collectedAt: string;
  depthCm: number | null;
  /** Ықшамдалған data URL */
  photo: string | null;
  ph: number | null;
  moisture: Measurement | null;
  ec: Measurement | null;
  observations: string;
  conclusion: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plant {
  id: string;
  nameKk: string;
  latin: string;
  image: string;
  paragraphs: string[];
  sourceIds: string[];
}

export interface Classroom {
  id: string;
  schoolId: string;
  name: string;
  image: string;
}

export interface School {
  id: string;
  name: string;
  shortName: string;
  regionId: string;
  city: string;
  location: {
    lat: number;
    lon: number;
    /** approximate — тек қала деңгейіндегі уақытша белгі */
    precision: "approximate" | "exact";
    note: string;
  };
  classrooms: Classroom[];
}

export type VentilationState = "closed" | "window" | "door" | "window_door";

export interface SensorReading {
  id: string;
  classroomId: string;
  status: DataStatus;
  /** ISO 8601, UTC */
  timestamp: string;
  co2Ppm: number | null;
  temperatureC: number | null;
  humidityPct: number | null;
  pm25UgM3: number | null;
  occupants: number | null;
  ventilation: VentilationState | null;
  /** Осы сәтте желдету оқиғасы басталды */
  ventilationEvent: boolean;
  note: string;
  source: "demo-scenario" | "manual" | "csv";
}

/** Графикте белгіленетін желдету оқиғасы (өлшемдерден алынады). */
export interface VentilationEvent {
  id: string;
  classroomId: string;
  status: DataStatus;
  timestamp: string;
  description: string;
}

export interface ComfortTally {
  comfortable: number | null;
  neutral: number | null;
  uncomfortable: number | null;
}

export interface ResearchEntry {
  id: string;
  kind: "classroom" | "soil" | "general";
  /** Кабинет id немесе топырақ үлгісі id */
  subjectId: string | null;
  question: string;
  hypothesis: string;
  /** YYYY-MM-DD */
  date: string;
  observations: string;
  /** Ықтимал түсіндірмелер — дерек емес, болжам */
  possibleExplanations: string;
  actions: string;
  conclusion: string;
  classroom?: {
    lessonTime: string;
    occupants: number | null;
    ventilation: string;
    lightNoiseNote: string;
    comfort: ComfortTally;
  };
  createdAt: string;
  updatedAt: string;
}

export type MetricKey = "co2Ppm" | "temperatureC" | "humidityPct" | "pm25UgM3";
