import { SOIL_ZONES } from "@/data/soil-scheme";

/** SVG үлгілері мен сүзгілері: топырақ белгілері, көлеңке, табиғи текстура */
/** k — карта масштабы: үлгілер экранда бірдей өлшемде қалуы үшін кері масштабталады */
export function MapDefs({ countryD, k = 1 }: { countryD: string; k?: number }) {
  const s = `scale(${1 / k})`;
  return (
    <defs>
      <path id="country-shape" d={countryD} />
      <clipPath id="clip-country">
        <use href="#country-shape" />
      </clipPath>
      <filter id="map-shadow" x="-10%" y="-10%" width="130%" height="140%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
      <filter id="lift-shadow" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#1f4a2c" floodOpacity="0.35" />
      </filter>
      <filter id="texture" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.12  0 0 0 0.55 0" />
      </filter>
      <linearGradient id="light" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#3a2a15" stopOpacity="0.18" />
      </linearGradient>
      {/* Топырақ белдеулері: түс + әр белдеудің өз штрихы */}
      {SOIL_ZONES.map((z, i) => (
        <pattern key={z.key} id={`zone-${z.key}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform={`${s} rotate(${[0, 45, -45, 90, 20][i]})`}>
          <rect width="10" height="10" fill={z.color} />
          {z.key === "chernozem" && <circle cx="5" cy="5" r="0.9" fill="#3e2a1c" opacity="0.6" />}
          {z.key === "chestnut" && <line x1="0" y1="5" x2="10" y2="5" stroke="#6e4a2e" strokeWidth="0.7" opacity="0.5" />}
          {z.key === "brown" && <line x1="0" y1="2" x2="10" y2="2" stroke="#9c7547" strokeWidth="0.6" opacity="0.5" />}
          {z.key === "mountain" && <path d="M1 8 L4 3 L7 8" fill="none" stroke="#5e6346" strokeWidth="0.8" opacity="0.7" />}
        </pattern>
      ))}
      <pattern id="sym-sand" patternTransform={s} width="7" height="7" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1" fill="#8a5a22" />
        <circle cx="5" cy="4.8" r="0.8" fill="#8a5a22" />
      </pattern>
      <pattern id="sym-saline" patternTransform={s} width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="#ffffff" opacity="0.55" />
        <path d="M0 0 L8 8 M8 0 L0 8" stroke="#7d8790" strokeWidth="0.8" />
      </pattern>
      <pattern id="sym-takyr" patternTransform={s} width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill="#d7b486" opacity="0.7" />
        <path d="M0 4 L4 5 L6 0 M4 5 L7 9 L12 8 M7 9 L6 12" fill="none" stroke="#6b4b2f" strokeWidth="0.8" />
      </pattern>
    </defs>
  );
}
