import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, setAuthToken, clearAuthToken } from '@/services/api'
import type { AuthUser, LoginCredentials, LoginResponse } from '@/types'

export type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

type AuthContextValue = AuthState & {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const AUTH_STORAGE_KEY = 'iot_auth'

type StoredAuth = {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)

  const persistAuth = (payload: LoginResponse) => {
    const { user, accessToken, refreshToken } = payload
    const stored: StoredAuth = { user, accessToken, refreshToken }
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // ignore storage errors
    }
    setAuthToken(accessToken)
    setState({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })
  }

  const clearPersistedAuth = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // ignore storage errors
    }
    clearAuthToken()
  }

  useEffect(() => {
    // Hydrate from localStorage on mount
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) {
        setState((prev) => ({ ...prev, isLoading: false }))
        return
      }

      const parsed: StoredAuth = JSON.parse(raw)
      if (parsed.accessToken) {
        setAuthToken(parsed.accessToken)
        setState({
          user: parsed.user,
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
        // Optionally validate current user
        authApi
          .me()
          .then((user) => {
            setState((prev) => ({
              ...prev,
              user,
              isAuthenticated: true,
              isLoading: false,
            }))
          })
          .catch(() => {
            // If token is invalid, clear session silently
            clearPersistedAuth()
            setState({
              ...initialState,
              isLoading: false,
            })
          })
        return
      }
    } catch {
      // ignore hydration errors
    }
    setState((prev) => ({ ...prev, isLoading: false }))
  }, [])

  const login = async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const data = await authApi.login(credentials)
      persistAuth(data)
    } catch (err) {
      clearPersistedAuth()
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      setState({
        ...initialState,
        isLoading: false,
        error: message,
      })
      throw err
    }
  }

  const refresh = async () => {
    if (!state.refreshToken) {
      throw new Error('No refresh token available')
    }
    try {
      const tokens = await authApi.refresh(state.refreshToken)
      setAuthToken(tokens.accessToken)
      setState((prev) => ({
        ...prev,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      }))
      try {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            user: state.user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          })
        )
      } catch {
        // ignore
      }
    } catch (err) {
      clearPersistedAuth()
      setState({
        ...initialState,
        isLoading: false,
      })
      throw err
    }
  }

  const logout = () => {
    clearPersistedAuth()
    setState({ ...initialState, isLoading: false })
  }

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, refresh }),
    [state]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
