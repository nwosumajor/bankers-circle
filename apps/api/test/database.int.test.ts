import { startPostgres, type StartedPostgreSqlContainer } from '@circle/test-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/database/prisma.service';

describe('PrismaService against real PostgreSQL', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;

  beforeAll(async () => {
    container = await startPostgres();
    prisma = new PrismaService(container.getConnectionUri());
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
    await container.stop();
  });

  it('connects and runs on PostgreSQL 17', async () => {
    const rows = await prisma.$queryRaw<{ server_version: string }[]>`SHOW server_version`;
    expect(rows[0]?.server_version).toMatch(/^17\./);
  });
});
