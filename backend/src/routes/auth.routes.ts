import express from 'express'
import {
  login,
  logout,
  refresh,
  getCurrentUser,
} from '../controllers/auth.controller.js'
import {
  validateLogin,
  validateRefresh,
} from '../validators/auth.validator.js'
import { authenticateUser } from '../middleware/auth.middleware.js'
import { authLimiter } from '../middleware/rate-limit.middleware.js'
import { asyncHandler } from '../middleware/error.middleware.js'

const router = express.Router()

// ==========================================
// Auth Routes
// ==========================================

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate a user and issue access/refresh tokens
 * @access  Public (rate limited; only failed attempts count)
 */
router.post('/login', authLimiter, validateLogin, asyncHandler(login))

/**
 * @route   POST /api/auth/refresh
 * @desc    Exchange a valid refresh token for a new access token
 * @access  Public (rate limited; only failed attempts count)
 */
router.post('/refresh', authLimiter, validateRefresh, asyncHandler(refresh))

/**
 * @route   POST /api/auth/logout
 * @desc    Log out (client discards stored tokens)
 * @access  Protected
 */
router.post('/logout', authenticateUser, asyncHandler(logout))

/**
 * @route   GET /api/auth/me
 * @desc    Get the currently authenticated user
 * @access  Protected
 */
router.get('/me', authenticateUser, asyncHandler(getCurrentUser))

export default router
