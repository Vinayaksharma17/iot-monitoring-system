import { query } from '../config/database.js'
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../middleware/error.middleware.js'
import { isUniqueViolation } from '../utils/db.js'
import { CreateBedroomDTO, UpdateBedroomDTO } from '../types/index.js'

// ==========================================
// Bedroom Service
// ==========================================
// All SQL lives here. Every statement is parameterized; uniqueness is
// enforced by the database (UNIQUE on bedrooms.name) so there is no
// check-then-insert race and no redundant round trips.

const BEDROOM_COLUMNS = `id, name, description, created_at as "createdAt", updated_at as "updatedAt"`

const normalizeDescription = (description?: string): string | null =>
  description && description.trim() !== '' ? description : null

export const listBedrooms = async () => {
  const result = await query(
    `SELECT ${BEDROOM_COLUMNS} FROM bedrooms ORDER BY name ASC`
  )
  return result.rows
}

export const getBedroomById = async (id: number) => {
  const result = await query(
    `SELECT ${BEDROOM_COLUMNS} FROM bedrooms WHERE id = $1`,
    [id]
  )

  if (result.rows.length === 0) {
    throw new NotFoundError(`Bedroom with ID ${id} not found`)
  }

  return result.rows[0]
}

export const createBedroom = async (input: CreateBedroomDTO) => {
  try {
    // ON CONFLICT DO NOTHING turns the uniqueness race into a single
    // atomic statement: no row returned means the name was taken.
    const result = await query(
      `INSERT INTO bedrooms (name, description) VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING
       RETURNING ${BEDROOM_COLUMNS}`,
      [input.name, normalizeDescription(input.description)]
    )

    if (result.rows.length === 0) {
      throw new ConflictError(`Bedroom with name "${input.name}" already exists`)
    }

    return result.rows[0]
  } catch (error) {
    // A concurrent insert may still win between the DO NOTHING check and
    // commit visibility; map that rare case to the same 409.
    if (isUniqueViolation(error)) {
      throw new ConflictError(`Bedroom with name "${input.name}" already exists`)
    }
    throw error
  }
}

export const updateBedroom = async (id: number, updates: UpdateBedroomDTO) => {
  const sets: string[] = []
  const values: unknown[] = []

  if (updates.name !== undefined) {
    sets.push(`name = $${values.length + 1}`)
    values.push(updates.name)
  }

  if (updates.description !== undefined) {
    sets.push(`description = $${values.length + 1}`)
    values.push(normalizeDescription(updates.description))
  }

  if (sets.length === 0) {
    throw new ValidationError('No fields to update')
  }

  values.push(id)

  try {
    // Single UPDATE: existence check, duplicate check and write happen
    // atomically (rowCount 0 => not found).
    const result = await query(
      `UPDATE bedrooms SET ${sets.join(', ')} WHERE id = $${values.length}
       RETURNING ${BEDROOM_COLUMNS}`,
      values
    )

    if (result.rows.length === 0) {
      throw new NotFoundError(`Bedroom with ID ${id} not found`)
    }

    return result.rows[0]
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError(
        `Bedroom with name "${updates.name}" already exists`
      )
    }
    throw error
  }
}

export const deleteBedroom = async (id: number): Promise<void> => {
  // Cascade deletes associated sensors and logs at the database level.
  const result = await query('DELETE FROM bedrooms WHERE id = $1', [id])

  if (!result.rowCount) {
    throw new NotFoundError(`Bedroom with ID ${id} not found`)
  }
}
