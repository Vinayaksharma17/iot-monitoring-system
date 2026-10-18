import express from 'express'
import {
  getSensorLogs,
  getSensorLogsBySensorId,
  getLatestReadings,
  getStatistics,
} from '../controllers/sensor-log.controller.js'
import {
  validateSensorLogQuery,
  validateSensorLogBySensorQuery,
  validateStatisticsQuery,
} from '../validators/sensor-log.validator.js'
import { validateNumericId } from '../validators/params.validator.js'
import { asyncHandler } from '../middleware/error.middleware.js'

const router = express.Router()

// ==========================================
// Sensor Log Routes (Read-Only)
// ==========================================
// These routes stay unauthenticated (public read contract), but they are
// rate limited globally via the /api limiter in index.ts.

/**
 * @route   GET /api/sensor-logs/latest
 * @desc    Get latest reading for each active sensor
 * @access  Public
 */
router.get('/latest', asyncHandler(getLatestReadings))

/**
 * @route   GET /api/sensor-logs/statistics
 * @desc    Get aggregated statistics for sensor readings
 * @query   startDate, endDate, roomName, sensorName
 * @access  Public
 */
router.get(
  '/statistics',
  validateStatisticsQuery,
  asyncHandler(getStatistics)
)

/**
 * @route   GET /api/sensor-logs/sensor/:sensorId
 * @desc    Get historical readings for a single sensor
 * @query   startDate, endDate, limit
 * @access  Public
 */
router.get(
  '/sensor/:sensorId',
  validateNumericId('sensorId'),
  validateSensorLogBySensorQuery,
  asyncHandler(getSensorLogsBySensorId)
)

/**
 * @route   GET /api/sensor-logs
 * @desc    Get sensor logs with optional filters
 * @query   roomName, sensorName, startDate, endDate, limit
 * @access  Public
 */
router.get('/', validateSensorLogQuery, asyncHandler(getSensorLogs))

export default router
