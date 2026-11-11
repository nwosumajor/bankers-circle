import { describe, expect, it } from 'vitest';
import { WAITLIST_POLICY_VERSION, WaitlistSignupRequestSchema } from './waitlist.js';

const valid = {
  email: '  Ada.Obi@Example.com ',
  firstName: ' Ada ',
  subSector: 'FINTECH',
  area: 'LEKKI',
  interests: ['NETWORKING', 'MENTORSHIP'],
  consent: true,
  policyVersion: WAITLIST_POLICY_VERSION,
};

const parse = (overrides: Record<string, unknown>) =>
  WaitlistSignupRequestSchema.safeParse({ ...valid, ...overrides });

describe('WaitlistSignupRequestSchema', () => {
  it('normalises email and trims the name', () => {
    const result = WaitlistSignupRequestSchema.parse(valid);
    expect(result.email).toBe('ada.obi@example.com');
    expect(result.firstName).toBe('Ada');
  });

  it('treats an empty first name as absent', () => {
    expect(
      WaitlistSignupRequestSchema.parse({ ...valid, firstName: '  ' }).firstName,
    ).toBeUndefined();
  });

  it.each([
    ['an invalid email', { email: 'not-an-email' }],
    ['an over-long email', { email: `${'a'.repeat(250)}@x.co` }],
    ['an unknown sub-sector', { subSector: 'CRYPTO_EXCHANGE' }],
    ['an unknown area', { area: 'ACCRA' }],
    ['no interests', { interests: [] }],
    ['duplicate interests', { interests: ['FRIENDSHIP', 'FRIENDSHIP'] }],
    ['a sensitive relationship intention', { interests: ['SERIOUS_RELATIONSHIP'] }],
    ['missing consent', { consent: false }],
    ['an over-long first name', { firstName: 'x'.repeat(51) }],
  ])('rejects %s', (_label, overrides) => {
    expect(parse(overrides).success).toBe(false);
  });

  it('gives person-readable messages for missing choices', () => {
    const result = parse({ subSector: '', area: '' });
    const messages = result.success ? [] : result.error.issues.map((i) => i.message);
    expect(messages).toEqual([
      'Choose the part of financial services you work in',
      'Choose where you’re based',
    ]);
  });

  it('accepts a filled honeypot (the API drops it silently)', () => {
    expect(parse({ website: 'http://spam.example' }).success).toBe(true);
  });
});
