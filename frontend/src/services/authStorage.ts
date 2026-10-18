import { z } from 'zod'
import type { LoginResponse } from '@/types'

export const AUTH_STORAGE_KEY = 'iot_auth'

const authUserSchema = z.object({
  id: z.number(),
  email: z.string(),
  role: z.enum(['admin', 'viewer']),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const storedAuthSchema = z.object({
  user: authUserSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
})

export type StoredAuth = z.infer<typeof storedAuthSchema>

export const readStoredAuth = (): StoredAuth | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = storedAuthSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export const writeStoredAuth = (payload: LoginResponse): StoredAuth => {
  const stored: StoredAuth = {
    user: payload.user,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  }
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // storage full or unavailable; session stays memory-only
  }
  return stored
}

export const patchStoredTokens = (
  tokens: { accessToken: string; refreshToken: string }
): void => {
  const current = readStoredAuth()
  if (!current) return
  try {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ ...current, ...tokens })
    )
  } catch {
    // ignore storage errors
  }
}

export const clearStoredAuth = (): void => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}
