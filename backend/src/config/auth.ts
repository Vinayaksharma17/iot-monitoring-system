import dotenv from 'dotenv'

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'

const DEV_JWT_SECRET = 'dev-insecure-access-secret-change-me'
const DEV_REFRESH_SECRET = 'dev-insecure-refresh-secret-change-me'

const jwtSecret = process.env.JWT_SECRET || DEV_JWT_SECRET
const refreshSecret = process.env.JWT_REFRESH_SECRET || DEV_REFRESH_SECRET

if (isProduction && (jwtSecret === DEV_JWT_SECRET || refreshSecret === DEV_REFRESH_SECRET)) {
  // Fail fast: never run production with insecure default secrets
  throw new Error(
    'JWT_SECRET and JWT_REFRESH_SECRET must be set to strong, unique values in production.'
  )
}

export const authConfig = {
  jwtSecret,
  refreshSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  // When set, machine/ingestion clients must send this via the X-API-Key header
  ingestApiKey: process.env.INGEST_API_KEY || '',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
}

export type UserRole = 'admin' | 'viewer'
