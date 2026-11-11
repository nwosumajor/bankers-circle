import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp, registerNotFoundFallback } from '../../src/app.setup';
import { APP_VERSION } from '../../src/config/tokens';
import { DATABASE_URL, PrismaService } from '../../src/database/prisma.service';
import { WaitlistRepository } from '../../src/modules/waitlist/waitlist.repository';
import { InMemoryWaitlistRepository } from './in-memory-waitlist.repository';

export const TEST_ORIGIN = 'https://web.test';

export interface TestApp {
  app: INestApplication;
  server: App;
  waitlist: InMemoryWaitlistRepository;
}

/**
 * The real AppModule over HTTP, with the database swapped for in-memory fakes. Database behaviour
 * itself is covered by the Testcontainers integration tests.
 */
export async function createTestApp(): Promise<TestApp> {
  const waitlist = new InMemoryWaitlistRepository();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(APP_VERSION)
    .useValue('test-sha')
    .overrideProvider(DATABASE_URL)
    .useValue('postgresql://unused')
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(WaitlistRepository)
    .useValue(waitlist)
    .compile();
  const app = configureApp(moduleRef.createNestApplication({ logger: false }), {
    CORS_ORIGINS: [TEST_ORIGIN],
    TRUST_PROXY_HOPS: 0,
  });
  await app.init();
  registerNotFoundFallback(app);
  return { app, server: app.getHttpServer() as App, waitlist };
}
