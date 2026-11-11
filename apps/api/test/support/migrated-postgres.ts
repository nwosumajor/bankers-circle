import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startPostgres, type StartedPostgreSqlContainer } from '@circle/test-utils';

const run = promisify(execFile);

/** Starts PostgreSQL and applies the real migrations with the Prisma CLI, exactly as deploys do. */
export async function startMigratedPostgres(): Promise<StartedPostgreSqlContainer> {
  const container = await startPostgres();
  await run('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DIRECT_URL: container.getConnectionUri() },
  });
  return container;
}
