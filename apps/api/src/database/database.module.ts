import { Global, Module } from '@nestjs/common';
import { parseEnv } from '../config/env';
import { DATABASE_URL, PrismaService } from './prisma.service';

/** Not imported by AppModule until Phase 1 adds the first tables, so the API boots without a DB. */
@Global()
@Module({
  providers: [
    {
      provide: DATABASE_URL,
      useFactory: (): string => {
        const url = parseEnv(process.env).DATABASE_URL;
        if (url === undefined) {
          throw new Error('DATABASE_URL is required when DatabaseModule is loaded');
        }
        return url;
      },
    },
    PrismaService,
  ],
  exports: [PrismaService],
})
export class DatabaseModule {}
