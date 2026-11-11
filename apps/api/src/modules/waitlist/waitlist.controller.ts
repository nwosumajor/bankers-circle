import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type WaitlistSignupRequest,
  WaitlistSignupRequestSchema,
  type WaitlistSignupResponse,
} from '@circle/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { WaitlistService } from './waitlist.service';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  /** 202 for every accepted outcome (new, duplicate, bot) so the response leaks nothing. */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async signUp(
    @Body(new ZodValidationPipe(WaitlistSignupRequestSchema)) body: WaitlistSignupRequest,
  ): Promise<WaitlistSignupResponse> {
    await this.waitlist.register(body);
    return { status: 'received' };
  }
}
