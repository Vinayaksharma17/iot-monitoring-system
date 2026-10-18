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

// Tokens are stamped with an issuer and audience so a token minted for a
// different service (or an old/leaked key from another app) is rejected
// even if its signature happens to verify.
const signDefaults: Pick<SignOptions, 'issuer' | 'audience'> = {
  issuer: authConfig.jwtIssuer,
  audience: authConfig.jwtAudience,
}

const accessOptions: SignOptions = {
  ...signDefaults,
  expiresIn: authConfig.jwtExpiresIn as SignOptions['expiresIn'],
}

const refreshOptions: SignOptions = {
  ...signDefaults,
  expiresIn: authConfig.refreshExpiresIn as SignOptions['expiresIn'],
}

const verifyDefaults: jwt.VerifyOptions = {
  issuer: authConfig.jwtIssuer,
  audience: authConfig.jwtAudience,
}

// ==========================================
// Token Helpers
// ==========================================

interface TokenSubject {
  id: string | number
  email: string
  role: UserRole
}

/**
 * Sign a short-lived access token
 */
export const signAccessToken = (payload: TokenSubject): string => {
  return jwt.sign({ email: payload.email, role: payload.role }, authConfig.jwtSecret, {
    ...accessOptions,
    subject: String(payload.id),
  })
}

/**
 * Sign a long-lived refresh token
 */
export const signRefreshToken = (payload: TokenSubject): string => {
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
  return jwt.verify(token, authConfig.jwtSecret, verifyDefaults) as TokenPayload
}

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, authConfig.refreshSecret, verifyDefaults) as TokenPayload
}
