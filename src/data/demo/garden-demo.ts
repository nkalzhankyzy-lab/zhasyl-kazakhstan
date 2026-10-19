import type { GardenPlant } from "@/lib/types";

// ДЕМО — нақты бақылау емес. «Менің гүлім» бөлімінің қалай жұмыс істейтінін көрсету үшін.
const log = (id: string, date: string, heightCm: number | null, leaves: number | null, watered: boolean, note = "") => ({ id, date, heightCm, leaves, watered, note });

export const DEMO_GARDEN: GardenPlant[] = [
  {
    id: "demo-plant-1",
    status: "demo",
    name: "Демо: Хлорофитум",
    location: "Биология кабинеті, терезе жаны",
    plantedAt: "2026-09-15",
    photo: null,
    notes: "Демо мысал: көшет кабинетке 9-сынып оқушыларының үйінен әкелінді.",
    logs: [
      log("d1-1", "2026-09-15", 12, 8, true, "Құмыраға отырғызылды"),
      log("d1-2", "2026-09-22", 13.5, 9, true),
      log("d1-3", "2026-09-29", 15, 10, true),
      log("d1-4", "2026-10-06", 16, 12, true, "Жаңа жапырақ шықты"),
      log("d1-5", "2026-10-13", 18, 13, true),
      log("d1-6", "2026-10-17", 19.5, 15, false),
    ],
    createdAt: "2026-09-15T06:00:00.000Z",
    updatedAt: "2026-10-17T06:00:00.000Z",
  },
  {
    id: "demo-plant-2",
    status: "demo",
    name: "Демо: Қызыл гүлді герань",
    location: "Оқушының үйі, балкон",
    plantedAt: "2026-09-20",
    photo: null,
    notes: "Демо мысал: оқушы үйде отырғызып, ата-анасымен бірге күтеді.",
    logs: [
      log("d2-1", "2026-09-20", 8, 6, true, "Қалемшеден отырғызылды"),
      log("d2-2", "2026-09-27", 9, 7, true),
      log("d2-3", "2026-10-04", 10.5, 9, true),
      log("d2-4", "2026-10-11", 12, 11, true, "Алғашқы бүршік"),
      log("d2-5", "2026-10-18", 13, 12, true),
    ],
    createdAt: "2026-09-20T06:00:00.000Z",
    updatedAt: "2026-10-18T06:00:00.000Z",
  },
];
