import { type WaitlistSignupInput, WaitlistSignupRequestSchema } from '@circle/contracts';

export type FieldErrors = Partial<Record<string, string>>;

export type SubmitResult =
  | { kind: 'success' }
  | { kind: 'invalid'; fieldErrors: FieldErrors }
  | { kind: 'error'; message: string };

const MESSAGES = {
  rateLimited: 'Too many attempts from your connection. Wait a minute, then try again.',
  policyChanged:
    'Our privacy notice was just updated. Reload the page to read it, then join again.',
  network: 'We couldn’t reach the server. Check your connection and try again.',
  unexpected: 'Something went wrong on our side. Try again in a few minutes.',
} as const;

/** First message per field, keyed by the top-level field name. */
export function toFieldErrors(issues: { path: string; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const { path, message } of issues) {
    const field = path.split('.')[0] ?? '';
    errors[field] ??= message;
  }
  return errors;
}

/**
 * Validates with the shared contract, then posts straight to the API so rate limiting sees the
 * visitor's own IP. Every accepted outcome looks the same to the visitor, by design.
 */
export async function submitWaitlist(
  input: WaitlistSignupInput,
  apiUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SubmitResult> {
  const parsed = WaitlistSignupRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      kind: 'invalid',
      fieldErrors: toFieldErrors(
        parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      ),
    };
  }

  let res: Response;
  try {
    res = await fetchImpl(`${apiUrl}/v1/waitlist`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { kind: 'error', message: MESSAGES.network };
  }

  if (res.status === 202) return { kind: 'success' };
  if (res.status === 429) return { kind: 'error', message: MESSAGES.rateLimited };
  if (res.status === 409) return { kind: 'error', message: MESSAGES.policyChanged };
  if (res.status === 400) {
    const body = (await res.json().catch(() => ({}))) as {
      errors?: { path: string; message: string }[];
    };
    return { kind: 'invalid', fieldErrors: toFieldErrors(body.errors ?? []) };
  }
  return { kind: 'error', message: MESSAGES.unexpected };
}
