import { existsSync } from 'node:fs';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  /** Commit SHA baked into the image by CI; `dev` locally. */
  GIT_SHA: z.string().min(1).default('dev'),
  /** Runtime connection (Supavisor pooler in staging/prod). Optional until Phase 1 wires the DB in. */
  DATABASE_URL: z.url().optional(),
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
