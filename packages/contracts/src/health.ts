import { z } from 'zod';

/** Response of `GET /v1/health`, used by Render health checks and the Lagos synthetic probe. */
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.enum(['api', 'worker']),
  /** Commit SHA of the deployed image, or `dev` locally. */
  version: z.string().min(1),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
