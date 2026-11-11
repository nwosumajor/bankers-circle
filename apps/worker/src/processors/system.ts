import { z } from 'zod';

/** Queue for platform self-checks; real queues (media, notifications, ...) arrive with their modules. */
export const SYSTEM_QUEUE = 'system';

const PingJobSchema = z.object({ sentAt: z.iso.datetime() });

export interface PingResult {
  pong: true;
  /** Milliseconds between enqueue and processing; feeds the queue-lag metric later. */
  lagMs: number;
}

/** Pure processor so it can be unit tested without Redis. */
export function processPing(data: unknown, now: Date): PingResult {
  const { sentAt } = PingJobSchema.parse(data);
  return { pong: true, lagMs: Math.max(0, now.getTime() - Date.parse(sentAt)) };
}
