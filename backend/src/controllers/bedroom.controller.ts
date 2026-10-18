import { Request, Response } from 'express'
import { CreateBedroomDTO, UpdateBedroomDTO } from '../types/index.js'
import * as bedroomService from '../services/bedroom.service.js'

// ==========================================
// Bedroom Controller (thin HTTP layer)
// ==========================================

/**
 * Get all bedrooms
 * @route GET /api/bedrooms
 */
export const getAllBedrooms = async (_req: Request, res: Response): Promise<void> => {
  const bedrooms = await bedroomService.listBedrooms()

  res.status(200).json({
    success: true,
    data: bedrooms,
    message: 'Bedrooms retrieved successfully',
  })
}

/**
 * Get bedroom by ID
 * @route GET /api/bedrooms/:id
 */
export const getBedroomById = async (req: Request, res: Response): Promise<void> => {
  const bedroom = await bedroomService.getBedroomById(Number(req.params.id))

  res.status(200).json({
    success: true,
    data: bedroom,
    message: 'Bedroom retrieved successfully',
  })
}

/**
 * Create a new bedroom
 * @route POST /api/bedrooms
 */
export const createBedroom = async (req: Request, res: Response): Promise<void> => {
  const bedroom = await bedroomService.createBedroom(req.body as CreateBedroomDTO)

  res.status(201).json({
    success: true,
    data: bedroom,
    message: 'Bedroom created successfully',
  })
}

/**
 * Update an existing bedroom
 * @route PUT /api/bedrooms/:id
 */
export const updateBedroom = async (req: Request, res: Response): Promise<void> => {
  const bedroom = await bedroomService.updateBedroom(
    Number(req.params.id),
    req.body as UpdateBedroomDTO
  )

  res.status(200).json({
    success: true,
    data: bedroom,
    message: 'Bedroom updated successfully',
  })
}

/**
 * Delete a bedroom
 * @route DELETE /api/bedrooms/:id
 */
export const deleteBedroom = async (req: Request, res: Response): Promise<void> => {
  await bedroomService.deleteBedroom(Number(req.params.id))

  res.status(204).send()
}
