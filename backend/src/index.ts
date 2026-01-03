import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { logger, morganMiddleware } from './middleware/logger.middleware.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'
import bedroomRoutes from './routes/bedroom.routes.js'
import sensorRoutes from './routes/sensor.routes.js'
import sensorLogRoutes from './routes/sensor-log.routes.js'
import pool, { closePool } from './config/database.js'

// Load environment variables
dotenv.config()

// ==========================================
// Express App Setup
// ==========================================

const app: Application = express()
const PORT = process.env.PORT || 3000

// ==========================================
// Security & Middleware
// ==========================================

// Helmet for security headers
app.use(helmet())

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: process.env.CORS_ORIGIN ? true : false,
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions))

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// HTTP request logging with Morgan + Winston
app.use(morganMiddleware)

// ==========================================
// API Routes
// ==========================================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'IoT Monitoring API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// API version info
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'IoT Monitoring System API',
    version: '1.0.0',
    endpoints: {
      bedrooms: '/api/bedrooms',
      sensors: '/api/sensors',
      sensorLogs: '/api/sensor-logs',
      health: '/health',
    },
  })
})

// Mount API routes
app.use('/api/bedrooms', bedroomRoutes)
app.use('/api/sensors', sensorRoutes)
app.use('/api/sensor-logs', sensorLogRoutes)

// ==========================================
// Error Handling
// ==========================================

// Handle 404 - Route not found
app.use(notFoundHandler)

// Global error handler
app.use(errorHandler)

// ==========================================
// Server Startup
// ==========================================

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`)
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`)
  logger.info(`🔗 API base URL: http://localhost:${PORT}/api`)
})

// ==========================================
// Graceful Shutdown
// ==========================================

/**
 * Handle graceful shutdown
 */
const gracefulShutdown = async (signal: string) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`)

  // Close server
  server.close(async () => {
    logger.info('✅ HTTP server closed')

    try {
      // Close database pool
      await closePool()
      logger.info('✅ Database connections closed')

      logger.info('✅ Graceful shutdown completed')
      process.exit(0)
    } catch (error) {
      logger.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  })

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('⚠️  Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error)
  gracefulShutdown('UNCAUGHT_EXCEPTION')
})

// ==========================================
// Export App for Testing
// ==========================================

export default app
