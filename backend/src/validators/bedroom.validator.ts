import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'

// ==========================================
// Validation Schemas
// ==========================================

/**
 * Schema for creating a bedroom
 */
export const createBedroomSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
  description: Joi.string().max(500).optional().allow('').messages({
    'string.base': 'Description must be a string',
    'string.max': 'Description must not exceed 500 characters',
  }),
})

/**
 * Schema for updating a bedroom
 */
export const updateBedroomSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.base': 'Name must be a string',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
  }),
  description: Joi.string().max(500).optional().allow('').messages({
    'string.base': 'Description must be a string',
    'string.max': 'Description must not exceed 500 characters',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  })

// ==========================================
// Validation Middleware
// ==========================================

/**
 * Middleware to validate request body against create bedroom schema
 */
export const validateCreateBedroom = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = createBedroomSchema.validate(req.body, {
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

  next()
}

/**
 * Middleware to validate request body against update bedroom schema
 */
export const validateUpdateBedroom = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = updateBedroomSchema.validate(req.body, {
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

  next()
}
