import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface NewWaitlistSignup {
  id: string;
  email: string;
  firstName: string | null;
  subSector: string;
  area: string;
  interests: string[];
  consentPolicyVersion: string;
  consentedAt: Date;
}

@Injectable()
export class WaitlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inserts the signup unless the email is already on the list. The first signup wins, so nobody can
   * overwrite someone else's answers by re-submitting their email. Returns whether a row was added.
   */
  async insertIfAbsent(signup: NewWaitlistSignup): Promise<boolean> {
    const { count } = await this.prisma.waitlistSignup.createMany({
      data: [signup],
      skipDuplicates: true,
    });
    return count === 1;
  }
}
