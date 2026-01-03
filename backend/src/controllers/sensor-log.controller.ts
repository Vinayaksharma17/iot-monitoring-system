import { Request, Response } from 'express'
import { query } from '../config/database.js'
import { SensorLogQueryParams, StatisticsQueryParams } from '../types/index.js'

// ==========================================
// Sensor Log Controller (Read-Only)
// ==========================================

/**
 * Get sensor logs with optional filters
 * @route GET /api/sensor-logs
 * @query roomName, sensorName, startDate, endDate, limit
 */
export const getSensorLogs = async (req: Request, res: Response) => {
  try {
    const {
      roomName,
      sensorName,
      startDate,
      endDate,
      limit = 100,
    }: SensorLogQueryParams = req.query

    // Validate and cap limit
    const maxLimit = 1000
    const validLimit = Math.min(Number(limit) || 100, maxLimit)

    // Build dynamic query
    const conditions: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (roomName) {
      conditions.push(`room_name = $${paramCount++}`)
      values.push(roomName)
    }

    if (sensorName) {
      conditions.push(`sensor_name = $${paramCount++}`)
      values.push(sensorName)
    }

    if (startDate) {
      conditions.push(`timestamp >= $${paramCount++}`)
      values.push(startDate)
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramCount++}`)
      values.push(endDate)
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const queryText = `
      SELECT 
        id,
        sensor_id as "sensorId",
        room_name as "roomName",
        sensor_name as "sensorName",
        timestamp,
        value
      FROM sensor_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramCount}
    `

    values.push(validLimit)

    const result = await query(queryText, values)

    res.status(200).json({
      success: true,
      data: result.rows,
      meta: {
        count: result.rows.length,
        limit: validLimit,
        filters: { roomName, sensorName, startDate, endDate },
      },
      message: 'Sensor logs retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching sensor logs:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor logs',
    //   error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Get latest reading for each sensor
 * @route GET /api/sensor-logs/latest
 */
export const getLatestReadings = async (req: Request, res: Response) => {
  try {
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

    res.status(200).json({
      success: true,
      data: result.rows,
      message: 'Latest sensor readings retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching latest readings:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest readings',
    //   error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Get aggregated statistics for sensor readings
 * @route GET /api/sensor-logs/statistics
 * @query startDate, endDate, roomName, sensorName
 */
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, roomName, sensorName }: StatisticsQueryParams =
      req.query

    // Build dynamic query
    const conditions: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (startDate) {
      conditions.push(`sl.timestamp >= $${paramCount++}`)
      values.push(startDate)
    }

    if (endDate) {
      conditions.push(`sl.timestamp <= $${paramCount++}`)
      values.push(endDate)
    }

    if (roomName) {
      conditions.push(`b.name = $${paramCount++}`)
      values.push(roomName)
    }

    if (sensorName) {
      conditions.push(`s.name = $${paramCount++}`)
      values.push(sensorName)
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const queryText = `
      SELECT 
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
      ORDER BY b.name, s.name
    `

    const result = await query(queryText, values)

    res.status(200).json({
      success: true,
      data: result.rows,
      meta: {
        filters: { startDate, endDate, roomName, sensorName },
      },
      message: 'Sensor statistics retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    //   error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
