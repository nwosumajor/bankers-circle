import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { pino } from 'pino';
import { parseEnv } from './config/env.js';
import { processPing, SYSTEM_QUEUE } from './processors/system.js';

const env = parseEnv(process.env);
const logger = pino({ level: env.LOG_LEVEL, base: { service: 'worker', version: env.GIT_SHA } });

// BullMQ workers require maxRetriesPerRequest: null so blocking commands are not aborted.
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

const systemWorker = new Worker(
  SYSTEM_QUEUE,
  (job) => Promise.resolve(processPing(job.data, new Date())),
  {
    connection,
  },
);

systemWorker.on('failed', (job, err) => {
  logger.error({ err, jobId: job?.id, queue: SYSTEM_QUEUE }, 'job failed');
});

logger.info({ queues: [SYSTEM_QUEUE] }, 'worker started');

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'shutting down');
  await systemWorker.close();
  await connection.quit();
  process.exit(0);
}

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => void shutdown(signal));
}
