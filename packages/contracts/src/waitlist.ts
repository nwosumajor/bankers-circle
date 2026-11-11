import { z } from 'zod';

/**
 * Version of the waitlist privacy notice (apps/web /privacy). Bump it whenever the notice changes;
 * signups record the version they agreed to, and the API rejects an outdated one.
 */
export const WAITLIST_POLICY_VERSION = '2026-11-11';

/** Financial-services sub-sectors (CLAUDE.md §1.2). Labels are for display only. */
export const WAITLIST_SUB_SECTORS = {
  COMMERCIAL_BANK: 'Commercial bank',
  MERCHANT_BANK: 'Merchant bank',
  MICROFINANCE_BANK: 'Microfinance bank',
  FINTECH: 'Fintech',
  PAYMENTS: 'Payments company',
  INSURANCE: 'Insurance',
  ASSET_MANAGEMENT: 'Asset management',
  STOCKBROKING: 'Stockbroking',
  PENSIONS: 'Pension administration',
  DEVELOPMENT_FINANCE: 'Development finance',
  REGULATOR: 'Regulator',
  OTHER_FINANCIAL_SERVICES: 'Other financial services',
} as const;

export const WAITLIST_AREAS = {
  VICTORIA_ISLAND: 'Victoria Island',
  IKOYI: 'Ikoyi',
  LEKKI: 'Lekki',
  IKEJA: 'Ikeja',
  OTHER_LAGOS: 'Elsewhere in Lagos',
  ABUJA: 'Abuja',
  OTHER: 'Somewhere else',
} as const;

/**
 * A non-sensitive subset of member intentions (CLAUDE.md §1.1 rule 1). Relationship intentions are
 * deliberately absent: they are sensitive data that needs separate explicit consent (§6.3).
 */
export const WAITLIST_INTERESTS = {
  FRIENDSHIP: 'Friendship',
  NETWORKING: 'Networking',
  MENTORSHIP: 'Mentorship',
  COMMUNITY: 'Communities',
  EVENTS_ONLY: 'Curated events',
} as const;

type Keys<T> = [keyof T & string, ...(keyof T & string)[]];
const keysOf = <T extends object>(o: T) => Object.keys(o) as Keys<T>;

// Messages are shown to people as-is, so they say what to do rather than list the enum values.
export const WaitlistSubSectorSchema = z.enum(keysOf(WAITLIST_SUB_SECTORS), {
  error: 'Choose the part of financial services you work in',
});
export const WaitlistAreaSchema = z.enum(keysOf(WAITLIST_AREAS), {
  error: 'Choose where you’re based',
});
export const WaitlistInterestSchema = z.enum(keysOf(WAITLIST_INTERESTS), {
  error: 'Choose from the listed options',
});

export const WaitlistSignupRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email({ error: 'Enter a valid email address' })),
  firstName: z
    .string()
    .trim()
    .max(50, 'Keep it under 50 characters')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  subSector: WaitlistSubSectorSchema,
  area: WaitlistAreaSchema,
  interests: z
    .array(WaitlistInterestSchema)
    .min(1, 'Pick at least one')
    .refine((a) => new Set(a).size === a.length, 'Duplicate interests'),
  /** Agreement to the privacy notice and to being contacted about the launch. */
  consent: z.literal(true, { error: 'Please agree to the privacy notice to join' }),
  policyVersion: z.string().min(1),
  /** Honeypot: hidden from people, filled in by bots. Non-empty means the signup is silently dropped. */
  website: z.string().max(200).optional(),
});

export type WaitlistSignupRequest = z.infer<typeof WaitlistSignupRequestSchema>;
export type WaitlistSignupInput = z.input<typeof WaitlistSignupRequestSchema>;

/**
 * Same response for new, duplicate and honeypot signups, so the endpoint never reveals whether an
 * email is already on the list.
 */
export const WaitlistSignupResponseSchema = z.object({ status: z.literal('received') });
export type WaitlistSignupResponse = z.infer<typeof WaitlistSignupResponseSchema>;
