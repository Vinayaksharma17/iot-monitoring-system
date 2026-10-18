import pg from 'pg'
import { performance } from 'node:perf_hooks'
import { env } from './env.js'
import { logger } from '../middleware/logger.middleware.js'

const { Pool } = pg

// ==========================================
// PostgreSQL Connection Pool
// ==========================================

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: env.dbPoolMax,
  idleTimeoutMillis: env.dbIdleTimeoutMs,
  connectionTimeoutMillis: env.dbConnectionTimeoutMs,
})

// Idle-client errors (network blips, server restarts) must not crash the
// process; the pool discards the broken client and reconnects on demand.
pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle PostgreSQL client', {
    error: err.message,
  })
})

pool.on('connect', () => {
  logger.debug('Connected to PostgreSQL database')
})

/**
 * Execute a parameterized query with timing telemetry.
 * Query params can contain sensitive data (passwords, tokens), so they
 * are never logged.
 */
export const query = async (text: string, params?: unknown[]) => {
  const start = performance.now()
  try {
    const result = await pool.query(text, params)
    logger.debug('Executed query', {
      durationMs: Math.round(performance.now() - start),
      rows: result.rowCount,
    })
    return result
  } catch (error) {
    logger.error('Database query error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/**
 * Borrow a dedicated client for multi-statement transactions.
 * Callers MUST release it: `try { ... } finally { client.release() }`.
 */
export const getClient = async () => {
  try {
    return await pool.connect()
  } catch (error) {
    logger.error('Failed to get database client', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/** Liveness probe for the health endpoint. */
export const pingDatabase = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1')
    return true
  } catch {
    return false
  }
}

/** Close the database pool (graceful shutdown). */
export const closePool = async () => {
  try {
    await pool.end()
    logger.info('Database pool closed')
  } catch (error) {
    logger.error('Error closing database pool', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

export default pool
