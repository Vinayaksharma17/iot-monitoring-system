import { Request, Response, NextFunction } from 'express'
import { createHash, timingSafeEqual } from 'node:crypto'
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
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return next(
        new AppError('Authentication required. Please provide a bearer token.', 401)
      )
    }

    const [authType, token] = authHeader.split(' ')

    if (authType?.toLowerCase() !== 'bearer' || !token) {
      return next(
        new AppError('Invalid authentication format. Expected "Bearer <token>".', 401)
      )
    }

    const decoded = verifyAccessToken(token)

    if (!decoded.sub) {
      return next(new AppError('Invalid token', 401))
    }

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
 * Check if user has required role(s).
 * The response deliberately does not echo the caller's role back.
 */
export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401))
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Access denied. Insufficient permissions.', 403))
    }
    next()
  }
}

const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  admin: ['read', 'write', 'update', 'delete'],
  viewer: ['read'],
}

/**
 * Check if user has specific permissions.
 * admin has full access; viewer is read-only.
 */
export const checkPermissions = (...permissions: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401))
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] ?? []
    const hasAll = permissions.every((p) => userPermissions.includes(p))

    if (!hasAll) {
      return next(new AppError('Access denied. Insufficient permissions.', 403))
    }

    next()
  }
}

// ==========================================
// Machine / Ingestion API Key
// ==========================================

/**
 * Constant-time string comparison. Standard === on attacker-controlled
 * input leaks length/prefix information through response timing.
 * Both sides are hashed to a fixed length so timingSafeEqual is safe to
 * apply to inputs of different lengths.
 */
const constantTimeEquals = (a: string, b: string): boolean => {
  const hashA = createHash('sha256').update(a, 'utf8').digest()
  const hashB = createHash('sha256').update(b, 'utf8').digest()
  return timingSafeEqual(hashA, hashB)
}

/**
 * API-key guard for machine-to-machine endpoints.
 * When INGEST_API_KEY is configured, requests must send a matching
 * X-API-Key header. When it is not configured the guard is a no-op so
 * local development keeps working without extra setup.
 */
export const requireApiKey = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!authConfig.ingestApiKey) {
    return next()
  }

  const provided = req.headers['x-api-key']

  if (typeof provided !== 'string' || !constantTimeEquals(provided, authConfig.ingestApiKey)) {
    return next(new AppError('Invalid or missing API key', 401))
  }

  next()
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Optional authentication - attach user if a valid token is present.
 * Never fails the request; an invalid/missing token simply means
 * req.user stays unset.
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return next()
  }

  authenticateUser(req, res, () => next())
}
