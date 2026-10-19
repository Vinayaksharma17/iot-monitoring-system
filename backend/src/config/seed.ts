import bcrypt from 'bcryptjs'
import { query } from './database.js'
import { authConfig } from './auth.js'
import { env } from './env.js'
import { logger } from '../middleware/logger.middleware.js'

/**
 * Seed an initial admin user when no admin exists yet.
 * Controlled entirely by environment variables so no credentials live in
 * code or in the repository.
 *
 * Required env: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
 */
export const seedAdminUser = async (): Promise<void> => {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    logger.info(
      'Skipping admin seed (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set)'
    )
    return
  }

  const existing = await query(
    "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
  )

  if (existing.rows.length > 0) {
    logger.info('Admin user already exists, skipping seed')
    return
  }

  if (env.isProduction && password.length < 12) {
    throw new Error(
      'SEED_ADMIN_PASSWORD must be at least 12 characters in production'
    )
  }

  const passwordHash = await bcrypt.hash(password, authConfig.bcryptRounds)

  await query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [email.toLowerCase(), passwordHash]
  )

  logger.info(`Seeded initial admin user: ${email}`)
}
