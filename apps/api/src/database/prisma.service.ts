import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/** DI token for the runtime connection string (the Supavisor pooler in staging/prod). */
export const DATABASE_URL = Symbol('DATABASE_URL');

/**
 * Single Prisma client for the process. Modules get it through their own repositories,
 * never by reaching into another module's tables (CLAUDE.md §5.1).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(DATABASE_URL) connectionString: string) {
    super({ adapter: new PrismaPg(connectionString) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
