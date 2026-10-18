import { query } from '../config/database.js'

// ==========================================
// Sensor Log Service (Read-Only)
// ==========================================

export interface SensorLogFilters {
  roomName?: string
  sensorName?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}

export interface StatisticsFilters {
  roomName?: string
  sensorName?: string
  startDate?: Date
  endDate?: Date
}

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 1000

const clampLimit = (limit?: number): number => {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_LIMIT
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT)
}

// Filters arrive pre-validated/coerced from the Joi query schemas; this
// only decides which parameterized fragments to include.
const buildFilters = (
  filters: { roomName?: string; sensorName?: string; startDate?: Date; endDate?: Date },
  prefix = ''
): { conditions: string[]; values: unknown[] } => {
  const conditions: string[] = []
  const values: unknown[] = []
  const col = (name: string) => `${prefix}${name}`

  if (filters.roomName) {
    values.push(filters.roomName)
    conditions.push(`${col('room_name')} = $${values.length}`)
  }

  if (filters.sensorName) {
    values.push(filters.sensorName)
    conditions.push(`${col('sensor_name')} = $${values.length}`)
  }

  if (filters.startDate) {
    values.push(filters.startDate)
    conditions.push(`${col('timestamp')} >= $${values.length}`)
  }

  if (filters.endDate) {
    values.push(filters.endDate)
    conditions.push(`${col('timestamp')} <= $${values.length}`)
  }

  return { conditions, values }
}

export const getSensorLogs = async (filters: SensorLogFilters) => {
  const limit = clampLimit(filters.limit)
  const { conditions, values } = buildFilters(filters)

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  values.push(limit)

  const result = await query(
    `SELECT
      id,
      sensor_id as "sensorId",
      room_name as "roomName",
      sensor_name as "sensorName",
      timestamp,
      value
     FROM sensor_logs
     ${whereClause}
     ORDER BY timestamp DESC
     LIMIT $${values.length}`,
    values
  )

  return { rows: result.rows, limit }
}

export const getSensorLogsBySensorId = async (
  sensorId: number,
  filters: Omit<SensorLogFilters, 'roomName' | 'sensorName'>
) => {
  const limit = clampLimit(filters.limit)
  const values: unknown[] = [sensorId]
  const conditions: string[] = ['sl.sensor_id = $1']

  if (filters.startDate) {
    values.push(filters.startDate)
    conditions.push(`sl.timestamp >= $${values.length}`)
  }

  if (filters.endDate) {
    values.push(filters.endDate)
    conditions.push(`sl.timestamp <= $${values.length}`)
  }

  values.push(limit)

  const result = await query(
    `SELECT
      sl.id,
      sl.sensor_id as "sensorId",
      b.name AS "bedroomName",
      s.name AS "sensorName",
      s.type AS "sensorType",
      s.unit,
      sl.value,
      sl.timestamp
     FROM sensor_logs sl
     JOIN sensors s ON sl.sensor_id = s.id
     JOIN bedrooms b ON s.bedroom_id = b.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY sl.timestamp DESC
     LIMIT $${values.length}`,
    values
  )

  return { rows: result.rows, limit }
}

export const getLatestReadings = async () => {
  // Served by idx_sensor_logs_sensor_id_timestamp (migration 002):
  // DISTINCT ON (sensor_id) ... ORDER BY sensor_id, timestamp DESC is a
  // pure index backwards scan per sensor.
  const result = await query(`
    SELECT DISTINCT ON (sl.sensor_id)
      b.name AS "bedroomName",
      s.name AS "sensorName",
      s.type AS "sensorType",
      s.unit,
      sl.value,
      sl.timestamp
    FROM sensor_logs sl
    JOIN sensors s ON sl.sensor_id = s.id
    JOIN bedrooms b ON s.bedroom_id = b.id
    WHERE s.is_active = TRUE
    ORDER BY sl.sensor_id, sl.timestamp DESC
  `)

  return result.rows
}

export const getStatistics = async (filters: StatisticsFilters) => {
  const { conditions, values } = buildFilters(filters, 'sl.')
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await query(
    `SELECT
      b.name AS "roomName",
      s.name AS "sensorName",
      s.type AS "sensorType",
      s.unit,
      COUNT(sl.id) AS "readingCount",
      ROUND(MIN(sl.value)::numeric, 2) AS "minValue",
      ROUND(MAX(sl.value)::numeric, 2) AS "maxValue",
      ROUND(AVG(sl.value)::numeric, 2) AS "avgValue",
      MIN(sl.timestamp) AS "firstReading",
      MAX(sl.timestamp) AS "lastReading"
     FROM sensors s
     JOIN bedrooms b ON s.bedroom_id = b.id
     LEFT JOIN sensor_logs sl ON s.id = sl.sensor_id
     ${whereClause}
     GROUP BY b.name, s.name, s.type, s.unit
     HAVING COUNT(sl.id) > 0
     ORDER BY b.name, s.name`,
    values
  )

  return result.rows
}
