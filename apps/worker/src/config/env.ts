import { z } from 'zod';

const EnvSchema = z.object({
  REDIS_URL: z.url().default('redis://localhost:6379'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  GIT_SHA: z.string().min(1).default('dev'),
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  return EnvSchema.parse(source);
}
