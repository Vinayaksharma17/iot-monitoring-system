import pg from 'pg'
import dotenv from 'dotenv'

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
  console.error('Unexpected error on idle PostgreSQL client', err)
  process.exit(-1)
})

// Test database connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database')
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
    console.log('Executed query', { text, duration, rows: result.rowCount })
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

/**
 * Get a client from the pool for transactions
 * @returns PostgreSQL client
 */
export const getClient = async () => {
  try {
    const client = await pool.connect()
    return client
  } catch (error) {
    console.error('Failed to get database client:', error)
    throw error
  }
}

/**
 * Close the database pool
 */
export const closePool = async () => {
  try {
    await pool.end()
    console.log('✅ Database pool closed')
  } catch (error) {
    console.error('Error closing database pool:', error)
    throw error
  }
}

export default pool
