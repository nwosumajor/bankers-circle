import { bandPath, copyRotations, type GuillocheBand } from '@/lib/guilloche';

const BANDS: (GuillocheBand & { id: string; width: number })[] = [
  { id: 'outer', radius: 178, amplitude: 9, lobes: 30, copies: 5, width: 0.7 },
  { id: 'middle', radius: 132, amplitude: 24, lobes: 18, copies: 6, width: 0.6 },
  { id: 'inner', radius: 74, amplitude: 30, lobes: 11, copies: 5, width: 0.6 },
];

/** Decorative security-print rosette; drawn once on load unless reduced motion is requested. */
export function GuillocheSeal({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-200 -200 400 400"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
    >
      <defs>
        {BANDS.map((band) => (
          <path
            key={band.id}
            id={`band-${band.id}`}
            d={bandPath(band)}
            strokeWidth={band.width}
            pathLength={1}
            className="seal-stroke"
          />
        ))}
      </defs>
      {BANDS.map((band) =>
        copyRotations(band).map((deg) => (
          <use key={`${band.id}-${deg}`} href={`#band-${band.id}`} transform={`rotate(${deg})`} />
        )),
      )}
      <circle r="196" strokeWidth="1.2" />
      <circle r="191" strokeWidth="0.4" />
      <circle r="38" strokeWidth="0.8" />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        className="font-display"
        fontSize="30"
        fill="currentColor"
        stroke="none"
      >
        BC
      </text>
    </svg>
  );
}
