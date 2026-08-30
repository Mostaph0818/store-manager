import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Known application error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code || 'APP_ERROR',
    });
    return;
  }

  // Zod validation error
  if (err instanceof ZodError) {
    const messages = err.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    res.status(422).json({
      success: false,
      message: `Validation error: ${messages}`,
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[])?.join(', ') || 'field';
      res.status(409).json({
        success: false,
        message: `A record with this ${fields} already exists.`,
        code: 'DUPLICATE_ENTRY',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found.',
        code: 'NOT_FOUND',
      });
      return;
    }
  }

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      message: 'CORS: Origin not allowed.',
      code: 'CORS_ERROR',
    });
    return;
  }

  // Unknown error — never leak stack traces in production
  console.error('[ERROR]', {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An internal server error occurred.'
        : err.message,
    code: 'INTERNAL_SERVER_ERROR',
  });
}
