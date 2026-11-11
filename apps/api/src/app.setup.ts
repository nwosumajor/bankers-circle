import type { INestApplication } from '@nestjs/common';

/** Shared by main.ts and e2e tests so tests exercise the real HTTP surface. */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  return app;
}
