import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'

// ==========================================
// Shared Validation Middleware Factory
// ==========================================
// Single implementation used by every route so the 400 response shape
// stays identical everywhere and schemas actually take effect
// (validated values are written back onto the request).

type ValidationTarget = 'body' | 'query'

const validate =
  (schema: Joi.ObjectSchema, target: ValidationTarget) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const source = target === 'body' ? req.body : req.query

    const { error, value } = schema.validate(source, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      })
      return
    }

    if (target === 'body') {
      req.body = value
    } else {
      // Express 4: assigning an own property shadows the prototype getter.
      req.query = value
    }

    next()
  }

/** Validate (and strip unknown fields from) the request body. */
export const validateBody =
  (schema: Joi.ObjectSchema) => validate(schema, 'body')

/** Validate (and coerce) the query string. */
export const validateQuery =
  (schema: Joi.ObjectSchema) => validate(schema, 'query')
