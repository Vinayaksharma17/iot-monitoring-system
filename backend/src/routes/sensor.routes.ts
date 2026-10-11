import express from 'express'
import {
  getAllSensors,
  getSensorsByBedroomId,
  getSensorById,
  createSensor,
  updateSensor,
  deleteSensor,
  getActiveSensors,
} from '../controllers/sensor.controller.js'
import {
  validateCreateSensor,
  validateUpdateSensor,
} from '../validators/sensor.validator.js'
import {
  authenticateUser,
  authorizeRoles,
  checkPermissions,
  requireApiKey,
} from '../middleware/auth.middleware.js'
import { validateNumericId } from '../validators/params.validator.js'

const router = express.Router()

// ==========================================
// Sensor Routes
// ==========================================

/**
 * @route   GET /api/sensors/active
 * @desc    Get all active sensors (for machine/ingestion clients such as Node-RED)
 * @access  Public, or protected by X-API-Key when INGEST_API_KEY is configured
 * @note    This route must come before /:id to avoid route conflicts
 */
router.get('/active', requireApiKey, getActiveSensors)

/**
 * @route   GET /api/sensors
 * @desc    Get all sensors (active and inactive)
 * @access  Protected (Authenticated users)
 */
router.get('/', authenticateUser, getAllSensors)

/**
 * @route   GET /api/sensors/:id
 * @desc    Get sensor by ID
 * @access  Protected (Authenticated users)
 */
router.get('/:id', authenticateUser, validateNumericId('id'), getSensorById)

/**
 * @route   GET /api/sensors/bedrooms/:bedroomId
 * @desc    Get all sensors for a specific bedroom
 * @access  Protected (Authenticated users)
 */
router.get(
  '/bedrooms/:bedroomId',
  authenticateUser,
  validateNumericId('bedroomId'),
  getSensorsByBedroomId
)

/**
 * @route   POST /api/sensors/bedrooms/:bedroomId
 * @desc    Create a new sensor for a bedroom
 * @access  Protected (Authenticated users with write permission)
 */
router.post(
  '/bedrooms/:bedroomId',
  authenticateUser,
  validateNumericId('bedroomId'),
  checkPermissions('write'),
  validateCreateSensor,
  createSensor
)

/**
 * @route   PUT /api/sensors/:id
 * @desc    Update sensor by ID
 * @access  Protected (Authenticated users with update permission)
 */
router.put(
  '/:id',
  authenticateUser,
  validateNumericId('id'),
  checkPermissions('update'),
  validateUpdateSensor,
  updateSensor
)

/**
 * @route   DELETE /api/sensors/:id
 * @desc    Delete sensor by ID (cascade deletes logs)
 * @access  Protected (Admin only)
 */
router.delete(
  '/:id',
  authenticateUser,
  validateNumericId('id'),
  authorizeRoles('admin'),
  deleteSensor
)

export default router
