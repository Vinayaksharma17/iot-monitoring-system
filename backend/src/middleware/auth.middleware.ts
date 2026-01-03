import { Request, Response, NextFunction } from 'express'
import { AppError } from './error.middleware.js'

// ==========================================
// Extended Request Interface with User
// ==========================================

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    [key: string]: any
  }
}

// ==========================================
// Authentication Middleware
// ==========================================

/**
 * Authenticate user - verify token and attach user to request
 * In production, this would verify JWT tokens
 * For now, this is a placeholder that checks for basic auth header
 */
export const authenticateUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader) {
      throw new AppError(
        'Authentication required. Please provide credentials.',
        401
      )
    }

    // Parse authorization header
    // Expected format: "Bearer <token>" or "Basic <base64>"
    const [authType, authCredentials] = authHeader.split(' ')

    if (!authType || !authCredentials) {
      throw new AppError('Invalid authentication format', 401)
    }

    // For demonstration: Basic Auth simulation
    // In production, replace with JWT verification
    if (authType.toLowerCase() === 'bearer') {
      // TODO: Implement JWT verification
      // const decoded = jwt.verify(authCredentials, process.env.JWT_SECRET)

      // Mock user for demonstration
      req.user = {
        id: '1',
        email: 'user@example.com',
        role: 'user', // Default role
      }
    } else if (authType.toLowerCase() === 'basic') {
      // Basic auth for testing
      const credentials = Buffer.from(authCredentials, 'base64').toString(
        'utf-8'
      )
      const [email, password] = credentials.split(':')

      if (!email || !password) {
        throw new AppError('Invalid credentials', 401)
      }

      // Mock authentication - In production, verify against database
      // For testing: admin@example.com / password123 = admin role
      //              user@example.com / password123 = user role
      if (email === 'admin@example.com' && password === 'admin123') {
        req.user = {
          id: '1',
          email: email,
          role: 'admin',
        }
      } else if (email === 'user@example.com' && password === 'user123') {
        req.user = {
          id: '2',
          email: email,
          role: 'user',
        }
      } else {
        throw new AppError('Invalid credentials', 401)
      }
    } else {
      throw new AppError('Unsupported authentication type', 401)
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
    } else {
      next(new AppError('Authentication failed', 401))
    }
  }
}

// ==========================================
// Authorization Middleware
// ==========================================

/**
 * Check if user has required role(s)
 * @param roles - Array of allowed roles or single role string
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401)
      }

      const userRole = req.user.role

      if (!roles.includes(userRole)) {
        throw new AppError(
          `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${userRole}`,
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
 * Check if user has specific permissions
 * @param permissions - Array of required permissions
 */
export const checkPermissions = (...permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401)
      }

      // In production, check user permissions from database
      // Mock implementation: admin has all permissions, user has limited
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

/**
 * Check if user owns the resource or is admin
 * @param resourceUserIdField - Field name to check ownership (e.g., 'userId', 'createdBy')
 */
export const checkOwnershipOrAdmin = (
  resourceUserIdField: string = 'userId'
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401)
      }

      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next()
      }

      // Check if user owns the resource
      const resourceUserId =
        (req as any)[resourceUserIdField] || req.body[resourceUserIdField]

      if (resourceUserId && resourceUserId === req.user.id) {
        return next()
      }

      throw new AppError(
        'Access denied. You can only access your own resources.',
        403
      )
    } catch (error) {
      next(error)
    }
  }
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Optional authentication - attach user if token is valid, but don't fail
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

  try {
    authenticateUser(req, res, next)
  } catch (error) {
    // Don't fail, just continue without user
    next()
  }
}
