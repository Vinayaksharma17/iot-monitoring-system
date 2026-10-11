import { Request, Response, NextFunction } from 'express'
import { AppError } from './error.middleware.js'
import { verifyAccessToken } from '../utils/token.js'
import { authConfig, UserRole } from '../config/auth.js'

// ==========================================
// Extended Request Interface with User
// ==========================================

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: UserRole
  }
}

// ==========================================
// Authentication Middleware
// ==========================================

/**
 * Authenticate user - verify JWT access token and attach user to request.
 * Requires an "Authorization: Bearer <token>" header.
 */
export const authenticateUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      throw new AppError(
        'Authentication required. Please provide a bearer token.',
        401
      )
    }

    const [authType, token] = authHeader.split(' ')

    if (authType?.toLowerCase() !== 'bearer' || !token) {
      throw new AppError(
        'Invalid authentication format. Expected "Bearer <token>".',
        401
      )
    }

    const decoded = verifyAccessToken(token)

    req.user = {
      id: String(decoded.sub),
      email: decoded.email,
      role: decoded.role,
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      return next(error)
    }
    // jsonwebtoken throws TokenExpiredError / JsonWebTokenError
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401))
    }
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401))
    }
    next(new AppError('Authentication failed', 401))
  }
}

// ==========================================
// Authorization Middleware
// ==========================================

/**
 * Check if user has required role(s)
 * @param roles - Array of allowed roles
 */
export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401)
      }

      if (!roles.includes(req.user.role)) {
        throw new AppError(
          `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
          403
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Check if user has specific permissions.
 * admin has full access; viewer is read-only.
 * @param permissions - Array of required permissions
 */
export const checkPermissions = (...permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401)
      }

      const userPermissions =
        req.user.role === 'admin'
          ? ['read', 'write', 'update', 'delete']
          : ['read']

      const hasAllPermissions = permissions.every((permission) =>
        userPermissions.includes(permission)
      )

      if (!hasAllPermissions) {
        throw new AppError(
          `Access denied. Required permission(s): ${permissions.join(', ')}`,
          403
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// ==========================================
// Machine / Ingestion API Key
// ==========================================

/**
 * Optional API-key guard for machine-to-machine ingestion endpoints.
 * When INGEST_API_KEY is configured, requests must send a matching
 * X-API-Key header. When it is not configured, the guard is a no-op.
 */
export const requireApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!authConfig.ingestApiKey) {
    return next()
  }

  const provided = req.headers['x-api-key']

  if (provided !== authConfig.ingestApiKey) {
    return next(new AppError('Invalid or missing API key', 401))
  }

  next()
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Optional authentication - attach user if a valid token is present, but don't fail.
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return next()
  }

  authenticateUser(req, res, (err?: any) => {
    // Never block the request on optional auth
    next()
  })
}
