import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware.js'
import * as authService from '../services/auth.service.js'

// ==========================================
// Auth Controller (thin HTTP layer)
// ==========================================

/**
 * Authenticate a user and issue access/refresh tokens
 * @route POST /api/auth/login
 */
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string }

  const data = await authService.login(email, password)

  res.status(200).json({
    success: true,
    data,
    message: 'Login successful',
  })
}

/**
 * Get the currently authenticated user
 * @route GET /api/auth/me
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const user = await authService.getCurrentUser(req.user!.id)

  res.status(200).json({
    success: true,
    data: user,
    message: 'User retrieved successfully',
  })
}

/**
 * Exchange a valid refresh token for a new access token
 * @route POST /api/auth/refresh
 */
export const refresh = async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string }

  const tokens = await authService.refresh(refreshToken)

  res.status(200).json({
    success: true,
    data: tokens,
    message: 'Token refreshed successfully',
  })
}

/**
 * Log out. Tokens are stateless, so this is a client-side token discard.
 * @route POST /api/auth/logout
 */
export const logout = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Logout successful. Discard the stored tokens on the client.',
  })
}
