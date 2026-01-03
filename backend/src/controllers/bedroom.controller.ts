import { Request, Response } from 'express'
import { query } from '../config/database.js'
import { Bedroom, CreateBedroomDTO, UpdateBedroomDTO } from '../types/index.js'

// ==========================================
// Bedroom Controller
// ==========================================

/**
 * Get all bedrooms
 * @route GET /api/bedrooms
 */
export const getAllBedrooms = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, description, created_at as "createdAt", updated_at as "updatedAt" FROM bedrooms ORDER BY name ASC'
    )

    res.status(200).json({
      success: true,
      data: result.rows,
      message: 'Bedrooms retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching bedrooms:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bedrooms',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Get bedroom by ID
 * @route GET /api/bedrooms/:id
 */
export const getBedroomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await query(
      'SELECT id, name, description, created_at as "createdAt", updated_at as "updatedAt" FROM bedrooms WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Bedroom with ID ${id} not found`,
      })
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Bedroom retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching bedroom:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bedroom',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Create a new bedroom
 * @route POST /api/bedrooms
 */
export const createBedroom = async (req: Request, res: Response) => {
  try {
    const { name, description }: CreateBedroomDTO = req.body

    // Check for duplicate name
    const duplicateCheck = await query(
      'SELECT id FROM bedrooms WHERE name = $1',
      [name]
    )

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Bedroom with name "${name}" already exists`,
      })
    }

    // Insert new bedroom
    const result = await query(
      'INSERT INTO bedrooms (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at as "createdAt", updated_at as "updatedAt"',
      [name, description || null]
    )

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Bedroom created successfully',
    })
  } catch (error) {
    console.error('Error creating bedroom:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create bedroom',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Update an existing bedroom
 * @route PUT /api/bedrooms/:id
 */
export const updateBedroom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description }: UpdateBedroomDTO = req.body

    // Check if bedroom exists
    const bedroomCheck = await query('SELECT id FROM bedrooms WHERE id = $1', [
      id,
    ])

    if (bedroomCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Bedroom with ID ${id} not found`,
      })
    }

    // Check for duplicate name (if name is being updated)
    if (name) {
      const duplicateCheck = await query(
        'SELECT id FROM bedrooms WHERE name = $1 AND id != $2',
        [name, id]
      )

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Bedroom with name "${name}" already exists`,
        })
      }
    }

    // Build dynamic update query
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      values.push(name)
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`)
      values.push(description)
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      })
    }

    values.push(id)
    const updateQuery = `
      UPDATE bedrooms 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, description, created_at as "createdAt", updated_at as "updatedAt"
    `

    const result = await query(updateQuery, values)

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Bedroom updated successfully',
    })
  } catch (error) {
    console.error('Error updating bedroom:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update bedroom',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Delete a bedroom
 * @route DELETE /api/bedrooms/:id
 */
export const deleteBedroom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Check if bedroom exists
    const bedroomCheck = await query('SELECT id FROM bedrooms WHERE id = $1', [
      id,
    ])

    if (bedroomCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Bedroom with ID ${id} not found`,
      })
    }

    // Delete bedroom (cascade will delete associated sensors and logs)
    await query('DELETE FROM bedrooms WHERE id = $1', [id])

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting bedroom:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete bedroom',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
