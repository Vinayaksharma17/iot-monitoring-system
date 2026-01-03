import express from 'express'
import {
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

const router = express.Router()

// ==========================================
// Sensor Routes
// ==========================================

/**
 * @route   GET /api/sensors/active
 * @desc    Get all active sensors (for Node-RED)
 * @access  Public
 * @note    This route must come before /:id to avoid route conflicts
 */
router.get('/active', getActiveSensors)

/**
 * @route   GET /api/sensors/:id
 * @desc    Get sensor by ID
 * @access  Public
 */
router.get('/:id', getSensorById)

/**
 * @route   PUT /api/sensors/:id
 * @desc    Update sensor by ID
 * @access  Public
 */
router.put('/:id', validateUpdateSensor, updateSensor)

/**
 * @route   DELETE /api/sensors/:id
 * @desc    Delete sensor by ID (cascade deletes logs)
 * @access  Public
 */
router.delete('/:id', deleteSensor)

// ==========================================
// Bedroom-Specific Sensor Routes
// ==========================================

/**
 * @route   GET /api/bedrooms/:bedroomId/sensors
 * @desc    Get all sensors for a specific bedroom
 * @access  Public
 */
router.get('/bedrooms/:bedroomId', getSensorsByBedroomId)

/**
 * @route   POST /api/bedrooms/:bedroomId/sensors
 * @desc    Create a new sensor for a bedroom
 * @access  Public
 */
router.post('/bedrooms/:bedroomId', validateCreateSensor, createSensor)

export default router
