import { Module } from '@nestjs/common';
import { parseEnv } from './config/env';
import { APP_VERSION } from './config/tokens';
import { HealthController } from './health/health.controller';

@Module({
  controllers: [HealthController],
  providers: [{ provide: APP_VERSION, useFactory: () => parseEnv(process.env).GIT_SHA }],
})
export class AppModule {}
