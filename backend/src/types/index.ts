// ==========================================
// Core Entity Interfaces
// ==========================================

/**
 * Bedroom entity representing a room in the apartment
 */
export interface Bedroom {
  id: number
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Sensor entity representing a temperature or humidity sensor
 */
export interface Sensor {
  id: number
  bedroomId: number
  name: string
  type: 'temperature' | 'humidity'
  unit: string
  minValue: number
  maxValue: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Sensor log entry representing a single sensor reading
 */
export interface SensorLog {
  id: number
  sensorId: number
  roomName: string
  sensorName: string
  timestamp: Date
  value: number
}

// ==========================================
// Data Transfer Objects (DTOs)
// ==========================================

/**
 * DTO for creating a new bedroom
 */
export interface CreateBedroomDTO {
  name: string
  description?: string
}

/**
 * DTO for updating an existing bedroom
 */
export interface UpdateBedroomDTO {
  name?: string
  description?: string
}

/**
 * DTO for creating a new sensor
 */
export interface CreateSensorDTO {
  name: string
  type: 'temperature' | 'humidity'
  unit: string
  minValue: number
  maxValue: number
  isActive?: boolean
}

/**
 * DTO for updating an existing sensor
 */
export interface UpdateSensorDTO {
  name?: string
  type?: 'temperature' | 'humidity'
  unit?: string
  minValue?: number
  maxValue?: number
  isActive?: boolean
}

// ==========================================
// API Response Types
// ==========================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ==========================================
// Extended Types for API Responses
// ==========================================

/**
 * Sensor with bedroom details
 */
export interface SensorWithBedroom extends Sensor {
  bedroomName: string
}

/**
 * Statistics for sensor readings
 */
export interface SensorStatistics {
  roomName: string
  sensorName: string
  minValue: number
  maxValue: number
  avgValue: number
  readingCount: number
}

/**
 * Latest sensor reading
 */
export interface LatestReading {
  bedroomName: string
  sensorName: string
  sensorType: 'temperature' | 'humidity'
  unit: string
  value: number
  timestamp: Date
}

/**
 * Active sensor info for Node-RED
 */
export interface ActiveSensorInfo {
  sensorId: number
  sensorName: string
  bedroomName: string
  type: 'temperature' | 'humidity'
  minValue: number
  maxValue: number
}

// ==========================================
// Query Parameter Types
// ==========================================

/**
 * Query parameters for sensor logs
 */
export interface SensorLogQueryParams {
  roomName?: string
  sensorName?: string
  startDate?: string
  endDate?: string
  limit?: number
}

/**
 * Query parameters for statistics
 */
export interface StatisticsQueryParams {
  startDate?: string
  endDate?: string
  roomName?: string
  sensorName?: string
}
