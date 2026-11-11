import { Controller, Get, Inject } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { HealthResponse } from '@circle/contracts';
import { APP_VERSION } from '../config/tokens';

/** Liveness only: must not touch the database, so a DB blip doesn't make Render restart the API. */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(@Inject(APP_VERSION) private readonly version: string) {}

  @Get()
  get(): HealthResponse {
    return { status: 'ok', service: 'api', version: this.version };
  }
}
