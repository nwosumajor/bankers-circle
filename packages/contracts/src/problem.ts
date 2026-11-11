import { z } from 'zod';

/**
 * RFC 9457 problem+json body. `code` is a stable, machine-readable string
 * (e.g. `CONNECTION_NOT_MUTUAL`) that clients branch on; `detail` is for humans.
 */
export const ProblemSchema = z.object({
  type: z.string().default('about:blank'),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  detail: z.string().optional(),
  instance: z.string().optional(),
});

export type Problem = z.infer<typeof ProblemSchema>;
