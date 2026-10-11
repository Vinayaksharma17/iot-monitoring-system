import express from 'express'
import {
  getSensorLogs,
  getSensorLogsBySensorId,
  getLatestReadings,
  getStatistics,
} from '../controllers/sensor-log.controller.js'

const router = express.Router()

// ==========================================
// Sensor Log Routes (Read-Only)
// ==========================================

/**
 * @route   GET /api/sensor-logs
 * @desc    Get sensor logs with optional filters
 * @query   roomName, sensorName, startDate, endDate, limit
 * @access  Public
 */
router.get('/', getSensorLogs)

/**
 * @route   GET /api/sensor-logs/sensor/:sensorId
 * @desc    Get historical readings for a single sensor
 * @query   startDate, endDate, limit
 * @access  Public
 */
import { validateNumericId } from '../validators/params.validator.js'

router.get(
  '/sensor/:sensorId',
  validateNumericId('sensorId'),
  getSensorLogsBySensorId
)

/**
 * @route   GET /api/sensor-logs/latest
 * @desc    Get latest reading for each active sensor
 * @access  Public
 */
router.get('/latest', getLatestReadings)

/**
 * @route   GET /api/sensor-logs/statistics
 * @desc    Get aggregated statistics for sensor readings
 * @query   startDate, endDate, roomName, sensorName
 * @access  Public
 */
router.get('/statistics', getStatistics)

export default router
