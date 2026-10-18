import { Request, Response } from 'express'
import {
  CreateSensorDTO,
  SensorListQueryParams,
  UpdateSensorDTO,
} from '../types/index.js'
import * as sensorService from '../services/sensor.service.js'

// ==========================================
// Sensor Controller (thin HTTP layer)
// ==========================================

/**
 * Get all sensors (active and inactive), optionally filtered by bedroom
 * @route GET /api/sensors
 * @query bedroomId
 */
export const getAllSensors = async (req: Request, res: Response): Promise<void> => {
  const { bedroomId } = req.query as SensorListQueryParams

  const sensors = await sensorService.listSensors(bedroomId)

  res.status(200).json({
    success: true,
    data: sensors,
    message: 'Sensors retrieved successfully',
  })
}

/**
 * Get all sensors for a specific bedroom
 * @route GET /api/sensors/bedrooms/:bedroomId
 */
export const getSensorsByBedroomId = async (
  req: Request,
  res: Response
): Promise<void> => {
  const sensors = await sensorService.getSensorsByBedroomId(
    Number(req.params.bedroomId)
  )

  res.status(200).json({
    success: true,
    data: sensors,
    message: 'Sensors retrieved successfully',
  })
}

/**
 * Get sensor by ID
 * @route GET /api/sensors/:id
 */
export const getSensorById = async (req: Request, res: Response): Promise<void> => {
  const sensor = await sensorService.getSensorById(Number(req.params.id))

  res.status(200).json({
    success: true,
    data: sensor,
    message: 'Sensor retrieved successfully',
  })
}

/**
 * Create a new sensor for a bedroom
 * @route POST /api/sensors/bedrooms/:bedroomId
 */
export const createSensor = async (req: Request, res: Response): Promise<void> => {
  const sensor = await sensorService.createSensor(
    Number(req.params.bedroomId),
    req.body as CreateSensorDTO
  )

  res.status(201).json({
    success: true,
    data: sensor,
    message: 'Sensor created successfully',
  })
}

/**
 * Update an existing sensor
 * @route PUT /api/sensors/:id
 */
export const updateSensor = async (req: Request, res: Response): Promise<void> => {
  const sensor = await sensorService.updateSensor(
    Number(req.params.id),
    req.body as UpdateSensorDTO
  )

  res.status(200).json({
    success: true,
    data: sensor,
    message: 'Sensor updated successfully',
  })
}

/**
 * Delete a sensor
 * @route DELETE /api/sensors/:id
 */
export const deleteSensor = async (req: Request, res: Response): Promise<void> => {
  await sensorService.deleteSensor(Number(req.params.id))

  res.status(204).send()
}

/**
 * Get all active sensors (for Node-RED)
 * @route GET /api/sensors/active
 */
export const getActiveSensors = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const sensors = await sensorService.listActiveSensors()

  res.status(200).json({
    success: true,
    data: sensors,
    message: 'Active sensors retrieved successfully',
  })
}
