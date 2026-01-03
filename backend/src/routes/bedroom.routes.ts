import express from 'express'
import {
  getAllBedrooms,
  getBedroomById,
  createBedroom,
  updateBedroom,
  deleteBedroom,
} from '../controllers/bedroom.controller.js'
import {
  validateCreateBedroom,
  validateUpdateBedroom,
} from '../validators/bedroom.validator.js'
import {
  authenticateUser,
  authorizeRoles,
  checkPermissions,
} from '../middleware/auth.middleware.js'

const router = express.Router()

// ==========================================
// Bedroom Routes
// ==========================================

/**
 * @route   GET /api/bedrooms
 * @desc    Get all bedrooms
 * @access  Protected (Authenticated users)
 */
router.get('/', authenticateUser, getAllBedrooms)

/**
 * @route   GET /api/bedrooms/:id
 * @desc    Get bedroom by ID
 * @access  Protected (Authenticated users)
 */
router.get('/:id', authenticateUser, getBedroomById)

/**
 * @route   POST /api/bedrooms
 * @desc    Create a new bedroom
 * @access  Protected (Authenticated users with write permission)
 */
router.post(
  '/',
  authenticateUser,
  validateCreateBedroom,
  checkPermissions('write'),
  createBedroom
)

/**
 * @route   PUT /api/bedrooms/:id
 * @desc    Update bedroom by ID
 * @access  Protected (Authenticated users with update permission)
 */
router.put(
  '/:id',
  authenticateUser,
  validateUpdateBedroom,
  checkPermissions('update'),
  updateBedroom
)

/**
 * @route   DELETE /api/bedrooms/:id
 * @desc    Delete bedroom by ID (cascade deletes sensors and logs)
 * @access  Protected (Admin only)
 */
router.delete('/:id', authenticateUser, authorizeRoles('admin'), deleteBedroom)

export default router
