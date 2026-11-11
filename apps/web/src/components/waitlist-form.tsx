'use client';

import {
  WAITLIST_AREAS,
  WAITLIST_INTERESTS,
  WAITLIST_POLICY_VERSION,
  WAITLIST_SUB_SECTORS,
  type WaitlistSignupInput,
} from '@circle/contracts';
import { Button, cn } from '@circle/ui-web';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { type FieldErrors, submitWaitlist } from '@/lib/waitlist-client';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

type Status =
  { kind: 'idle' } | { kind: 'submitting' } | { kind: 'done' } | { kind: 'error'; message: string };

const fieldClass =
  'block w-full rounded-[3px] border border-hairline bg-paper px-3 py-2.5 text-base text-ink ' +
  'focus:border-engrave focus:outline-2 focus:outline-offset-1 focus:outline-engrave';

function readForm(form: HTMLFormElement): WaitlistSignupInput {
  const data = new FormData(form);
  const text = (name: string) => {
    const value = data.get(name);
    return typeof value === 'string' ? value : '';
  };
  return {
    email: text('email'),
    firstName: text('firstName'),
    subSector: text('subSector') as WaitlistSignupInput['subSector'],
    area: text('area') as WaitlistSignupInput['area'],
    interests: data
      .getAll('interests')
      .filter((v): v is string => typeof v === 'string') as WaitlistSignupInput['interests'],
    consent: (data.get('consent') === 'on') as true,
    policyVersion: WAITLIST_POLICY_VERSION,
    website: text('website'),
  };
}

export function WaitlistForm() {
  const id = useId();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [email, setEmail] = useState('');
  const doneRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (status.kind === 'done') doneRef.current?.focus();
  }, [status.kind]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = readForm(event.currentTarget);
    setStatus({ kind: 'submitting' });
    const result = await submitWaitlist(input, API_URL);
    if (result.kind === 'success') {
      setEmail(input.email.trim());
      setErrors({});
      setStatus({ kind: 'done' });
      return;
    }
    if (result.kind === 'invalid') {
      setErrors(result.fieldErrors);
      setStatus({ kind: 'idle' });
      const first = Object.keys(result.fieldErrors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus({ kind: 'error', message: result.message });
  }

  if (status.kind === 'done') {
    return (
      <div className="space-y-3" role="status">
        <h3 ref={doneRef} tabIndex={-1} className="font-display text-3xl text-ink outline-none">
          You’re on the list.
        </h3>
        <p className="max-w-prose text-ink-soft">
          We’ll email <span className="font-medium text-ink">{email}</span> when invitations open in
          your area. Nothing else until then.
        </p>
      </div>
    );
  }

  const describedBy = (name: string, hint?: string) =>
    [hint, errors[name] ? `${id}-${name}-error` : undefined].filter(Boolean).join(' ') || undefined;
  const errorText = (name: string) =>
    errors[name] ? (
      <p id={`${id}-${name}-error`} className="mt-1.5 text-sm break-words text-alert">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form ref={formRef} noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-email`} className="mb-1.5 block font-medium text-ink">
            Email
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            aria-invalid={errors['email'] ? true : undefined}
            aria-describedby={describedBy('email', `${id}-email-hint`)}
            className={fieldClass}
          />
          <p id={`${id}-email-hint`} className="mt-1.5 text-sm text-ink-soft">
            A personal address works best. You’ll verify your work email later.
          </p>
          {errorText('email')}
        </div>
        <div>
          <label htmlFor={`${id}-firstName`} className="mb-1.5 block font-medium text-ink">
            First name <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input
            id={`${id}-firstName`}
            name="firstName"
            type="text"
            autoComplete="given-name"
            maxLength={50}
            aria-invalid={errors['firstName'] ? true : undefined}
            aria-describedby={describedBy('firstName')}
            className={fieldClass}
          />
          {errorText('firstName')}
        </div>
        <div>
          <label htmlFor={`${id}-subSector`} className="mb-1.5 block font-medium text-ink">
            Where you work
          </label>
          <select
            id={`${id}-subSector`}
            name="subSector"
            required
            defaultValue=""
            aria-invalid={errors['subSector'] ? true : undefined}
            aria-describedby={describedBy('subSector')}
            className={fieldClass}
          >
            <option value="" disabled>
              Choose your sector
            </option>
            {Object.entries(WAITLIST_SUB_SECTORS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errorText('subSector')}
        </div>
        <div>
          <label htmlFor={`${id}-area`} className="mb-1.5 block font-medium text-ink">
            Where you’re based
          </label>
          <select
            id={`${id}-area`}
            name="area"
            required
            defaultValue=""
            aria-invalid={errors['area'] ? true : undefined}
            aria-describedby={describedBy('area')}
            className={fieldClass}
          >
            <option value="" disabled>
              Choose an area
            </option>
            {Object.entries(WAITLIST_AREAS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errorText('area')}
        </div>
      </div>

      <fieldset aria-describedby={describedBy('interests')}>
        <legend className="mb-2.5 font-medium text-ink">What would you come for?</legend>
        <div className="flex flex-wrap gap-2.5">
          {Object.entries(WAITLIST_INTERESTS).map(([value, label]) => (
            <label key={value} className="chip">
              <input type="checkbox" name="interests" value={value} className="peer sr-only" />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {errorText('interests')}
      </fieldset>

      {/* Honeypot: invisible to people and assistive tech, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex items-start gap-3 text-ink">
          <input
            type="checkbox"
            name="consent"
            aria-invalid={errors['consent'] ? true : undefined}
            aria-describedby={describedBy('consent')}
            className="mt-1 size-4 shrink-0 accent-engrave"
          />
          <span>
            I agree to the{' '}
            <a href="/privacy" className="link">
              waitlist privacy notice
            </a>{' '}
            and to be emailed about the launch.
          </span>
        </label>
        {errorText('consent')}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          disabled={status.kind === 'submitting'}
          className={cn('h-12 rounded-[3px] bg-ink px-6 text-base text-paper hover:bg-engrave')}
        >
          {status.kind === 'submitting' ? 'Joining…' : 'Join the waitlist'}
        </Button>
        {status.kind === 'error' ? (
          <p role="alert" className="text-sm text-alert">
            {status.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
