import { format, isValid, parseISO } from 'date-fns'

export const safeFormatDate = (
  value: string | Date | null | undefined,
  dateFormat: string,
  fallback = '—'
): string => {
  if (value === null || value === undefined || value === '') return fallback
  const date = value instanceof Date ? value : parseISO(value)
  if (!isValid(date)) return fallback
  try {
    return format(date, dateFormat)
  } catch {
    return fallback
  }
}

export const safeNumber = (
  value: string | number | null | undefined,
  digits = 2,
  fallback = '—'
): string => {
  if (value === null || value === undefined || value === '') return fallback
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return num.toFixed(digits)
}
