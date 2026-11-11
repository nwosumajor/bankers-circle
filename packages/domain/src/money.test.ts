import { describe, expect, it } from 'vitest';
import { addMoney, InvalidMoneyError, money } from './money.js';

describe('money', () => {
  it('defaults to NGN', () => {
    expect(money(150_000)).toEqual({ amountMinor: 150_000, currency: 'NGN' });
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rejects non-integer or unsafe amount %s',
    (amount) => {
      expect(() => money(amount)).toThrow(InvalidMoneyError);
    },
  );

  it('adds amounts in the same currency', () => {
    expect(addMoney(money(100), money(250))).toEqual(money(350));
  });

  it('rejects a sum that overflows safe integers', () => {
    expect(() => addMoney(money(Number.MAX_SAFE_INTEGER), money(1))).toThrow(InvalidMoneyError);
  });
});
