import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'

// ==========================================
// Validation Schemas
// ==========================================

export const loginSchema = Joi.object({
  email: Joi.string().email().max(255).required().messages({
    'string.base': 'Email must be a string',
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.base': 'Password must be a string',
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
})

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.base': 'Refresh token must be a string',
    'string.empty': 'Refresh token is required',
    'any.required': 'Refresh token is required',
  }),
})

// ==========================================
// Validation Middleware
// ==========================================

const buildValidator =
  (schema: Joi.ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      })
    }

    req.body = value
    next()
  }

export const validateLogin = buildValidator(loginSchema)
export const validateRefresh = buildValidator(refreshSchema)
