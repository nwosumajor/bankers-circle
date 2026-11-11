/** ISO 4217 currencies the platform transacts in. */
export type Currency = 'NGN';

/** Money is always integer minor units (kobo for NGN). Never floats. */
export interface Money {
  readonly amountMinor: number;
  readonly currency: Currency;
}

export class InvalidMoneyError extends Error {
  override readonly name = 'InvalidMoneyError';
}

export function money(amountMinor: number, currency: Currency = 'NGN'): Money {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new InvalidMoneyError(`Amount must be a safe integer in minor units, got ${amountMinor}`);
  }
  return { amountMinor, currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    // String() keeps the message useful once Currency has more than one member.
    throw new InvalidMoneyError(`Cannot add ${String(a.currency)} to ${String(b.currency)}`);
  }
  return money(a.amountMinor + b.amountMinor, a.currency);
}
