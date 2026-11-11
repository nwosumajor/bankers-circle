import {
  ProblemSchema,
  WAITLIST_POLICY_VERSION,
  WaitlistSignupResponseSchema,
} from '@circle/contracts';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, TEST_ORIGIN, type TestApp } from './support/test-app';

const validBody = {
  email: 'Ada.Obi@example.com',
  firstName: 'Ada',
  subSector: 'FINTECH',
  area: 'LEKKI',
  interests: ['NETWORKING'],
  consent: true,
  policyVersion: WAITLIST_POLICY_VERSION,
};

describe('POST /v1/waitlist', () => {
  let t: TestApp;

  // A fresh app per test keeps the in-memory rate limiter and store isolated.
  beforeEach(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.app.close();
  });

  const post = (body: unknown) =>
    request(t.server)
      .post('/v1/waitlist')
      .send(body as object);

  it('accepts a valid signup and stores the normalised email with consent details', async () => {
    const res = await post(validBody).expect(202);
    expect(WaitlistSignupResponseSchema.parse(res.body)).toEqual({ status: 'received' });
    expect(t.waitlist.rows).toHaveLength(1);
    expect(t.waitlist.rows[0]).toMatchObject({
      email: 'ada.obi@example.com',
      consentPolicyVersion: WAITLIST_POLICY_VERSION,
    });
    expect(t.waitlist.rows[0]?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/);
  });

  it('gives a duplicate email the identical response and keeps the first answers', async () => {
    const first = await post(validBody).expect(202);
    const second = await post({ ...validBody, email: 'ADA.OBI@example.com', area: 'IKEJA' }).expect(
      202,
    );
    expect(second.body).toEqual(first.body);
    expect(t.waitlist.rows).toHaveLength(1);
    expect(t.waitlist.rows[0]?.area).toBe('LEKKI');
  });

  it('gives a honeypot submission the identical response but stores nothing', async () => {
    const res = await post({ ...validBody, website: 'http://spam.example' }).expect(202);
    expect(res.body).toEqual({ status: 'received' });
    expect(t.waitlist.rows).toHaveLength(0);
  });

  it('returns problem+json with field errors for invalid input', async () => {
    const res = await post({ ...validBody, email: 'nope', interests: [] })
      .expect(400)
      .expect('content-type', /application\/problem\+json/);
    expect(ProblemSchema.parse(res.body).code).toBe('VALIDATION_FAILED');
    const paths = (res.body as { errors: { path: string }[] }).errors.map((e) => e.path);
    expect(paths).toEqual(expect.arrayContaining(['email', 'interests']));
    expect(t.waitlist.rows).toHaveLength(0);
  });

  it('rejects signups that agreed to an outdated privacy notice', async () => {
    const res = await post({ ...validBody, policyVersion: '2000-01-01' }).expect(409);
    expect(res.body).toMatchObject({ code: 'POLICY_VERSION_OUTDATED' });
    expect(t.waitlist.rows).toHaveLength(0);
  });

  it('rate-limits a single client after 10 signups a minute', async () => {
    for (let i = 0; i < 10; i += 1) {
      await post({ ...validBody, email: `user${i}@example.com` }).expect(202);
    }
    const res = await post({ ...validBody, email: 'user10@example.com' }).expect(429);
    expect(res.body).toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('allows the web origin through CORS and not others', async () => {
    const allowed = await request(t.server)
      .options('/v1/waitlist')
      .set('Origin', TEST_ORIGIN)
      .set('Access-Control-Request-Method', 'POST');
    expect(allowed.headers['access-control-allow-origin']).toBe(TEST_ORIGIN);

    const denied = await request(t.server)
      .options('/v1/waitlist')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});
