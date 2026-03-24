import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from './api-error.type';

/**
 * Unified API error response shape returned by this filter:
 *
 * {
 *   statusCode: number;           // HTTP status code (e.g. 400, 401, 429, 500)
 *   code: string;                 // App-level error code (e.g. VALIDATION_ERROR, UNAUTHORIZED, RATE_LIMITED)
 *   message: string;              // Human-readable error message
 *   details?: Array<{             // Optional structured details (mainly validation/domain errors)
 *     field?: string;             // Optional field name (e.g. "password")
 *     message: string;            // Detail message for that field/item
 *   }>;
 *   path: string;                 // Request URL path (e.g. "/auth/register")
 *   timestamp: string;            // ISO timestamp when error response was generated
 * }
 *
 * Example (validation):
 * {
 *   "statusCode": 400,
 *   "code": "VALIDATION_ERROR",
 *   "message": "Validation failed",
 *   "details": [{ "field": "password", "message": "Password must be at least 6 characters" }],
 *   "path": "/auth/register",
 *   "timestamp": "2026-03-24T12:34:56.789Z"
 * }
 */

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const statusCode = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttp ? exception.getResponse() : null;

    const { code, message, details } = this.normalizeError(
      statusCode,
      exceptionResponse,
    );

    const payload: ApiErrorResponse = {
      statusCode,
      code,
      message,
      ...(details?.length ? { details } : {}),
      path: req.url,
      timestamp: new Date().toISOString(),
    };

    res.status(statusCode).json(payload);
  }

  private normalizeError(statusCode: number, exceptionResponse: unknown) {
    const defaultCodeByStatus: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_SERVER_ERROR',
    };

    const fallbackCode = defaultCodeByStatus[statusCode] ?? 'UNKNOWN_ERROR';
    const fallbackMessage =
      statusCode === 500 ? 'Internal server error' : 'Request failed';

    if (typeof exceptionResponse === 'string') {
      return {
        code: fallbackCode,
        message: exceptionResponse,
        details: undefined,
      };
    }

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const obj = exceptionResponse as Record<string, unknown>;
      const code = typeof obj.code === 'string' ? obj.code : fallbackCode;

      if (Array.isArray(obj.message)) {
        // ValidationPipe default array format
        return {
          code: code === 'BAD_REQUEST' ? 'VALIDATION_ERROR' : code,
          message: 'Validation failed',
          details: obj.message
            .filter((m): m is string => typeof m === 'string')
            .map((m) => ({ message: m })),
        };
      }

      const message =
        typeof obj.message === 'string' ? obj.message : fallbackMessage;

      const details = Array.isArray(obj.details)
        ? (obj.details as Array<{ field?: string; message: string }>)
        : undefined;

      return { code, message, details };
    }

    return { code: fallbackCode, message: fallbackMessage, details: undefined };
  }
}
