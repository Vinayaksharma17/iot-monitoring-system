import axios from 'axios'
import type {
  Bedroom,
  Sensor,
  LatestReading,
  CreateBedroomInput,
  UpdateBedroomInput,
  CreateSensorInput,
  UpdateSensorInput,
  ApiResponse,
} from '@/types'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add Basic Auth for backend API
  auth: {
    username: 'admin@example.com',
    password: 'admin123',
  },
})

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[API Error]', error.response?.data || error.message)
    }
    return Promise.reject(error)
  }
)

// Bedroom API
export const bedroomApi = {
  getAll: async (): Promise<Bedroom[]> => {
    const response = await axiosInstance.get<ApiResponse<Bedroom[]>>(
      '/bedrooms'
    )
    return response.data.data || []
  },
  getById: async (id: number): Promise<Bedroom> => {
    const response = await axiosInstance.get<ApiResponse<Bedroom>>(
      `/bedrooms/${id}`
    )
    return response.data.data
  },
  create: async (data: CreateBedroomInput): Promise<Bedroom> => {
    const response = await axiosInstance.post<ApiResponse<Bedroom>>(
      '/bedrooms',
      data
    )
    return response.data.data
  },
  update: async (id: number, data: UpdateBedroomInput): Promise<Bedroom> => {
    const response = await axiosInstance.put<ApiResponse<Bedroom>>(
      `/bedrooms/${id}`,
      data
    )
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/bedrooms/${id}`)
  },
}

// Sensor API
export const sensorApi = {
  getAll: async (): Promise<Sensor[]> => {
    const response = await axiosInstance.get<ApiResponse<Sensor[]>>(
      '/sensors/active'
    )
    return response.data.data || []
  },
  getByBedroom: async (bedroomId: number): Promise<Sensor[]> => {
    const response = await axiosInstance.get<ApiResponse<Sensor[]>>(
      `/sensors/bedrooms/${bedroomId}`
    )
    return response.data.data || []
  },
  getById: async (id: number): Promise<Sensor> => {
    const response = await axiosInstance.get<ApiResponse<Sensor>>(
      `/sensors/${id}`
    )
    return response.data.data
  },
  create: async (
    data: CreateSensorInput & { bedroomId: number }
  ): Promise<Sensor> => {
    const { bedroomId, ...sensorData } = data
    const response = await axiosInstance.post<ApiResponse<Sensor>>(
      `/sensors/bedrooms/${bedroomId}`,
      sensorData
    )
    return response.data.data
  },
  update: async (id: number, data: UpdateSensorInput): Promise<Sensor> => {
    const response = await axiosInstance.put<ApiResponse<Sensor>>(
      `/sensors/${id}`,
      data
    )
    return response.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/sensors/${id}`)
  },
}

// Sensor Logs API
export const sensorLogApi = {
  getLatest: async (): Promise<LatestReading[]> => {
    const response = await axiosInstance.get<ApiResponse<LatestReading[]>>(
      '/sensor-logs/latest'
    )
    return response.data.data || []
  },
  getBySensor: async (
    sensorId: number,
    limit: number = 100
  ): Promise<LatestReading[]> => {
    const response = await axiosInstance.get<ApiResponse<LatestReading[]>>(
      `/sensor-logs/sensor/${sensorId}`,
      { params: { limit } }
    )
    return response.data.data || []
  },
}
