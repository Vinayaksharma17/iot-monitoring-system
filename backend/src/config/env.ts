import dotenv from 'dotenv'

// ==========================================
// Environment Loader & Validator
// ==========================================
// Single source of truth for all runtime configuration. Loaded (and
// validated) before any other module so nothing ever reads a raw
// process.env value or a silent default again.

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

// ------------------------------------------
// Parsing helpers
// ------------------------------------------

const readInt = (
  name: string,
  fallback: number,
  min: number,
  max: number
): number => {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback

  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `Environment variable ${name} must be an integer between ${min} and ${max} (received "${raw}")`
    )
  }
  return parsed
}

const readBool = (name: string, fallback: boolean): boolean => {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  if (raw === 'true' || raw === '1') return true
  if (raw === 'false' || raw === '0') return false
  throw new Error(
    `Environment variable ${name} must be "true"/"false" or "1"/"0" (received "${raw}")`
  )
}

// ------------------------------------------
// Collect validation failures so operators see every problem at once
// ------------------------------------------

const failures: string[] = []

const requireVar = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    failures.push(`Environment variable ${name} is required`)
    return ''
  }
  return value
}

const databaseUrl = requireVar('DATABASE_URL')

const nodeEnv = process.env.NODE_ENV || 'development'
const port = readInt('PORT', 3000, 1, 65535)

// ------------------------------------------
// CORS
// ------------------------------------------
// CORS_ORIGIN accepts a single origin or a comma-separated list.
// Wildcards are fine for local development, but a production API that
// reflects '*' while issuing JWTs would let any website call it with a
// stolen token, so production must pin explicit origins.

const rawCorsOrigin = process.env.CORS_ORIGIN

let corsOrigins: string | string[] | false = false
if (rawCorsOrigin && rawCorsOrigin.trim() !== '') {
  const origins = rawCorsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  corsOrigins = origins.length === 1 ? origins[0] : origins
} else if (isProduction) {
  failures.push(
    'Environment variable CORS_ORIGIN must be set in production (explicit origin(s), no wildcard)'
  )
} else {
  corsOrigins = '*'
}

// ------------------------------------------
// Secrets (fail fast in production)
// ------------------------------------------

const INSECURE_PLACEHOLDERS = new Set([
  'dev-insecure-access-secret-change-me',
  'dev-insecure-refresh-secret-change-me',
  'change-this-to-a-strong-access-secret',
  'change-this-to-a-strong-refresh-secret',
])

const jwtSecret = process.env.JWT_SECRET || 'dev-insecure-access-secret-change-me'
const jwtRefreshSecret =
  process.env.JWT_REFRESH_SECRET || 'dev-insecure-refresh-secret-change-me'

if (isProduction) {
  if (!process.env.JWT_SECRET) {
    failures.push('Environment variable JWT_SECRET is required in production')
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    failures.push(
      'Environment variable JWT_REFRESH_SECRET is required in production'
    )
  }
  if (
    process.env.JWT_SECRET &&
    INSECURE_PLACEHOLDERS.has(process.env.JWT_SECRET)
  ) {
    failures.push('JWT_SECRET is set to a known placeholder value')
  }
  if (
    process.env.JWT_REFRESH_SECRET &&
    INSECURE_PLACEHOLDERS.has(process.env.JWT_REFRESH_SECRET)
  ) {
    failures.push('JWT_REFRESH_SECRET is set to a known placeholder value')
  }
  if (
    process.env.JWT_SECRET &&
    process.env.JWT_REFRESH_SECRET &&
    process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET
  ) {
    failures.push('JWT_SECRET and JWT_REFRESH_SECRET must be different values')
  }
}

// ------------------------------------------
// Exported config object
// ------------------------------------------

export const env = {
  nodeEnv,
  isProduction,
  isDevelopment,

  port,
  corsOrigins,
  corsAllowsCredentials: corsOrigins !== false && corsOrigins !== '*',

  // Enable when running behind a load balancer / reverse proxy so
  // req.ip (and rate limiting) uses X-Forwarded-For. Set to the number
  // of trusted proxy hops (e.g. "1") or "true"/"false".
  trustProxy: process.env.TRUST_PROXY
    ? process.env.TRUST_PROXY === 'true'
      ? true
      : readInt('TRUST_PROXY', 1, 1, 10)
    : false,

  logLevel: process.env.LOG_LEVEL || 'info',

  databaseUrl,
  dbPoolMax: readInt('DB_POOL_MAX', 20, 1, 100),
  dbIdleTimeoutMs: readInt('DB_IDLE_TIMEOUT_MS', 30_000, 1000, 300_000),
  dbConnectionTimeoutMs: readInt('DB_CONNECTION_TIMEOUT_MS', 2000, 100, 60_000),

  bodyLimit: process.env.BODY_LIMIT || '100kb',

  jwtSecret,
  jwtRefreshSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  jwtIssuer: process.env.JWT_ISSUER || 'iot-monitoring-api',
  jwtAudience: process.env.JWT_AUDIENCE || 'iot-monitoring-clients',

  // Optional machine-to-machine key guarding the ingestion endpoints.
  ingestApiKey: process.env.INGEST_API_KEY || '',

  bcryptRounds: readInt('BCRYPT_ROUNDS', 10, 10, 15),

  // Rate limiting (in-memory, per-process; use a shared store if you
  // ever run more than one API instance behind a load balancer).
  rateLimitWindowMs: readInt('RATE_LIMIT_WINDOW_MS', 60_000, 1000, 3_600_000),
  rateLimitMax: readInt('RATE_LIMIT_MAX', 300, 1, 100_000),
  authRateLimitWindowMs: readInt('AUTH_RATE_LIMIT_WINDOW_MS', 900_000, 1000, 3_600_000),
  authRateLimitMax: readInt('AUTH_RATE_LIMIT_MAX', 10, 1, 10_000),
} as const

// ------------------------------------------
// Fail fast: refuse to boot with a broken configuration
// ------------------------------------------

if (failures.length > 0) {
  throw new Error(
    `Invalid environment configuration:\n  - ${failures.join('\n  - ')}`
  )
}

export type Env = typeof env
