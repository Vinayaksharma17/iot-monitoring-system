import { env } from './env.js'

// ==========================================
// Auth Configuration
// ==========================================
// Secrets and lifetimes come from the validated env module, which fails
// fast when production is running with missing/placeholder secrets.

export const authConfig = {
  jwtSecret: env.jwtSecret,
  refreshSecret: env.jwtRefreshSecret,
  jwtExpiresIn: env.jwtExpiresIn,
  refreshExpiresIn: env.jwtRefreshExpiresIn,
  jwtIssuer: env.jwtIssuer,
  jwtAudience: env.jwtAudience,
  // When set, machine/ingestion clients must send this via the X-API-Key header
  ingestApiKey: env.ingestApiKey,
  bcryptRounds: env.bcryptRounds,
}

export type UserRole = 'admin' | 'viewer'
