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
import { validateQuery } from '../validators/validate.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import Joi from 'joi'

const router = express.Router()

// ==========================================
// Sensor Routes
// ==========================================
// Static/segmented paths are registered before the /:id parametric route
// so future paths can never be shadowed by it.

const listQuerySchema = Joi.object({
  bedroomId: Joi.number().integer().min(1).max(2_147_483_647).optional(),
})

/**
 * @route   GET /api/sensors/active
 * @desc    Get all active sensors (for machine/ingestion clients such as Node-RED)
 * @access  Public, or protected by X-API-Key when INGEST_API_KEY is configured
 */
router.get(
  '/active',
  (req, res, next) => {
    const apiKey = req.headers['x-api-key']
    if (apiKey) {
      return requireApiKey(req, res, next)
    }
    return authenticateUser(req, res, next)
  },
  asyncHandler(getActiveSensors),
)

/**
 * @route   GET /api/sensors
 * @desc    Get all sensors (active and inactive)
 * @query   bedroomId (optional, positive integer)
 * @access  Protected (Authenticated users)
 */
router.get(
  '/',
  authenticateUser,
  validateQuery(listQuerySchema),
  asyncHandler(getAllSensors),
)

/**
 * @route   GET /api/sensors/bedrooms/:bedroomId
 * @desc    Get all sensors for a specific bedroom
 * @access  Protected (Authenticated users)
 */
router.get(
  '/bedrooms/:bedroomId',
  authenticateUser,
  validateNumericId('bedroomId'),
  asyncHandler(getSensorsByBedroomId),
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
  asyncHandler(createSensor),
)

/**
 * @route   GET /api/sensors/:id
 * @desc    Get sensor by ID
 * @access  Protected (Authenticated users)
 */
router.get(
  '/:id',
  authenticateUser,
  validateNumericId('id'),
  asyncHandler(getSensorById),
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
  asyncHandler(updateSensor),
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
  asyncHandler(deleteSensor),
)

export default router
