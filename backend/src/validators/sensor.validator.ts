import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'

// ==========================================
// Validation Schemas
// ==========================================

/**
 * Schema for creating a sensor
 */
export const createSensorSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
  type: Joi.string().valid('temperature', 'humidity').required().messages({
    'string.base': 'Type must be a string',
    'any.only': 'Type must be either "temperature" or "humidity"',
    'any.required': 'Type is required',
  }),
  unit: Joi.string().required().messages({
    'string.base': 'Unit must be a string',
    'string.empty': 'Unit is required',
    'any.required': 'Unit is required',
  }),
  minValue: Joi.number().required().messages({
    'number.base': 'Min value must be a number',
    'any.required': 'Min value is required',
  }),
  maxValue: Joi.number().greater(Joi.ref('minValue')).required().messages({
    'number.base': 'Max value must be a number',
    'number.greater': 'Max value must be greater than min value',
    'any.required': 'Max value is required',
  }),
  isActive: Joi.boolean().optional().default(true).messages({
    'boolean.base': 'IsActive must be a boolean',
  }),
})

/**
 * Schema for updating a sensor
 */
export const updateSensorSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.base': 'Name must be a string',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
  }),
  type: Joi.string().valid('temperature', 'humidity').optional().messages({
    'string.base': 'Type must be a string',
    'any.only': 'Type must be either "temperature" or "humidity"',
  }),
  unit: Joi.string().optional().messages({
    'string.base': 'Unit must be a string',
  }),
  minValue: Joi.number().optional().messages({
    'number.base': 'Min value must be a number',
  }),
  maxValue: Joi.number()
    .optional()
    .when('minValue', {
      is: Joi.exist(),
      then: Joi.number().greater(Joi.ref('minValue')),
    })
    .messages({
      'number.base': 'Max value must be a number',
      'number.greater': 'Max value must be greater than min value',
    }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'IsActive must be a boolean',
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
 * Middleware to validate request body against create sensor schema
 */
export const validateCreateSensor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = createSensorSchema.validate(req.body, {
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
 * Middleware to validate request body against update sensor schema
 */
export const validateUpdateSensor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = updateSensorSchema.validate(req.body, {
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
