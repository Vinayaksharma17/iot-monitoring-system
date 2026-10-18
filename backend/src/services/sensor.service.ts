import { query } from '../config/database.js'
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../middleware/error.middleware.js'
import { isForeignKeyViolation, isUniqueViolation } from '../utils/db.js'
import { CreateSensorDTO, UpdateSensorDTO } from '../types/index.js'

// ==========================================
// Sensor Service
// ==========================================

// One canonical projection of the sensors+bedrooms join. Keeping it in a
// single constant prevents the six near-identical copies that used to be
// scattered across the controller.
const SENSOR_WITH_BEDROOM_COLUMNS = `
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
  b.name as "bedroomName"`

const SENSOR_RETURNING_COLUMNS = `
  id, bedroom_id as "bedroomId", name, type, unit,
  min_value as "minValue", max_value as "maxValue",
  is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`

export const listSensors = async (bedroomId?: number) => {
  const conditions: string[] = []
  const values: unknown[] = []

  if (bedroomId !== undefined) {
    values.push(bedroomId)
    conditions.push(`s.bedroom_id = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await query(
    `SELECT ${SENSOR_WITH_BEDROOM_COLUMNS}
     FROM sensors s
     JOIN bedrooms b ON s.bedroom_id = b.id
     ${whereClause}
     ORDER BY b.name, s.type, s.name`,
    values
  )

  return result.rows
}

export const getSensorsByBedroomId = async (bedroomId: number) => {
  await assertBedroomExists(bedroomId)

  const result = await query(
    `SELECT ${SENSOR_WITH_BEDROOM_COLUMNS}
     FROM sensors s
     JOIN bedrooms b ON s.bedroom_id = b.id
     WHERE s.bedroom_id = $1
     ORDER BY s.type, s.name`,
    [bedroomId]
  )

  return result.rows
}

export const getSensorById = async (id: number) => {
  const result = await query(
    `SELECT ${SENSOR_WITH_BEDROOM_COLUMNS}
     FROM sensors s
     JOIN bedrooms b ON s.bedroom_id = b.id
     WHERE s.id = $1`,
    [id]
  )

  if (result.rows.length === 0) {
    throw new NotFoundError(`Sensor with ID ${id} not found`)
  }

  return result.rows[0]
}

export const createSensor = async (bedroomId: number, input: CreateSensorDTO) => {
  try {
    // Single INSERT. The FK constraint tells us if the bedroom is gone
    // and the unique(bedroom_id, name) constraint catches duplicates -
    // both without pre-flight SELECTs (which would be racy anyway).
    const result = await query(
      `INSERT INTO sensors (bedroom_id, name, type, unit, min_value, max_value, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${SENSOR_RETURNING_COLUMNS}`,
      [
        bedroomId,
        input.name,
        input.type,
        input.unit,
        input.minValue,
        input.maxValue,
        input.isActive ?? true,
      ]
    )

    return result.rows[0]
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      throw new NotFoundError(`Bedroom with ID ${bedroomId} not found`)
    }
    if (isUniqueViolation(error)) {
      throw new ConflictError(
        `Sensor with name "${input.name}" already exists in this bedroom`
      )
    }
    throw error
  }
}

export const updateSensor = async (id: number, updates: UpdateSensorDTO) => {
  // One SELECT to load the current bounds: needed to validate a partial
  // min/max update against the value that will remain in the row (the
  // DB check constraint would otherwise reject it as a 500).
  const current = await query(
    'SELECT id, min_value, max_value FROM sensors WHERE id = $1',
    [id]
  )

  if (current.rows.length === 0) {
    throw new NotFoundError(`Sensor with ID ${id} not found`)
  }

  const existing = current.rows[0]
  const nextMin = updates.minValue ?? Number(existing.min_value)
  const nextMax = updates.maxValue ?? Number(existing.max_value)

  if (nextMin >= nextMax) {
    throw new ValidationError('Min value must be less than max value')
  }

  const sets: string[] = []
  const values: unknown[] = []

  const columns: Array<[keyof UpdateSensorDTO, string]> = [
    ['name', 'name'],
    ['type', 'type'],
    ['unit', 'unit'],
    ['minValue', 'min_value'],
    ['maxValue', 'max_value'],
    ['isActive', 'is_active'],
  ]

  for (const [field, column] of columns) {
    if (updates[field] !== undefined) {
      sets.push(`${column} = $${values.length + 1}`)
      values.push(updates[field])
    }
  }

  if (sets.length === 0) {
    throw new ValidationError('No fields to update')
  }

  values.push(id)

  try {
    const result = await query(
      `UPDATE sensors SET ${sets.join(', ')} WHERE id = $${values.length}
       RETURNING ${SENSOR_RETURNING_COLUMNS}`,
      values
    )

    if (result.rows.length === 0) {
      throw new NotFoundError(`Sensor with ID ${id} not found`)
    }

    return result.rows[0]
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError(
        `Sensor with name "${updates.name}" already exists in this bedroom`
      )
    }
    throw error
  }
}

export const deleteSensor = async (id: number): Promise<void> => {
  // Cascade deletes associated logs at the database level.
  const result = await query('DELETE FROM sensors WHERE id = $1', [id])

  if (!result.rowCount) {
    throw new NotFoundError(`Sensor with ID ${id} not found`)
  }
}

export const listActiveSensors = async () => {
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

  return result.rows
}

const assertBedroomExists = async (bedroomId: number): Promise<void> => {
  const result = await query('SELECT id FROM bedrooms WHERE id = $1', [bedroomId])
  if (result.rows.length === 0) {
    throw new NotFoundError(`Bedroom with ID ${bedroomId} not found`)
  }
}
