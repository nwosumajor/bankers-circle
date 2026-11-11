import { type PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { ProblemError } from './problem';

/** Validates a request part against a schema from @circle/contracts and returns the parsed value. */
export class ZodValidationPipe<S extends z.ZodType> implements PipeTransform<unknown, z.output<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.output<S> {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }
    throw new ProblemError(
      400,
      'VALIDATION_FAILED',
      'Request validation failed',
      undefined,
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }
}
