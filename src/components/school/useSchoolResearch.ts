"use client";

import { useMemo } from "react";
import { useCollection } from "@/lib/storage/hooks";
import { repositories } from "@/lib/storage/repositories";
import { lessonHourKey, useOutdoor } from "@/lib/weather";
import { labContext, transpirationSummary } from "../lab/labMath";
import { surveyContext } from "../survey/surveyMath";
import { lessonsContext, type Co2Opts } from "./lessonMath";

/** Экопаспорттағы барлық зерттеу деректері (сабақ журналы, сауалнама, шаң, зертхана) — ЖИ-ге беру үшін бір мәтін */
export function useSchoolResearch() {
  const allRooms = useCollection(repositories.rooms);
  const allLessons = useCollection(repositories.lessons);
  const allSurvey = useCollection(repositories.survey);
  const allDust = useCollection(repositories.dust);
  const allLab = useCollection(repositories.lab);
  const rooms = useMemo(() => allRooms.filter((r) => r.status === "user").sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [allRooms]);
  const baseLessons = useMemo(() => allLessons.filter((l) => l.status === "user").sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), [allLessons]);
  const outdoor = useOutdoor(baseLessons.filter((l) => l.tOut == null).map((l) => l.date));
  const lessons = useMemo(
    () =>
      baseLessons.map((l) => {
        if (l.tOut != null) return l;
        const o = outdoor[lessonHourKey(l.date, l.time, l.durationMin)];
        return o ? { ...l, tOut: o.t, rhOut: o.rh } : l;
      }),
    [baseLessons, outdoor],
  );
  const survey = useMemo(() => allSurvey.filter((x) => x.status === "user"), [allSurvey]);
  const dust = useMemo(() => allDust.filter((x) => x.status === "user"), [allDust]);
  const lab = useMemo(() => allLab.filter((x) => x.status === "user"), [allLab]);
  const context = useMemo(() => {
    const opts: Co2Opts = { plantGph: transpirationSummary(lab, rooms).perPotGph };
    const dustText = dust.length ? "ШАҢ ТӘЖІРИБЕСІ (бөлшек/см², апта): " + dust.map((d) => `${rooms.find((r) => r.id === d.roomId)?.name ?? d.roomId}: ${d.count}`).join("; ") : "";
    return [lessonsContext(rooms, lessons, opts), surveyContext(rooms, survey), dustText, labContext(lab, rooms)].filter(Boolean).join("\n\n");
  }, [rooms, lessons, survey, dust, lab]);
  return { rooms, lessons, survey, dust, lab, context };
}
