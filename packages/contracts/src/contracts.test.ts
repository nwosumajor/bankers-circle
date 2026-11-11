import { describe, expect, it } from 'vitest';
import { HealthResponseSchema, ProblemSchema } from './index.js';

describe('HealthResponseSchema', () => {
  it('accepts a healthy response', () => {
    expect(HealthResponseSchema.parse({ status: 'ok', service: 'api', version: 'abc123' })).toEqual(
      {
        status: 'ok',
        service: 'api',
        version: 'abc123',
      },
    );
  });

  it('rejects an unknown service or empty version', () => {
    expect(
      HealthResponseSchema.safeParse({ status: 'ok', service: 'web', version: 'x' }).success,
    ).toBe(false);
    expect(
      HealthResponseSchema.safeParse({ status: 'ok', service: 'api', version: '' }).success,
    ).toBe(false);
  });
});

describe('ProblemSchema', () => {
  it('defaults type to about:blank', () => {
    const problem = ProblemSchema.parse({ title: 'Not found', status: 404, code: 'NOT_FOUND' });
    expect(problem.type).toBe('about:blank');
  });

  it('requires SCREAMING_SNAKE_CASE codes and an error status', () => {
    expect(ProblemSchema.safeParse({ title: 'x', status: 404, code: 'notFound' }).success).toBe(
      false,
    );
    expect(ProblemSchema.safeParse({ title: 'x', status: 200, code: 'OK' }).success).toBe(false);
  });
});
