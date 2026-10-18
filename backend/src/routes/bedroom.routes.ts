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
import { validateNumericId } from '../validators/params.validator.js'
import { asyncHandler } from '../middleware/error.middleware.js'

const router = express.Router()

// ==========================================
// Bedroom Routes
// ==========================================

/**
 * @route   GET /api/bedrooms
 * @desc    Get all bedrooms
 * @access  Protected (Authenticated users)
 */
router.get('/', authenticateUser, asyncHandler(getAllBedrooms))

/**
 * @route   GET /api/bedrooms/:id
 * @desc    Get bedroom by ID
 * @access  Protected (Authenticated users)
 */
router.get(
  '/:id',
  authenticateUser,
  validateNumericId('id'),
  asyncHandler(getBedroomById)
)

/**
 * @route   POST /api/bedrooms
 * @desc    Create a new bedroom
 * @access  Protected (Authenticated users with write permission)
 */
router.post(
  '/',
  authenticateUser,
  checkPermissions('write'),
  validateCreateBedroom,
  asyncHandler(createBedroom)
)

/**
 * @route   PUT /api/bedrooms/:id
 * @desc    Update bedroom by ID
 * @access  Protected (Authenticated users with update permission)
 */
router.put(
  '/:id',
  authenticateUser,
  validateNumericId('id'),
  checkPermissions('update'),
  validateUpdateBedroom,
  asyncHandler(updateBedroom)
)

/**
 * @route   DELETE /api/bedrooms/:id
 * @desc    Delete bedroom by ID (cascade deletes sensors and logs)
 * @access  Protected (Admin only)
 */
router.delete(
  '/:id',
  authenticateUser,
  validateNumericId('id'),
  authorizeRoles('admin'),
  asyncHandler(deleteBedroom)
)

export default router
