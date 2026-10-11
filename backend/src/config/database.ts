import pg from 'pg'
import dotenv from 'dotenv'
import { logger } from '../middleware/logger.middleware.js'

dotenv.config()

const { Pool } = pg

// PostgreSQL connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
})

// Handle pool errors
pool.on('error', (err: Error) => {
  // Do not crash the process on a transient idle-client error; the pool
  // will discard the bad client and create a new one on demand.
  logger.error('Unexpected error on idle PostgreSQL client', { error: err.message })
})

// Test database connection on startup
pool.on('connect', () => {
  logger.debug('Connected to PostgreSQL database')
})

/**
 * Execute a query with error handling
 * @param text SQL query text
 * @param params Query parameters
 * @returns Query result
 */
export const query = async (text: string, params?: any[]) => {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    // Query params can contain sensitive data, so never log them.
    logger.debug('Executed query', { duration, rows: result.rowCount })
    return result
  } catch (error) {
    logger.error('Database query error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/**
 * Get a client from the pool for transactions
 * @returns PostgreSQL client
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

/**
 * Close the database pool
 */
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
