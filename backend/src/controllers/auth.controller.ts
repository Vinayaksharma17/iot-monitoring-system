import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../config/database.js'
import { AppError } from '../middleware/error.middleware.js'
import { AuthRequest } from '../middleware/auth.middleware.js'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/token.js'
import { UserRole } from '../config/auth.js'

// ==========================================
// Helpers
// ==========================================

interface UserRow {
  id: number
  email: string
  password_hash: string
  role: UserRole
  is_active: boolean
  created_at: Date
  updated_at: Date
}

const toPublicUser = (row: Omit<UserRow, 'password_hash'>) => ({
  id: row.id,
  email: row.email,
  role: row.role,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

// A valid bcrypt hash used to keep login timing consistent for unknown emails
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Z8x7j5k6m7n8o9p0q1r2s3t4u5v6w'

// ==========================================
// Auth Controller
// ==========================================

/**
 * Authenticate a user and issue access/refresh tokens
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string }

  const result = await query(
    'SELECT id, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  )

  const user: UserRow | undefined = result.rows[0]

  // Constant-ish time comparison to avoid user enumeration
  const isMatch = await bcrypt.compare(
    password,
    user ? user.password_hash : DUMMY_HASH
  )

  if (!user || !isMatch) {
    throw new AppError('Invalid email or password', 401)
  }

  if (!user.is_active) {
    throw new AppError('Account is disabled', 403)
  }

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  })
  const refreshToken = signRefreshToken({
    id: user.id,
    email: user.email,
    role: user.role,
  })

  res.status(200).json({
    success: true,
    data: {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    },
    message: 'Login successful',
  })
}

/**
 * Get the currently authenticated user
 * @route GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  const currentUser = (req as AuthRequest).user!

  const result = await query(
    'SELECT id, email, role, is_active, created_at, updated_at FROM users WHERE id = $1',
    [currentUser.id]
  )

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404)
  }

  res.status(200).json({
    success: true,
    data: toPublicUser(result.rows[0]),
    message: 'User retrieved successfully',
  })
}

/**
 * Exchange a valid refresh token for a new access token
 * @route POST /api/auth/refresh
 */
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string }

  let decoded
  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const result = await query(
    'SELECT id, email, role, is_active, created_at, updated_at FROM users WHERE id = $1',
    [decoded.sub]
  )

  if (result.rows.length === 0) {
    throw new AppError('User not found', 401)
  }

  const user = result.rows[0] as Omit<UserRow, 'password_hash'>

  if (!user.is_active) {
    throw new AppError('Account is disabled', 403)
  }

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  })
  const newRefreshToken = signRefreshToken({
    id: user.id,
    email: user.email,
    role: user.role,
  })

  res.status(200).json({
    success: true,
    data: { accessToken, refreshToken: newRefreshToken },
    message: 'Token refreshed successfully',
  })
}

/**
 * Log out. Tokens are stateless, so this is a client-side token discard.
 * @route POST /api/auth/logout
 */
export const logout = async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful. Discard the stored tokens on the client.',
  })
}
