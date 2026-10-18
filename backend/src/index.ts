// Env must be imported first: it loads .env and fails fast on invalid
// configuration before any other module reads a setting.
import { env } from './config/env.js'
import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { logger, morganMiddleware } from './middleware/logger.middleware.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'
import { apiLimiter } from './middleware/rate-limit.middleware.js'
import authRoutes from './routes/auth.routes.js'
import bedroomRoutes from './routes/bedroom.routes.js'
import sensorRoutes from './routes/sensor.routes.js'
import sensorLogRoutes from './routes/sensor-log.routes.js'
import pool, { closePool, pingDatabase } from './config/database.js'
import { seedAdminUser } from './config/seed.js'

// ==========================================
// Express App Setup
// ==========================================

const app: Application = express()

// Behind a reverse proxy / load balancer this makes Express trust
// X-Forwarded-For so req.ip (and rate limiting) sees the real client.
// Without it every client shares the proxy's IP and would share one
// rate-limit bucket.
if (env.trustProxy !== false) {
  app.set('trust proxy', env.trustProxy)
}

// Fingerprinting helps nobody here and helps attackers fingerprint the
// framework version.
app.disable('x-powered-by')

// ==========================================
// Security & Middleware
// ==========================================

// Helmet: security headers (HSTS, nosniff, frameguard, etc.)
app.use(helmet())

// CORS: explicit origins only. Allowed origins are echoed back
// individually; disallowed origins receive no CORS headers at all.
// Credentials stay disabled unless a concrete origin list is configured
// (browsers reject Access-Control-Allow-Origin: * with credentials).
const allowedOrigins: string[] =
  env.corsOrigins === '*' || env.corsOrigins === false
    ? []
    : Array.isArray(env.corsOrigins)
      ? env.corsOrigins
      : [env.corsOrigins]

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header (curl, server-to-server) are fine.
      if (!origin || env.corsOrigins === '*' || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(null, false)
    },
    credentials: env.corsAllowsCredentials,
    optionsSuccessStatus: 200,
    maxAge: 600,
  })
)

// Body parsers with an explicit size cap (default 100kb, made
// configurable so ingestion-heavy deployments can raise it consciously).
app.use(express.json({ limit: env.bodyLimit }))
app.use(express.urlencoded({ extended: false, limit: env.bodyLimit }))

// HTTP request logging with Morgan + Winston
app.use(morganMiddleware)

// Global rate limiter for the whole API surface (health checks excluded).
app.use('/api', apiLimiter)

// ==========================================
// API Routes
// ==========================================

// Health check endpoint (excluded from rate limiting; used by
// container/orchestrator probes)
app.get('/health', async (_req: Request, res: Response) => {
  const databaseUp = await pingDatabase()

  res.status(databaseUp ? 200 : 503).json({
    success: databaseUp,
    message: databaseUp
      ? 'IoT Monitoring API is running'
      : 'IoT Monitoring API is running but the database is unreachable',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: databaseUp ? 'up' : 'down',
  })
})

// API version info
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'IoT Monitoring System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      bedrooms: '/api/bedrooms',
      sensors: '/api/sensors',
      sensorLogs: '/api/sensor-logs',
      health: '/health',
    },
  })
})

// Mount API routes
app.use('/api/auth', authRoutes)
app.use('/api/bedrooms', bedroomRoutes)
app.use('/api/sensors', sensorRoutes)
app.use('/api/sensor-logs', sensorLogRoutes)

// ==========================================
// Error Handling
// ==========================================

// Handle 404 - Route not found
app.use(notFoundHandler)

// Global error handler (catches everything forwarded by asyncHandler,
// validators, middleware and any synchronous errors in handlers)
app.use(errorHandler)

// ==========================================
// Server Startup
// ==========================================

const server = app.listen(env.port, () => {
  logger.info(`🚀 Server is running on port ${env.port}`)
  logger.info(`📊 Environment: ${env.nodeEnv}`)
  logger.info(`🔗 Health check: http://localhost:${env.port}/health`)
  logger.info(`🔗 API base URL: http://localhost:${env.port}/api`)

  // Ensure an initial admin user exists (env-driven, no-op if unset)
  seedAdminUser().catch((error) => {
    logger.error('Failed to seed admin user:', error)
  })
})

// ==========================================
// Graceful Shutdown
// ==========================================

let isShuttingDown = false

/**
 * Handle graceful shutdown: stop accepting connections, drain in-flight
 * requests, close the DB pool, then exit. A watchdog forces exit if
 * draining hangs.
 */
const gracefulShutdown = (signal: string, exitCode = 0): void => {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info(`${signal} received. Starting graceful shutdown...`)

  const forceExit = setTimeout(() => {
    logger.error('⚠️  Forced shutdown after timeout')
    process.exit(1)
  }, 10_000)
  // Do not keep the process alive just for the watchdog.
  forceExit.unref()

  server.close(async () => {
    clearTimeout(forceExit)
    logger.info('✅ HTTP server closed')

    try {
      await closePool()
      logger.info('✅ Database connections closed')
      logger.info('✅ Graceful shutdown completed')
      process.exit(exitCode)
    } catch (error) {
      logger.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  })
}

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// An unhandled rejection means an async code path failed somewhere we do
// not control; the process state can no longer be trusted, so log and
// shut down (non-zero exit) instead of limping on.
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  gracefulShutdown('UNHANDLED_REJECTION', 1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error)
  gracefulShutdown('UNCAUGHT_EXCEPTION', 1)
})

// ==========================================
// Export App for Testing
// ==========================================

export default app
