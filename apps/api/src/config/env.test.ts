import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('applies defaults', () => {
    expect(parseEnv({})).toEqual({
      NODE_ENV: 'development',
      PORT: 4000,
      GIT_SHA: 'dev',
      CORS_ORIGINS: ['http://localhost:3000'],
      TRUST_PROXY_HOPS: 0,
    });
  });

  it('coerces PORT from a string', () => {
    expect(parseEnv({ PORT: '8080' }).PORT).toBe(8080);
  });

  it.each(['0', '70000', 'abc'])('rejects invalid PORT %s', (port) => {
    expect(() => parseEnv({ PORT: port })).toThrow(ZodError);
  });

  it('rejects a malformed DATABASE_URL', () => {
    expect(() => parseEnv({ DATABASE_URL: 'not a url' })).toThrow(ZodError);
  });

  it('splits and trims CORS_ORIGINS', () => {
    expect(
      parseEnv({ CORS_ORIGINS: 'https://a.example, https://b.example,' }).CORS_ORIGINS,
    ).toEqual(['https://a.example', 'https://b.example']);
  });

  it('rejects a non-URL CORS origin', () => {
    expect(() => parseEnv({ CORS_ORIGINS: '*' })).toThrow(ZodError);
  });
});
