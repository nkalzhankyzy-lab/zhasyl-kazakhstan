import type { Room } from "@/lib/types";

// ДЕМО — нақты кабинеттер емес. Бөлімнің қалай жұмыс істейтінін көрсету үшін.
const p = (id: string, speciesId: string, name: string, count: number, plantedAt: string, condition: "good" | "fair" | "poor" = "good") => ({ id, speciesId, name, count, plantedAt, condition });

export const DEMO_ROOMS: Room[] = [
  {
    id: "demo-room-bio",
    status: "demo",
    name: "Демо: Биология кабинеті",
    floor: 2,
    lengthM: 10,
    widthM: 6,
    heightM: 3,
    windowDir: "S",
    windows: 3,
    plants: [
      p("r1-1", "chlorophytum", "Хлорофитум", 6, "2026-09-15"),
      p("r1-2", "aloe", "Алоэ", 3, "2025-09-01"),
      p("r1-3", "pelargonium", "Пеларгония (герань)", 4, "2026-03-10"),
      p("r1-4", "sansevieria", "Сансевиерия", 2, "2024-09-01"),
      p("r1-5", "spathiphyllum", "Спатифиллум", 2, "2026-09-20", "fair"),
    ],
    notes: "Демо мысал: терезе алдында сөрелер бар.",
    createdAt: "2026-09-15T06:00:00.000Z",
    updatedAt: "2026-10-17T06:00:00.000Z",
  },
  {
    id: "demo-room-math",
    status: "demo",
    name: "Демо: Математика кабинеті",
    floor: 3,
    lengthM: 9,
    widthM: 6,
    heightM: 3,
    windowDir: "N",
    windows: 3,
    plants: [p("r2-1", "cactus", "Кактус", 2, "2025-09-01", "poor"), p("r2-2", "zamioculcas", "Замиокулькас", 1, "2026-01-15")],
    notes: "Демо мысал: гүл аз, терезе солтүстікке қарайды.",
    createdAt: "2026-09-16T06:00:00.000Z",
    updatedAt: "2026-10-17T06:00:00.000Z",
  },
];
