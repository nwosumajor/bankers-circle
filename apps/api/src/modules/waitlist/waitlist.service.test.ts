import { WAITLIST_POLICY_VERSION, type WaitlistSignupRequest } from '@circle/contracts';
import { describe, expect, it } from 'vitest';
import { ProblemError } from '../../common/problem';
import type { NewWaitlistSignup, WaitlistRepository } from './waitlist.repository';
import { WaitlistService } from './waitlist.service';

const NOW = new Date('2026-11-11T12:00:00.000Z');

const request: WaitlistSignupRequest = {
  email: 'ada@example.com',
  firstName: undefined,
  subSector: 'COMMERCIAL_BANK',
  area: 'IKOYI',
  interests: ['FRIENDSHIP', 'EVENTS_ONLY'],
  consent: true,
  policyVersion: WAITLIST_POLICY_VERSION,
};

function setup(insertResult = true) {
  const inserted: NewWaitlistSignup[] = [];
  const repository = {
    insertIfAbsent: (s: NewWaitlistSignup) => {
      inserted.push(s);
      return Promise.resolve(insertResult);
    },
  } as unknown as WaitlistRepository;
  return { service: new WaitlistService(repository), inserted };
}

describe('WaitlistService.register', () => {
  it('stores the signup with consent time and a null first name when omitted', async () => {
    const { service, inserted } = setup();
    await expect(service.register(request, NOW)).resolves.toBe('ADDED');
    expect(inserted[0]).toMatchObject({
      email: 'ada@example.com',
      firstName: null,
      consentPolicyVersion: WAITLIST_POLICY_VERSION,
      consentedAt: NOW,
    });
  });

  it('reports an existing email without failing', async () => {
    const { service } = setup(false);
    await expect(service.register(request, NOW)).resolves.toBe('ALREADY_LISTED');
  });

  it('drops honeypot submissions before touching storage', async () => {
    const { service, inserted } = setup();
    await expect(service.register({ ...request, website: 'x' }, NOW)).resolves.toBe(
      'DROPPED_AS_BOT',
    );
    expect(inserted).toHaveLength(0);
  });

  it('ignores a whitespace-only honeypot (autofill noise)', async () => {
    const { service } = setup();
    await expect(service.register({ ...request, website: '  ' }, NOW)).resolves.toBe('ADDED');
  });

  it('rejects an outdated policy version', async () => {
    const { service, inserted } = setup();
    await expect(service.register({ ...request, policyVersion: 'old' }, NOW)).rejects.toMatchObject(
      {
        code: 'POLICY_VERSION_OUTDATED',
      } satisfies Partial<ProblemError>,
    );
    expect(inserted).toHaveLength(0);
  });
});
