import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

const VARIANTS = {
  primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
  outline: 'border border-neutral-300 bg-transparent hover:bg-neutral-100',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
