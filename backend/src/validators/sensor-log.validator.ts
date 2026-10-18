import Joi from 'joi'
import { validateQuery } from './validate.js'

// ==========================================
// Validation Schemas (query strings)
// ==========================================
// Previously raw query strings were passed straight into SQL. They were
// parameterized (so not injectable), but invalid dates blew up as 500s
// and unbounded strings were accepted. These schemas coerce, bound and
// cross-check every filter.

const dateMessage = {
  'date.format': 'must be a valid ISO 8601 date (e.g. 2024-01-31T12:00:00Z)',
}

const startDateField = Joi.date().iso().empty('').optional().messages(dateMessage)

const endDateField = Joi.date()
  .iso()
  .empty('')
  .optional()
  .messages(dateMessage)
  .when('startDate', {
    is: Joi.exist(),
    then: Joi.date()
      .min(Joi.ref('startDate'))
      .messages({ 'date.min': 'endDate must be on or after startDate' }),
  })

const filterFields = {
  startDate: startDateField,
  endDate: endDateField,
  roomName: Joi.string().trim().max(50).empty('').optional(),
  sensorName: Joi.string().trim().max(100).empty('').optional(),
}

const limitField = Joi.number()
  .integer()
  .min(1)
  .max(1000)
  .default(100)
  .messages({
    'number.base': 'limit must be a number',
    'number.min': 'limit must be at least 1',
    'number.max': 'limit must not exceed 1000',
  })

/**
 * GET /api/sensor-logs
 */
export const sensorLogQuerySchema = Joi.object({
  ...filterFields,
  limit: limitField,
})

/**
 * GET /api/sensor-logs/sensor/:sensorId
 */
export const sensorLogBySensorQuerySchema = Joi.object({
  startDate: filterFields.startDate,
  endDate: filterFields.endDate,
  limit: limitField,
})

/**
 * GET /api/sensor-logs/statistics
 */
export const statisticsQuerySchema = Joi.object({
  ...filterFields,
})

// ==========================================
// Validation Middleware
// ==========================================

export const validateSensorLogQuery = validateQuery(sensorLogQuerySchema)
export const validateSensorLogBySensorQuery = validateQuery(
  sensorLogBySensorQuerySchema
)
export const validateStatisticsQuery = validateQuery(statisticsQuerySchema)
