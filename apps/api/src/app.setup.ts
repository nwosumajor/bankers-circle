import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import type { ProblemBody } from './common/problem';
import type { Env } from './config/env';

/** Shared by main.ts and e2e tests so tests exercise the real HTTP surface. */
export function configureApp(
  app: INestApplication,
  env: Pick<Env, 'CORS_ORIGINS' | 'TRUST_PROXY_HOPS'>,
): INestApplication {
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  app.enableCors({ origin: env.CORS_ORIGINS, methods: ['GET', 'POST'], maxAge: 600 });
  (app as NestExpressApplication).set('trust proxy', env.TRUST_PROXY_HOPS);
  return app;
}

/**
 * Catch-all for paths outside the /v1 prefix, which never reach Nest's router and would otherwise get
 * Express's HTML 404. Must run after `app.init()` so it sits behind every real route.
 */
export function registerNotFoundFallback(app: INestApplication): void {
  const express = (app as NestExpressApplication).getHttpAdapter().getInstance();
  express.use((req: Request, res: Response) => {
    const body: ProblemBody = {
      type: 'about:blank',
      title: 'Not found',
      status: 404,
      code: 'NOT_FOUND',
      instance: req.originalUrl,
    };
    res.status(404).type('application/problem+json').json(body);
  });
}
