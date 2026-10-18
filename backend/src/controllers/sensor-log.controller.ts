import { Request, Response } from 'express'
import * as sensorLogService from '../services/sensor-log.service.js'

// ==========================================
// Sensor Log Controller (thin HTTP layer, read-only)
// ==========================================

/**
 * Get sensor logs with optional filters
 * @route GET /api/sensor-logs
 * @query roomName, sensorName, startDate, endDate, limit
 */
export const getSensorLogs = async (req: Request, res: Response): Promise<void> => {
  const { roomName, sensorName, startDate, endDate, limit } = req.query as {
    roomName?: string
    sensorName?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }

  const { rows, limit: appliedLimit } = await sensorLogService.getSensorLogs({
    roomName,
    sensorName,
    startDate,
    endDate,
    limit,
  })

  res.status(200).json({
    success: true,
    data: rows,
    meta: {
      count: rows.length,
      limit: appliedLimit,
      filters: { roomName, sensorName, startDate, endDate },
    },
    message: 'Sensor logs retrieved successfully',
  })
}

/**
 * Get historical readings for a single sensor
 * @route GET /api/sensor-logs/sensor/:sensorId
 * @query startDate, endDate, limit
 */
export const getSensorLogsBySensorId = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { sensorId } = req.params
  const { startDate, endDate, limit } = req.query as {
    startDate?: Date
    endDate?: Date
    limit?: number
  }

  const { rows, limit: appliedLimit } =
    await sensorLogService.getSensorLogsBySensorId(Number(sensorId), {
      startDate,
      endDate,
      limit,
    })

  res.status(200).json({
    success: true,
    data: rows,
    meta: {
      count: rows.length,
      limit: appliedLimit,
      filters: { sensorId, startDate, endDate },
    },
    message: 'Sensor logs retrieved successfully',
  })
}

/**
 * Get latest reading for each sensor
 * @route GET /api/sensor-logs/latest
 */
export const getLatestReadings = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const readings = await sensorLogService.getLatestReadings()

  res.status(200).json({
    success: true,
    data: readings,
    message: 'Latest sensor readings retrieved successfully',
  })
}

/**
 * Get aggregated statistics for sensor readings
 * @route GET /api/sensor-logs/statistics
 * @query startDate, endDate, roomName, sensorName
 */
export const getStatistics = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate, roomName, sensorName } = req.query as {
    startDate?: Date
    endDate?: Date
    roomName?: string
    sensorName?: string
  }

  const statistics = await sensorLogService.getStatistics({
    startDate,
    endDate,
    roomName,
    sensorName,
  })

  res.status(200).json({
    success: true,
    data: statistics,
    meta: {
      filters: { startDate, endDate, roomName, sensorName },
    },
    message: 'Sensor statistics retrieved successfully',
  })
}
