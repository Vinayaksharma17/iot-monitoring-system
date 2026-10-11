import { Request, Response, NextFunction } from 'express'

/**
 * Guard that ensures a route param is a positive integer.
 * Returns 400 early instead of letting PostgreSQL raise an invalid-input error.
 */
export const validateNumericId =
  (paramName = 'id') =>
  (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName]

    if (!/^\d+$/.test(value)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: paramName,
            message: `${paramName} must be a positive integer`,
          },
        ],
      })
    }

    next()
  }
