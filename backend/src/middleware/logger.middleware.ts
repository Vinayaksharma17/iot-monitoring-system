import winston from 'winston'
import morgan from 'morgan'

// ==========================================
// Winston Logger Configuration
// ==========================================

const { combine, timestamp, json, printf, colorize, errors } = winston.format

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`
})

/**
 * Winston logger instance
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
})

// ==========================================
// Morgan HTTP Logger
// ==========================================

/**
 * Morgan stream to integrate with Winston
 */
const morganStream = {
  write: (message: string) => {
    logger.info(message.trim())
  },
}

/**
 * Morgan middleware configured with Winston
 */
export const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: morganStream,
    skip: (req) => {
      // Skip logging for health check endpoint
      return req.url === '/health'
    },
  }
)

// ==========================================
// Helper Functions
// ==========================================

/**
 * Log database queries (for debugging)
 */
export const logQuery = (query: string, params?: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Database Query:', {
      query,
      params,
    })
  }
}

/**
 * Log HTTP requests (for debugging)
 */
export const logRequest = (
  method: string,
  url: string,
  body?: any,
  query?: any
) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('HTTP Request:', {
      method,
      url,
      body,
      query,
    })
  }
}

export default logger
