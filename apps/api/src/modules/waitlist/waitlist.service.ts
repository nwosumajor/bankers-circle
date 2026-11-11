import { Injectable, Logger } from '@nestjs/common';
import { WAITLIST_POLICY_VERSION, type WaitlistSignupRequest } from '@circle/contracts';
import { newId } from '../../common/ids';
import { ProblemError } from '../../common/problem';
import { WaitlistRepository } from './waitlist.repository';

export type WaitlistOutcome = 'ADDED' | 'ALREADY_LISTED' | 'DROPPED_AS_BOT';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(private readonly repository: WaitlistRepository) {}

  /**
   * Records a waitlist signup. Callers must give every outcome the same response, so the endpoint
   * cannot be used to test whether an email is on the list.
   */
  async register(request: WaitlistSignupRequest, now: Date = new Date()): Promise<WaitlistOutcome> {
    if (request.website !== undefined && request.website.trim() !== '') {
      this.logger.warn('waitlist honeypot triggered; signup dropped');
      return 'DROPPED_AS_BOT';
    }
    if (request.policyVersion !== WAITLIST_POLICY_VERSION) {
      throw new ProblemError(
        409,
        'POLICY_VERSION_OUTDATED',
        'The privacy notice has changed',
        'Reload the page to see the current privacy notice, then try again.',
      );
    }

    const added = await this.repository.insertIfAbsent({
      id: newId(),
      email: request.email,
      firstName: request.firstName ?? null,
      subSector: request.subSector,
      area: request.area,
      interests: request.interests,
      consentPolicyVersion: request.policyVersion,
      consentedAt: now,
    });
    return added ? 'ADDED' : 'ALREADY_LISTED';
  }
}
