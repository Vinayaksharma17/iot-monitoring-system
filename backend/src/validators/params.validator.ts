import { Request, Response, NextFunction } from 'express'

// SERIAL primary keys are int4; values above this overflow the column
// and would surface as a 500 instead of a 400.
const MAX_RECORD_ID = 2_147_483_647

/**
 * Guard that ensures a route param is a positive int4 integer.
 * Returns 400 early instead of letting PostgreSQL raise an
 * invalid-input or numeric-overflow error.
 */
export const validateNumericId =
  (paramName = 'id') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName]

    // Bounded regex first so huge garbage values are rejected cheaply.
    if (
      !value ||
      !/^\d{1,10}$/.test(value) ||
      Number(value) < 1 ||
      Number(value) > MAX_RECORD_ID
    ) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: paramName,
            message: `${paramName} must be a positive integer`,
          },
        ],
      })
      return
    }

    next()
  }
