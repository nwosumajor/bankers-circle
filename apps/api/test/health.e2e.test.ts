import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HealthResponseSchema } from '@circle/contracts';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { APP_VERSION } from '../src/config/tokens';

describe('GET /v1/health', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(APP_VERSION)
      .useValue('test-sha')
      .compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    server = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a contract-valid liveness payload', async () => {
    const res = await request(server).get('/v1/health').expect(200);
    expect(HealthResponseSchema.parse(res.body)).toEqual({
      status: 'ok',
      service: 'api',
      version: 'test-sha',
    });
  });

  it('is only served under the /v1 prefix', async () => {
    await request(server).get('/health').expect(404);
  });
});
