import type { School } from "@/lib/types";

export const SCHOOLS: School[] = [
  {
    id: "kzo-23",
    name: "Жәлел Қизатов атындағы №23 мектеп-лицей",
    shortName: "№23 мектеп-лицей",
    regionId: "KZ-43",
    city: "Қызылорда",
    location: {
      // Қызылорда қаласының жалпы координаты. Мектептің нақты орны ЕМЕС.
      lat: 44.85,
      lon: 65.51,
      precision: "approximate",
      note: "Мектептің нақты координаты әлі тексерілмеген. Белгі Қызылорда қаласы бойынша уақытша қойылған, кейін нақтыланады.",
    },
    classrooms: [{ id: "kzo-23-bio", schoolId: "kzo-23", name: "Биология кабинеті", image: "/images/classroom.png" }],
  },
];

export const schoolById = (id: string) => SCHOOLS.find((s) => s.id === id);
export const MAIN_SCHOOL = SCHOOLS[0];
export const MAIN_CLASSROOM = SCHOOLS[0].classrooms[0];
