export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#1f4a2c" />
      <path d="M24 38c0-9 2-15 10-22-9 1-14 6-15 13" fill="none" stroke="#cfe3a8" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M33.5 15.5c-1 8-5 12.5-11 13.5 1-7 5-12 11-13.5z" fill="#8fbf5a" />
      <path d="M13 19c6 0 9.5 3.5 10 9.5-6 .2-9.6-3.4-10-9.5z" fill="#cfe3a8" />
    </svg>
  );
}
