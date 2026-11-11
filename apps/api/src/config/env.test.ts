import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('applies defaults', () => {
    expect(parseEnv({})).toEqual({ NODE_ENV: 'development', PORT: 4000, GIT_SHA: 'dev' });
  });

  it('rejects a malformed DATABASE_URL', () => {
    expect(() => parseEnv({ DATABASE_URL: 'not a url' })).toThrow(ZodError);
  });

  it('coerces PORT from a string', () => {
    expect(parseEnv({ PORT: '8080' }).PORT).toBe(8080);
  });

  it.each(['0', '70000', 'abc'])('rejects invalid PORT %s', (port) => {
    expect(() => parseEnv({ PORT: port })).toThrow(ZodError);
  });
});
