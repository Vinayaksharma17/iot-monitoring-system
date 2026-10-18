import bcrypt from 'bcryptjs'
import { query } from '../config/database.js'
import { AppError } from '../middleware/error.middleware.js'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/token.js'
import { UserRole } from '../config/auth.js'
import { PublicUser, TokenPair } from '../types/index.js'

// ==========================================
// Auth Service
// ==========================================

export interface UserRow {
  id: number
  email: string
  password_hash: string
  role: UserRole
  is_active: boolean
  created_at: Date
  updated_at: Date
}

const USER_COLUMNS = 'id, email, password_hash, role, is_active, created_at, updated_at'
const PUBLIC_USER_COLUMNS = 'id, email, role, is_active, created_at, updated_at'

// A real bcrypt hash of a random secret. Compared against when the email
// is unknown so response timing does not reveal which accounts exist
// (user-enumeration timing attack).
const DUMMY_HASH =
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

export const toPublicUser = (
  row: Pick<UserRow, 'id' | 'email' | 'role' | 'is_active' | 'created_at' | 'updated_at'>
): PublicUser => ({
  id: row.id,
  email: row.email,
  role: row.role,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

/**
 * Authenticate credentials and issue an access/refresh token pair.
 */
export const login = async (
  email: string,
  password: string
): Promise<{ user: PublicUser } & TokenPair> => {
  const result = await query(
    `SELECT ${USER_COLUMNS} FROM users WHERE LOWER(email) = LOWER($1)`,
    [email]
  )

  const user: UserRow | undefined = result.rows[0]

  const isMatch = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH)

  if (!user || !isMatch) {
    throw new AppError('Invalid email or password', 401)
  }

  if (!user.is_active) {
    throw new AppError('Account is disabled', 403)
  }

  const tokens = issueTokens(user)

  return { user: toPublicUser(user), ...tokens }
}

/**
 * Fetch the currently authenticated user's profile.
 */
export const getCurrentUser = async (id: string): Promise<PublicUser> => {
  const result = await query(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = $1`,
    [id]
  )

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404)
  }

  return toPublicUser(result.rows[0])
}

/**
 * Exchange a valid refresh token for a fresh token pair.
 * The user is re-checked from the database on every refresh so disabled
 * accounts lose access immediately instead of after token expiry.
 */
export const refresh = async (refreshToken: string): Promise<TokenPair> => {
  let decoded
  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  if (!decoded.sub) {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const result = await query(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = $1`,
    [decoded.sub]
  )

  if (result.rows.length === 0) {
    throw new AppError('User not found', 401)
  }

  const user = result.rows[0]

  if (!user.is_active) {
    throw new AppError('Account is disabled', 403)
  }

  return issueTokens(user)
}

const issueTokens = (user: {
  id: number
  email: string
  role: UserRole
}): TokenPair => ({
  accessToken: signAccessToken({ id: user.id, email: user.email, role: user.role }),
  refreshToken: signRefreshToken({ id: user.id, email: user.email, role: user.role }),
})
