import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { processPing } from './system.js';

const NOW = new Date('2026-11-11T12:00:00.000Z');

describe('processPing', () => {
  it('reports queue lag in milliseconds', () => {
    expect(processPing({ sentAt: '2026-11-11T11:59:59.250Z' }, NOW)).toEqual({
      pong: true,
      lagMs: 750,
    });
  });

  it('never reports negative lag when clocks disagree', () => {
    expect(processPing({ sentAt: '2026-11-11T12:00:05.000Z' }, NOW).lagMs).toBe(0);
  });

  it('rejects malformed payloads', () => {
    expect(() => processPing({ sentAt: 'yesterday' }, NOW)).toThrow(ZodError);
  });
});
