import { WAITLIST_POLICY_VERSION, type WaitlistSignupInput } from '@circle/contracts';
import { describe, expect, it, vi } from 'vitest';
import { submitWaitlist, toFieldErrors } from './waitlist-client';

const input: WaitlistSignupInput = {
  email: 'ada@example.com',
  subSector: 'FINTECH',
  area: 'LEKKI',
  interests: ['NETWORKING'],
  consent: true,
  policyVersion: WAITLIST_POLICY_VERSION,
};

const respond = (status: number, body: unknown = {}) =>
  vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe('submitWaitlist', () => {
  it('posts the parsed body to the API', async () => {
    const fetchImpl = respond(202, { status: 'received' });
    await expect(submitWaitlist(input, 'https://api.test', fetchImpl)).resolves.toEqual({
      kind: 'success',
    });
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe('https://api.test/v1/waitlist');
    expect(JSON.parse(init?.body as string)).toMatchObject({ email: 'ada@example.com' });
  });

  it('validates locally and never calls the API with bad input', async () => {
    const fetchImpl = respond(202);
    const result = await submitWaitlist({ ...input, email: 'nope' }, 'https://api.test', fetchImpl);
    expect(result.kind).toBe('invalid');
    expect(result.kind === 'invalid' && result.fieldErrors['email']).toBeTruthy();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps server-side field errors', async () => {
    const fetchImpl = respond(400, { errors: [{ path: 'area', message: 'Pick an area' }] });
    await expect(submitWaitlist(input, 'https://api.test', fetchImpl)).resolves.toEqual({
      kind: 'invalid',
      fieldErrors: { area: 'Pick an area' },
    });
  });

  it.each([
    [429, /Too many attempts/],
    [409, /privacy notice was just updated/],
    [500, /Something went wrong/],
  ])('explains HTTP %i', async (status, message) => {
    const result = await submitWaitlist(input, 'https://api.test', respond(status));
    expect(result.kind === 'error' ? result.message : '').toMatch(message);
  });

  it('explains a network failure', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed'));
    const result = await submitWaitlist(input, 'https://api.test', fetchImpl);
    expect(result.kind === 'error' ? result.message : '').toMatch(/couldn’t reach/);
  });
});

describe('toFieldErrors', () => {
  it('keeps the first message per top-level field', () => {
    expect(
      toFieldErrors([
        { path: 'interests.0', message: 'first' },
        { path: 'interests', message: 'second' },
      ]),
    ).toEqual({ interests: 'first' });
  });
});
