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
  AuthUser,
  LoginCredentials,
  LoginResponse,
  TokenResponse,
} from '@/types'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let accessToken: string | null = null

export const setAuthToken = (token: string | null) => {
  accessToken = token
}

export const clearAuthToken = () => {
  accessToken = null
}

const getErrorMessage = (error: any): string => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'An unexpected error occurred'
  )
}

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

const AUTH_STORAGE_KEY = 'iot_auth'

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url || ''

    // On expired/invalid credentials, clear the session and return to login.
    // (Skip endpoints where a 401 is an expected result, e.g. bad login.)
    if (status === 401 && !url.includes('/auth/login')) {
      clearAuthToken()
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      } catch {
        // ignore storage errors
      }
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    if (import.meta.env.DEV) {
      console.error('[API Error]', error.response?.data || error.message)
    }
    const message = getErrorMessage(error)
    return Promise.reject(new Error(message))
  }
)

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials
    )
    return response.data.data
  },
  me: async (): Promise<AuthUser> => {
    const response = await axiosInstance.get<ApiResponse<AuthUser>>('/auth/me')
    return response.data.data
  },
  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await axiosInstance.post<ApiResponse<TokenResponse>>(
      '/auth/refresh',
      { refreshToken }
    )
    return response.data.data
  },
  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout')
  },
}

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
    const response = await axiosInstance.get<ApiResponse<Sensor[]>>('/sensors')
    return response.data.data || []
  },
  getActive: async (): Promise<Sensor[]> => {
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
