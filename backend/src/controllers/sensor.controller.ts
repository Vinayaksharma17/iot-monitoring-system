import { Request, Response } from 'express'
import { query } from '../config/database.js'
import { CreateSensorDTO, UpdateSensorDTO } from '../types/index.js'

// ==========================================
// Sensor Controller
// ==========================================

/**
 * Get all sensors for a specific bedroom
 * @route GET /api/bedrooms/:bedroomId/sensors
 */
export const getSensorsByBedroomId = async (req: Request, res: Response) => {
  try {
    const { bedroomId } = req.params

    // Check if bedroom exists
    const bedroomCheck = await query('SELECT id FROM bedrooms WHERE id = $1', [
      bedroomId,
    ])

    if (bedroomCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Bedroom with ID ${bedroomId} not found`,
      })
    }

    const result = await query(
      `SELECT 
        s.id, 
        s.bedroom_id as "bedroomId", 
        s.name, 
        s.type, 
        s.unit, 
        s.min_value as "minValue", 
        s.max_value as "maxValue", 
        s.is_active as "isActive",
        s.created_at as "createdAt", 
        s.updated_at as "updatedAt",
        b.name as "bedroomName"
      FROM sensors s
      JOIN bedrooms b ON s.bedroom_id = b.id
      WHERE s.bedroom_id = $1
      ORDER BY s.type, s.name`,
      [bedroomId]
    )

    res.status(200).json({
      success: true,
      data: result.rows,
      message: 'Sensors retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching sensors:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensors',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Get sensor by ID
 * @route GET /api/sensors/:id
 */
export const getSensorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await query(
      `SELECT 
        s.id, 
        s.bedroom_id as "bedroomId", 
        s.name, 
        s.type, 
        s.unit, 
        s.min_value as "minValue", 
        s.max_value as "maxValue", 
        s.is_active as "isActive",
        s.created_at as "createdAt", 
        s.updated_at as "updatedAt",
        b.name as "bedroomName"
      FROM sensors s
      JOIN bedrooms b ON s.bedroom_id = b.id
      WHERE s.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sensor with ID ${id} not found`,
      })
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Sensor retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching sensor:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Create a new sensor for a bedroom
 * @route POST /api/bedrooms/:bedroomId/sensors
 */
export const createSensor = async (req: Request, res: Response) => {
  try {
    const { bedroomId } = req.params
    const { name, type, unit, minValue, maxValue, isActive }: CreateSensorDTO =
      req.body

    // Check if bedroom exists
    const bedroomCheck = await query('SELECT id FROM bedrooms WHERE id = $1', [
      bedroomId,
    ])

    if (bedroomCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Bedroom with ID ${bedroomId} not found`,
      })
    }

    // Check for duplicate sensor name in the same bedroom
    const duplicateCheck = await query(
      'SELECT id FROM sensors WHERE bedroom_id = $1 AND name = $2',
      [bedroomId, name]
    )

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Sensor with name "${name}" already exists in this bedroom`,
      })
    }

    // Insert new sensor
    const result = await query(
      `INSERT INTO sensors (bedroom_id, name, type, unit, min_value, max_value, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, bedroom_id as "bedroomId", name, type, unit, min_value as "minValue", max_value as "maxValue", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`,
      [bedroomId, name, type, unit, minValue, maxValue, isActive ?? true]
    )

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Sensor created successfully',
    })
  } catch (error) {
    console.error('Error creating sensor:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create sensor',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Update an existing sensor
 * @route PUT /api/sensors/:id
 */
export const updateSensor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, type, unit, minValue, maxValue, isActive }: UpdateSensorDTO =
      req.body

    // Check if sensor exists
    const sensorCheck = await query(
      'SELECT id, bedroom_id FROM sensors WHERE id = $1',
      [id]
    )

    if (sensorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sensor with ID ${id} not found`,
      })
    }

    const bedroomId = sensorCheck.rows[0].bedroom_id

    // Check for duplicate name (if name is being updated)
    if (name) {
      const duplicateCheck = await query(
        'SELECT id FROM sensors WHERE bedroom_id = $1 AND name = $2 AND id != $3',
        [bedroomId, name, id]
      )

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Sensor with name "${name}" already exists in this bedroom`,
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

    if (type !== undefined) {
      updates.push(`type = $${paramCount++}`)
      values.push(type)
    }

    if (unit !== undefined) {
      updates.push(`unit = $${paramCount++}`)
      values.push(unit)
    }

    if (minValue !== undefined) {
      updates.push(`min_value = $${paramCount++}`)
      values.push(minValue)
    }

    if (maxValue !== undefined) {
      updates.push(`max_value = $${paramCount++}`)
      values.push(maxValue)
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`)
      values.push(isActive)
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      })
    }

    values.push(id)
    const updateQuery = `
      UPDATE sensors 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, bedroom_id as "bedroomId", name, type, unit, min_value as "minValue", max_value as "maxValue", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `

    const result = await query(updateQuery, values)

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Sensor updated successfully',
    })
  } catch (error) {
    console.error('Error updating sensor:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update sensor',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Delete a sensor
 * @route DELETE /api/sensors/:id
 */
export const deleteSensor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Check if sensor exists
    const sensorCheck = await query('SELECT id FROM sensors WHERE id = $1', [
      id,
    ])

    if (sensorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sensor with ID ${id} not found`,
      })
    }

    // Delete sensor (cascade will delete associated logs)
    await query('DELETE FROM sensors WHERE id = $1', [id])

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting sensor:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete sensor',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Get all active sensors (for Node-RED)
 * @route GET /api/sensors/active
 */
export const getActiveSensors = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT 
        s.id as "sensorId",
        s.name as "sensorName",
        b.name as "bedroomName",
        s.type,
        s.min_value as "minValue",
        s.max_value as "maxValue"
      FROM sensors s
      JOIN bedrooms b ON s.bedroom_id = b.id
      WHERE s.is_active = true
      ORDER BY b.name, s.name`
    )

    res.status(200).json({
      success: true,
      data: result.rows,
      message: 'Active sensors retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching active sensors:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sensors',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
