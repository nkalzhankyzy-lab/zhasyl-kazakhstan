"use client";

import { Camera, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { REGIONS } from "@/data/regions";
import { compressImage, dataUrlKb } from "@/lib/image";
import { parseOptionalNumber } from "@/lib/metrics";
import { newId, repositories } from "@/lib/storage/repositories";
import { todayLocalDate } from "@/lib/time";
import type { SoilSample } from "@/lib/types";
import { keepFieldVisible } from "@/lib/ui";
import { useSaveFeedback } from "../Providers";
import { Dialog } from "../ui/Dialog";

export const MOISTURE_UNITS = ["% (көлемдік)", "% (салмақтық)", "датчиктің шартты бірлігі"];
export const MOISTURE_METHODS = ["Топырақ ылғалдылығы датчигі", "Кептіріп өлшеу (салмақ әдісі)", "Сапалық бағалау (қолмен сезу)", "Басқа әдіс"];
export const EC_UNITS = ["мкСм/см", "мСм/см", "дСм/м"];
export const EC_METHODS = ["EC-метр, топырақ:су 1:5 сүзіндісі", "EC-метр, қаныққан паста сүзіндісі", "Топыраққа енгізілетін датчик", "Басқа әдіс"];

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: SoilSample | null;
  defaultRegionId?: string;
  onSaved?: (s: SoilSample) => void;
}

type FormState = Record<string, string>;

function toForm(s?: SoilSample | null, regionId?: string): FormState {
  return {
    name: s?.name ?? "",
    regionId: s?.regionId ?? regionId ?? "KZ-43",
    locationDescription: s?.locationDescription ?? "",
    lat: s?.coordinates ? String(s.coordinates.lat) : "",
    lon: s?.coordinates ? String(s.coordinates.lon) : "",
    collectedAt: s?.collectedAt ?? todayLocalDate(),
    depthCm: s?.depthCm != null ? String(s.depthCm) : "",
    ph: s?.ph != null ? String(s.ph) : "",
    moisture: s?.moisture ? String(s.moisture.value) : "",
    moistureUnit: s?.moisture?.unit ?? MOISTURE_UNITS[0],
    moistureMethod: s?.moisture?.method ?? MOISTURE_METHODS[0],
    ec: s?.ec ? String(s.ec.value) : "",
    ecUnit: s?.ec?.unit ?? EC_UNITS[0],
    ecMethod: s?.ec?.method ?? EC_METHODS[0],
    observations: s?.observations ?? "",
    conclusion: s?.conclusion ?? "",
  };
}

export function SoilSampleForm({ open, onClose, initial, defaultRegionId, onSaved }: Props) {
  const [f, setF] = useState<FormState>(() => toForm(initial, defaultRegionId));
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const feedback = useSaveFeedback();
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    const warn: string[] = [];
    if (!f.name.trim()) err.name = "Үлгі атауын жазыңыз";
    if (!f.collectedAt) err.collectedAt = "Алынған күнді көрсетіңіз";
    const lat = parseOptionalNumber(f.lat);
    const lon = parseOptionalNumber(f.lon);
    if ((lat === null) !== (lon === null)) err.coords = "Ендік пен бойлықтың екеуін де толтырыңыз немесе екеуін де бос қалдырыңыз";
    if (Number.isNaN(lat) || Number.isNaN(lon)) err.coords = "Координат сан болуы керек (мысалы 44.85 және 65.51)";
    else if (lat !== null && lon !== null) {
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) err.coords = "Координат мүмкін аралықтан тыс";
      else if (lat < 40 || lat > 56 || lon < 46 || lon > 88) warn.push("Координат Қазақстан аумағынан тыс сияқты — тексеріңіз.");
    }
    const depth = parseOptionalNumber(f.depthCm);
    if (Number.isNaN(depth) || (depth !== null && depth < 0)) err.depthCm = "Тереңдік — оң сан, см";
    const ph = parseOptionalNumber(f.ph);
    if (Number.isNaN(ph) || (ph !== null && (ph < 0 || ph > 14))) err.ph = "pH 0 мен 14 аралығында болуы керек";
    else if (ph !== null && (ph < 3 || ph > 11)) warn.push(`pH ${ph} — әдеттен тыс мән, өлшемді тексеріңіз.`);
    const moisture = parseOptionalNumber(f.moisture);
    if (Number.isNaN(moisture) || (moisture !== null && moisture < 0)) err.moisture = "Ылғалдылық — теріс емес сан";
    else if (moisture !== null && f.moistureUnit.startsWith("%") && moisture > 100) err.moisture = "Пайыз 100-ден аспайды";
    const ec = parseOptionalNumber(f.ec);
    if (Number.isNaN(ec) || (ec !== null && ec < 0)) err.ec = "Электрөткізгіштік — теріс емес сан";
    setErrors(err);
    setWarnings(warn);
    if (Object.keys(err).length) return;
    const now = new Date().toISOString();
    const sample: SoilSample = {
      id: initial?.id ?? newId("soil"),
      status: "user",
      name: f.name.trim(),
      regionId: f.regionId,
      locationDescription: f.locationDescription.trim(),
      coordinates: lat !== null && lon !== null ? { lat, lon } : null,
      collectedAt: f.collectedAt,
      depthCm: depth,
      photo,
      ph,
      moisture: moisture !== null ? { value: moisture, unit: f.moistureUnit, method: f.moistureMethod } : null,
      ec: ec !== null ? { value: ec, unit: f.ecUnit, method: f.ecMethod } : null,
      observations: f.observations.trim(),
      conclusion: f.conclusion.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    const ok = feedback(repositories.soilSamples.upsert(sample), initial ? "Үлгі жаңартылды" : "Үлгі сақталды және зерттеу күнделігіне қосылды");
    if (ok) {
      onSaved?.(sample);
      onClose();
    }
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    try {
      setPhoto(await compressImage(file, 1024, 0.72));
    } catch (e) {
      setErrors((x) => ({ ...x, photo: (e as Error).message }));
    } finally {
      setPhotoBusy(false);
    }
  };

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1 text-sm font-medium text-alert" role="alert">{errors[k]}</p> : null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? "Топырақ үлгісін өңдеу" : "Топырақ үлгісін зерттеу"}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Бас тарту
          </button>
          <button type="submit" form="soil-form" className="btn btn-primary">
            Сақтау
          </button>
        </>
      }
    >
      <form id="soil-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2" onFocus={keepFieldVisible}>
        <p className="rounded-xl bg-mint px-3 py-2 text-sm text-forest sm:col-span-2">
          Өлшем өрістерін бос қалдыруға болады — бос мән нөлге айналмайды, «Өлшем енгізілмеген» болып сақталады.
        </p>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="s-name">Үлгі атауы *</label>
          <input id="s-name" className="input" value={f.name} onChange={set("name")} placeholder="Мысалы: Мектеп ауласы, №1 үлгі" aria-invalid={!!errors.name} />
          <Err k="name" />
        </div>
        <div>
          <label className="field-label" htmlFor="s-region">Аймақ *</label>
          <select id="s-region" className="input" value={f.regionId} onChange={set("regionId")}>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nameKk}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="s-date">Алынған күн *</label>
          <input id="s-date" type="date" className="input" value={f.collectedAt} onChange={set("collectedAt")} aria-invalid={!!errors.collectedAt} />
          <Err k="collectedAt" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="s-loc">Орын сипаттамасы</label>
          <input id="s-loc" className="input" value={f.locationDescription} onChange={set("locationDescription")} placeholder="Мысалы: мектептің оңтүстік жағындағы гүлзар" />
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="field-label">Координаттар (міндетті емес)</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="sr-only" htmlFor="s-lat">Ендік</label>
              <input id="s-lat" className="input" inputMode="decimal" value={f.lat} onChange={set("lat")} placeholder="Ендік, мыс. 44.85" />
            </div>
            <div>
              <label className="sr-only" htmlFor="s-lon">Бойлық</label>
              <input id="s-lon" className="input" inputMode="decimal" value={f.lon} onChange={set("lon")} placeholder="Бойлық, мыс. 65.51" />
            </div>
          </div>
          <p className="field-hint">Координат болса, үлгі картада нүкте болып көрінеді. Болмаса — аймақ панеліндегі тізімге қосылады.</p>
          <Err k="coords" />
        </fieldset>
        <div>
          <label className="field-label" htmlFor="s-depth">Тереңдік, см (белгілі болса)</label>
          <input id="s-depth" className="input" inputMode="decimal" value={f.depthCm} onChange={set("depthCm")} />
          <Err k="depthCm" />
        </div>
        <div>
          <label className="field-label" htmlFor="s-ph">pH (міндетті емес)</label>
          <input id="s-ph" className="input" inputMode="decimal" value={f.ph} onChange={set("ph")} placeholder="0–14" />
          <Err k="ph" />
        </div>
        <fieldset className="rounded-2xl border border-line p-3 sm:col-span-2">
          <legend className="px-1 text-sm font-semibold">Ылғалдылық (міндетті емес)</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="s-moist">Мәні</label>
              <input id="s-moist" className="input" inputMode="decimal" value={f.moisture} onChange={set("moisture")} />
            </div>
            <div>
              <label className="field-label" htmlFor="s-moist-u">Өлшем бірлігі</label>
              <select id="s-moist-u" className="input" value={f.moistureUnit} onChange={set("moistureUnit")}>
                {MOISTURE_UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="s-moist-m">Әдісі</label>
              <select id="s-moist-m" className="input" value={f.moistureMethod} onChange={set("moistureMethod")}>
                {MOISTURE_METHODS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <Err k="moisture" />
        </fieldset>
        <fieldset className="rounded-2xl border border-line p-3 sm:col-span-2">
          <legend className="px-1 text-sm font-semibold">Электрөткізгіштік — тұздылықты бағалау үшін (міндетті емес)</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="s-ec">Мәні</label>
              <input id="s-ec" className="input" inputMode="decimal" value={f.ec} onChange={set("ec")} />
            </div>
            <div>
              <label className="field-label" htmlFor="s-ec-u">Өлшем бірлігі</label>
              <select id="s-ec-u" className="input" value={f.ecUnit} onChange={set("ecUnit")}>
                {EC_UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="s-ec-m">Әдісі</label>
              <select id="s-ec-m" className="input" value={f.ecMethod} onChange={set("ecMethod")}>
                {EC_METHODS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <Err k="ec" />
        </fieldset>
        <div className="sm:col-span-2">
          <span className="field-label">Фото (міндетті емес)</span>
          <div className="flex flex-wrap items-center gap-3">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Үлгінің жүктелген фотосы" className="h-20 w-28 rounded-xl object-cover" />
            )}
            <label className="btn btn-soft cursor-pointer">
              <Camera size={18} aria-hidden />
              {photoBusy ? "Ықшамдалуда…" : photo ? "Фотоны ауыстыру" : "Фото қосу"}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
            </label>
            {photo && (
              <button type="button" className="btn btn-ghost" onClick={() => setPhoto(null)}>
                <Trash2 size={16} aria-hidden /> Фотоны алып тастау
              </button>
            )}
          </div>
          <p className="field-hint">
            Фото сақтау алдында ықшамдалады{photo ? ` (~${dataUrlKb(photo)} КБ)` : ""}. Фотодан pH, тұздылық немесе қоректік заттар анықталмайды.
          </p>
          <Err k="photo" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="s-obs">Бақылау</label>
          <textarea id="s-obs" className="input" value={f.observations} onChange={set("observations")} placeholder="Түсі, түйіршіктері, иісі, тамырлар, тұз қабыршағы…" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="s-concl">Қорытынды (өзіңіз жазасыз)</label>
          <textarea id="s-concl" className="input" value={f.conclusion} onChange={set("conclusion")} />
        </div>
        {warnings.length > 0 && (
          <ul className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-900 sm:col-span-2" role="alert">
            {warnings.map((w) => <li key={w}>⚠ {w}</li>)}
          </ul>
        )}
      </form>
    </Dialog>
  );
}
