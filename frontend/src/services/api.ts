import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import {
  readStoredAuth,
  patchStoredTokens,
  clearStoredAuth,
} from '@/services/authStorage'
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

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

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

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    return data?.message || error.message || 'An unexpected error occurred'
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}

const isAuthUrl = (url: string): boolean =>
  url.includes('/auth/login') ||
  url.includes('/auth/refresh') ||
  url.includes('/auth/logout')

let redirectingToLogin = false

const endSessionAndRedirect = () => {
  accessToken = null
  clearStoredAuth()
  if (!redirectingToLogin && window.location.pathname !== '/login') {
    redirectingToLogin = true
    window.location.assign('/login')
  }
}

// Single-flight refresh: concurrent 401s share one /auth/refresh round-trip.
let refreshPromise: Promise<string> | null = null

const refreshSession = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const stored = readStoredAuth()
      if (!stored?.refreshToken) {
        throw new ApiError('No refresh token available')
      }
      const tokens = await rawAuthRefresh(stored.refreshToken)
      patchStoredTokens(tokens)
      accessToken = tokens.accessToken
      return tokens.accessToken
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

axiosInstance.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  }
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status

    if (
      status === 401 &&
      config &&
      !config._retry &&
      config.url &&
      !isAuthUrl(config.url)
    ) {
      config._retry = true
      try {
        const token = await refreshSession()
        config.headers.set('Authorization', `Bearer ${token}`)
        return axiosInstance(config)
      } catch (refreshError) {
        endSessionAndRedirect()
        throw new ApiError(getErrorMessage(refreshError), status)
      }
    }

    if (import.meta.env.DEV) {
      console.error('[API Error]', error.response?.data || error.message)
    }
    throw new ApiError(getErrorMessage(error), status)
  }
)

// Auth API (raw refresh bypasses the interceptor to avoid recursion)
const rawAuthRefresh = async (
  refreshToken: string
): Promise<TokenResponse> => {
  const response = await axiosInstance.post<ApiResponse<TokenResponse>>(
    '/auth/refresh',
    { refreshToken }
  )
  return response.data.data
}

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
  refresh: refreshSession,
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
