import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('drops falsy values', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });

  it('lets the later conflicting Tailwind utility win', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
