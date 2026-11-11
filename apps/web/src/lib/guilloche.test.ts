import { describe, expect, it } from 'vitest';
import { bandPath, copyRotations } from './guilloche';

describe('bandPath', () => {
  const band = { radius: 100, amplitude: 10, lobes: 8, copies: 4 };

  it('produces a closed path with one point per step', () => {
    const d = bandPath(band, 64);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.split('L')).toHaveLength(64);
  });

  it('keeps every point within radius ± amplitude', () => {
    const coords = bandPath(band, 200)
      .slice(1, -1)
      .split('L')
      .map((p) => p.split(' ').map(Number) as [number, number]);
    for (const [x, y] of coords) {
      const r = Math.hypot(x, y);
      expect(r).toBeGreaterThanOrEqual(89.9);
      expect(r).toBeLessThanOrEqual(110.1);
    }
  });

  it('is deterministic, so server and client render identically', () => {
    expect(bandPath(band)).toBe(bandPath(band));
  });
});

describe('copyRotations', () => {
  it('spreads copies evenly within one lobe', () => {
    expect(copyRotations({ radius: 1, amplitude: 1, lobes: 8, copies: 4 })).toEqual([
      0, 11.25, 22.5, 33.75,
    ]);
  });
});
