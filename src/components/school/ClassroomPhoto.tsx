"use client";

import { Camera, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { compressImage } from "@/lib/image";
import { useAuth, useValue } from "@/lib/storage/hooks";
import { repositories } from "@/lib/storage/repositories";
import type { Classroom } from "@/lib/types";
import { STORAGE_WHERE } from "@/lib/supabase/client";
import { useEditGuard, useSaveFeedback, useToast } from "../Providers";
import { Badge } from "../ui/Badge";

/** Кабинет суреті: әзірге иллюстрация, нақты фотоға ауыстыруға болады */
export function ClassroomPhoto({ classroom, compact = false }: { classroom: Classroom; compact?: boolean }) {
  const repo = repositories.classroomPhoto(classroom.id);
  const photo = useValue(repo);
  const [busy, setBusy] = useState(false);
  const feedback = useSaveFeedback();
  const toast = useToast();
  const guard = useEditGuard();
  const { canEdit } = useAuth();

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const data = await compressImage(file, 1280, 0.78);
      await feedback(repo.set(data), "Кабинет фотосы сақталды");
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <figure className="relative overflow-hidden rounded-2xl border border-line bg-white">
      <div className={`relative ${compact ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={`${classroom.name} — жүктелген нақты фото`} className="h-full w-full object-cover" />
        ) : (
          <Image src={classroom.image} alt={`${classroom.name} — иллюстрация (қабырғада датчик)`} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
        )}
        <Badge tone={photo ? "user" : "illustration"} className="absolute left-3 top-3">
          {photo ? "Пайдаланушы жүктеген фото" : "Иллюстрация — нақты кабинет фотосы емес"}
        </Badge>
      </div>
      {!compact && (
        <figcaption className="flex flex-wrap items-center gap-2 px-3 py-2.5">
          {canEdit ? (
            <label className="btn btn-soft cursor-pointer !min-h-10 text-sm">
              <Camera size={16} aria-hidden />
              {busy ? "Сақталуда…" : photo ? "Фотоны ауыстыру" : "Нақты фото жүктеу"}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          ) : (
            <button type="button" className="btn btn-soft !min-h-10 text-sm" onClick={guard(() => {})}>
              <Camera size={16} aria-hidden /> {photo ? "Фотоны ауыстыру" : "Нақты фото жүктеу"}
            </button>
          )}
          {photo && (
            <button type="button" className="btn btn-ghost !min-h-10 text-sm" onClick={guard(() => void feedback(repo.clear(), "Иллюстрация қайтарылды"))}>
              <RotateCcw size={16} aria-hidden /> Иллюстрацияға қайтару
            </button>
          )}
          <span className="text-xs text-muted">Фото ықшамдалып, {STORAGE_WHERE} сақталады.</span>
        </figcaption>
      )}
    </figure>
  );
}
