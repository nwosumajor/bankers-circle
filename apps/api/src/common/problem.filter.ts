import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ProblemError, type ProblemBody } from './problem';

/** Single place where errors become problem+json. Never leaks stack traces or internals. */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const body = this.toProblem(exception);
    body.instance = req.originalUrl;

    if (body.status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }
    res.status(body.status).type('application/problem+json').json(body);
  }

  private toProblem(exception: unknown): ProblemBody {
    if (exception instanceof ProblemError) {
      return {
        type: 'about:blank',
        title: exception.title,
        status: exception.status,
        code: exception.code,
        ...(exception.detail === undefined ? {} : { detail: exception.detail }),
        ...(exception.errors === undefined ? {} : { errors: exception.errors }),
      };
    }
    if (exception instanceof ThrottlerException) {
      return { type: 'about:blank', title: 'Too many requests', status: 429, code: 'RATE_LIMITED' };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        type: 'about:blank',
        title: status === 404 ? 'Not found' : exception.message,
        status,
        code: status === 404 ? 'NOT_FOUND' : `HTTP_${status}`,
      };
    }
    return {
      type: 'about:blank',
      title: 'Internal server error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL',
    };
  }
}
