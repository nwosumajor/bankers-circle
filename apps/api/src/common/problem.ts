import type { Problem } from '@circle/contracts';

/**
 * A typed, expected error. The ProblemFilter turns it into RFC 9457 problem+json with a stable `code`
 * that clients branch on (CLAUDE.md §5.3).
 */
export class ProblemError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly title: string,
    readonly detail?: string,
    readonly errors?: ProblemFieldError[],
  ) {
    super(detail ?? title);
    this.name = 'ProblemError';
  }
}

export interface ProblemFieldError {
  path: string;
  message: string;
}

export type ProblemBody = Problem & { errors?: ProblemFieldError[] };
