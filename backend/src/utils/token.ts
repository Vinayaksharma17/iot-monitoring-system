import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken'
import { authConfig, UserRole } from '../config/auth.js'

// ==========================================
// Token Payload
// ==========================================

export interface TokenPayload extends JwtPayload {
  sub: string
  email: string
  role: UserRole
}

const accessOptions: SignOptions = {
  expiresIn: authConfig.jwtExpiresIn as SignOptions['expiresIn'],
}

const refreshOptions: SignOptions = {
  expiresIn: authConfig.refreshExpiresIn as SignOptions['expiresIn'],
}

// ==========================================
// Token Helpers
// ==========================================

/**
 * Sign a short-lived access token
 */
export const signAccessToken = (payload: {
  id: string | number
  email: string
  role: UserRole
}): string => {
  return jwt.sign(
    { email: payload.email, role: payload.role },
    authConfig.jwtSecret,
    { ...accessOptions, subject: String(payload.id) }
  )
}

/**
 * Sign a long-lived refresh token
 */
export const signRefreshToken = (payload: {
  id: string | number
  email: string
  role: UserRole
}): string => {
  return jwt.sign(
    { email: payload.email, role: payload.role },
    authConfig.refreshSecret,
    { ...refreshOptions, subject: String(payload.id) }
  )
}

/**
 * Verify an access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, authConfig.jwtSecret) as TokenPayload
}

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, authConfig.refreshSecret) as TokenPayload
}
