// Backend returns camelCase for timestamps
export interface Bedroom {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Sensor {
  id: number
  bedroomId: number
  name: string
  type: string
  unit: string
  minValue: number | string | null
  maxValue: number | string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  bedroomName?: string // Optional, included in some responses
}

export interface SensorLog {
  id: number
  sensorId: number
  value: string | number  // Backend returns string
  timestamp: string
  createdAt?: string
  roomName?: string
  sensorName?: string
}

export interface LatestReading {
  id?: number
  bedroomName: string
  sensorName: string
  sensorType: string
  value: string | number  // Backend returns string
  unit: string
  timestamp: string
}

export interface SensorStatistics {
  sensorId: number
  sensorName: string
  bedroomName: string
  avgValue: number
  minValue: number
  maxValue: number
  readingCount: number
}

export interface CreateBedroomInput {
  name: string
  description: string
}

export interface UpdateBedroomInput {
  name?: string
  description?: string
}

export interface CreateSensorInput {
  name: string
  type: string
  unit: string
  minValue?: number
  maxValue?: number
  isActive?: boolean
}

export interface UpdateSensorInput {
  name?: string
  type?: string
  unit?: string
  minValue?: number
  maxValue?: number
  isActive?: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}
