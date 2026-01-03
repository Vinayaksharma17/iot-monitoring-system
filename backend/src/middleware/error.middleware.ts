import { Request, Response, NextFunction } from 'express'
import { logger } from './logger.middleware.js'

// ==========================================
// Custom Error Class
// ==========================================

/**
 * Custom application error class
 */
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// ==========================================
// Error Types
// ==========================================

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
    this.name = 'ValidationError'
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
// Error Handler Middleware
// ==========================================

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error values
  let statusCode = 500
  let message = 'Internal Server Error'
  let isOperational = false

  // Check if it's an AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    isOperational = err.isOperational
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = err.message
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // PostgreSQL specific errors
  if ('code' in err) {
    const pgError = err as any

    if (pgError.code === '23505') {
      // Unique violation
      statusCode = 409
      message = 'Resource already exists'
    }

    if (pgError.code === '23503') {
      // Foreign key violation
      statusCode = 400
      message = 'Referenced resource does not exist'
    }

    if (pgError.code === '23502') {
      // Not null violation
      statusCode = 400
      message = 'Required field is missing'
    }

    if (pgError.code === '22P02') {
      // Invalid text representation
      statusCode = 400
      message = 'Invalid data format'
    }
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
    })
  } else {
    logger.warn('Client Error:', {
      message: err.message,
      url: req.url,
      method: req.method,
      statusCode,
    })
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  }

  res.status(statusCode).json(errorResponse)
}

// ==========================================
// 404 Handler
// ==========================================

/**
 * Handle 404 - Route not found
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new NotFoundError(`Route ${req.method} ${req.url} not found`)
  next(error)
}

// ==========================================
// Async Handler Wrapper
// ==========================================

/**
 * Wrapper for async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
