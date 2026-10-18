import { Request, Response, NextFunction } from 'express'
import { logger } from './logger.middleware.js'

// ==========================================
// Custom Error Classes
// ==========================================

/**
 * Operational (expected) application error. Message is safe to return
 * to the client; stack traces never leave the server.
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500)
    this.name = 'DatabaseError'
  }
}

// ==========================================
// Global Error Handler Middleware
// ==========================================

// PostgreSQL SQLSTATE codes we can map to meaningful client responses.
// Anything else stays a generic 500 so internals are never leaked.
const PG_ERROR_RESPONSES: Record<string, { statusCode: number; message: string }> = {
  '23505': { statusCode: 409, message: 'Resource already exists' },
  '23503': { statusCode: 400, message: 'Referenced resource does not exist' },
  '23502': { statusCode: 400, message: 'Required field is missing' },
  '23514': { statusCode: 400, message: 'Value violates a database constraint' },
  '22P02': { statusCode: 400, message: 'Invalid data format' },
  '22001': { statusCode: 400, message: 'Value is too long' },
  '22003': { statusCode: 400, message: 'Numeric value is out of range' },
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If the response was already partially sent (streaming, etc.) the
  // only correct move is to delegate to Express' default handler.
  if (res.headersSent) {
    return next(err)
  }

  let statusCode = 500
  let message = 'Internal Server Error'

  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  } else if (err.name === 'ValidationError') {
    statusCode = 400
    message = err.message
  } else {
    // PostgreSQL SQLSTATE errors (DatabaseError is operational and handled above)
    const code = (err as { code?: unknown }).code
    if (typeof code === 'string' && PG_ERROR_RESPONSES[code]) {
      statusCode = PG_ERROR_RESPONSES[code].statusCode
      message = PG_ERROR_RESPONSES[code].message
    }
  }

  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    })
  } else {
    logger.warn('Request error', {
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      statusCode,
    })
  }

  const errorResponse: Record<string, unknown> = {
    success: false,
    message,
  }

  // Stack traces are exposed only in development, never in production.
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.message
    errorResponse.stack = err.stack
  }

  res.status(statusCode).json(errorResponse)
}

// ==========================================
// 404 Handler
// ==========================================

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`))
}

// ==========================================
// Async Handler Wrapper
// ==========================================

/**
 * Wraps async route handlers so rejected promises are forwarded to the
 * global error handler instead of becoming unhandled rejections.
 */
export const asyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as T, res, next)).catch(next)
  }
}
