/**
 * Guilloche bands like the security printing on banknotes and cheques. Each band is one closed
 * path whose radius oscillates around a circle; the woven look comes from drawing rotated copies.
 */
export interface GuillocheBand {
  /** Mean radius. */
  radius: number;
  /** Oscillation amplitude. */
  amplitude: number;
  /** Lobes per revolution. */
  lobes: number;
  /** Rotated copies drawn to weave the band. */
  copies: number;
}

export function bandPath({ radius, amplitude, lobes }: GuillocheBand, steps = 480): string {
  const points: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const r = radius + amplitude * Math.sin(lobes * t);
    points.push(`${(r * Math.cos(t)).toFixed(2)} ${(r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${points.join('L')}Z`;
}

/** Rotation (degrees) of each copy, spread evenly across one lobe so the copies interleave. */
export function copyRotations({ lobes, copies }: GuillocheBand): number[] {
  const lobeAngle = 360 / lobes;
  return Array.from({ length: copies }, (_, i) => Number(((i * lobeAngle) / copies).toFixed(3)));
}
