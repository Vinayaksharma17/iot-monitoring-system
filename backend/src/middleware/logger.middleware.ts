import winston from 'winston'
import morgan from 'morgan'
import { env } from '../config/env.js'

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
  level: env.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5_242_880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5_242_880, // 5MB
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
      // Skip logging for health check endpoint (frequent k8s/docker probes)
      return req.url === '/health'
    },
  }
)

export default logger
