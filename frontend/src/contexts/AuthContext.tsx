import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { authApi, setAuthToken, clearAuthToken } from '@/services/api'
import {
  readStoredAuth,
  writeStoredAuth,
  clearStoredAuth,
} from '@/services/authStorage'
import type { AuthUser, LoginCredentials } from '@/types'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = readStoredAuth()
    if (!stored) {
      setStatus('unauthenticated')
      return
    }

    setAuthToken(stored.accessToken)
    setUser(stored.user)
    setStatus('authenticated')

    // Re-validate the cached user in the background (the axios interceptor
    // transparently refreshes an expired access token if possible).
    authApi
      .me()
      .then((freshUser) => setUser(freshUser))
      .catch(() => {
        // Session could not be recovered; the interceptor has already
        // redirected to /login if a hard session end occurred.
        clearAuthToken()
        setUser(null)
        setStatus('unauthenticated')
      })
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setError(null)
    try {
      const data = await authApi.login(credentials)
      writeStoredAuth(data)
      setAuthToken(data.accessToken)
      setUser(data.user)
      setStatus('authenticated')
    } catch (err) {
      clearStoredAuth()
      clearAuthToken()
      setUser(null)
      setStatus('unauthenticated')
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(message)
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    authApi.logout().catch(() => {
      // best effort; local session is cleared regardless
    })
    clearStoredAuth()
    clearAuthToken()
    setUser(null)
    setError(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      error,
      login,
      logout,
    }),
    [user, status, error, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
