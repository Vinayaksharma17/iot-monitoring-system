import Joi from 'joi'
import { validateBody } from './validate.js'

// ==========================================
// Validation Schemas
// ==========================================

export const loginSchema = Joi.object({
  email: Joi.string().email().max(255).required().messages({
    'string.base': 'Email must be a string',
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email is required',
    'string.max': 'Email must not exceed 255 characters',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.base': 'Password must be a string',
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'any.required': 'Password is required',
  }),
})

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().max(4096).required().messages({
    'string.base': 'Refresh token must be a string',
    'string.empty': 'Refresh token is required',
    'any.required': 'Refresh token is required',
  }),
})

// ==========================================
// Validation Middleware
// ==========================================

export const validateLogin = validateBody(loginSchema)
export const validateRefresh = validateBody(refreshSchema)
