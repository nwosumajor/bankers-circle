import { existsSync } from 'node:fs';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  /** Commit SHA baked into the image by CI; `dev` locally. */
  GIT_SHA: z.string().min(1).default('dev'),
  /** Runtime connection (Supavisor pooler in staging/prod). */
  DATABASE_URL: z.url().optional(),
  /** Browser origins allowed to call the API (comma-separated), e.g. the member web app. */
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) =>
      v
        .split(',')
        .map((o) => o.trim())
        .filter((o) => o !== ''),
    )
    .pipe(z.array(z.url())),
  /**
   * Number of reverse proxies in front of the API (e.g. Cloudflare + Render). Express uses it to take
   * the client IP from X-Forwarded-For for rate limiting. Must match the real hop count: too high lets
   * clients spoof their IP.
   */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
});

export type Env = z.infer<typeof EnvSchema>;

/** Validates configuration at boot so a bad deploy fails fast instead of at first use. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  return EnvSchema.parse(source);
}

/** Loads `.env` for local development only; deployed services get env from Render groups. */
export function loadLocalEnvFile(path = '.env'): void {
  if (process.env['NODE_ENV'] !== 'production' && existsSync(path)) {
    process.loadEnvFile(path);
  }
}
