import { HealthResponseSchema } from '@circle/contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/test-app';

describe('GET /v1/health', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('returns a contract-valid liveness payload', async () => {
    const res = await request(t.server).get('/v1/health').expect(200);
    expect(HealthResponseSchema.parse(res.body)).toEqual({
      status: 'ok',
      service: 'api',
      version: 'test-sha',
    });
  });

  it('returns problem+json 404 outside the /v1 prefix', async () => {
    const res = await request(t.server)
      .get('/health')
      .expect(404)
      .expect('content-type', /application\/problem\+json/);
    expect(res.body).toMatchObject({ status: 404, code: 'NOT_FOUND', instance: '/health' });
  });

  it('returns problem+json 404 for an unknown route inside /v1', async () => {
    const res = await request(t.server).get('/v1/nope').expect(404);
    expect(res.body).toMatchObject({ code: 'NOT_FOUND', instance: '/v1/nope' });
  });
});
