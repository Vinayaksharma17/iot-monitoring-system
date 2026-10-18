import { rateLimit } from 'express-rate-limit'
import { env } from '../config/env.js'

// ==========================================
// Rate Limiting
// ==========================================
// In-memory stores are per-process. If the API is scaled horizontally,
// swap the store for a shared one (e.g. Redis) so limits are global.

/**
 * General API limiter: protects against brute-force scraping and
 * accidental request storms from dashboards/Node-RED polling.
 */
export const apiLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
})

/**
 * Strict limiter for credential/token endpoints. Only failed attempts
 * are counted, so legitimate users who log in repeatedly are not locked
 * out by their own successful traffic.
 */
export const authLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
})
