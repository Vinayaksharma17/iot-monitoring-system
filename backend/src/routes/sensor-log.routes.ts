import express from 'express'
import {
  getSensorLogs,
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
