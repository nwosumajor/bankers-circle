import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { StartedPostgreSqlContainer } from '@circle/test-utils';
import { newId } from '../src/common/ids';
import { PrismaService } from '../src/database/prisma.service';
import {
  type NewWaitlistSignup,
  WaitlistRepository,
} from '../src/modules/waitlist/waitlist.repository';
import { startMigratedPostgres } from './support/migrated-postgres';

const signup = (email: string, area = 'LEKKI'): NewWaitlistSignup => ({
  id: newId(),
  email,
  firstName: null,
  subSector: 'FINTECH',
  area,
  interests: ['NETWORKING'],
  consentPolicyVersion: '2026-11-11',
  consentedAt: new Date('2026-11-11T12:00:00.000Z'),
});

describe('database (PostgreSQL 17, real migrations)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
  let waitlist: WaitlistRepository;

  beforeAll(async () => {
    container = await startMigratedPostgres();
    prisma = new PrismaService(container.getConnectionUri());
    await prisma.onModuleInit();
    waitlist = new WaitlistRepository(prisma);
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
    await container.stop();
  });

  it('runs on PostgreSQL 17', async () => {
    const rows = await prisma.$queryRaw<{ server_version: string }[]>`SHOW server_version`;
    expect(rows[0]?.server_version).toMatch(/^17\./);
  });

  it('inserts a signup once and keeps the first answers for a case-variant email', async () => {
    await expect(waitlist.insertIfAbsent(signup('kemi@example.com'))).resolves.toBe(true);
    await expect(waitlist.insertIfAbsent(signup('KEMI@Example.com', 'IKEJA'))).resolves.toBe(false);

    const rows = await prisma.waitlistSignup.findMany({ where: { email: 'kemi@example.com' } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.area).toBe('LEKKI');
    expect(rows[0]?.emailConfirmedAt).toBeNull();
  });

  it('handles concurrent duplicate signups without errors', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => waitlist.insertIfAbsent(signup('race@example.com'))),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
  });
});
