import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ProblemFilter } from './common/problem.filter';
import { parseEnv } from './config/env';
import { APP_VERSION } from './config/tokens';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { WaitlistModule } from './modules/waitlist/waitlist.module';

@Module({
  imports: [
    // In-memory counters: fine for a single API instance. Move to Redis storage before scaling out.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    WaitlistModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_VERSION, useFactory: () => parseEnv(process.env).GIT_SHA },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: ProblemFilter },
  ],
})
export class AppModule {}
