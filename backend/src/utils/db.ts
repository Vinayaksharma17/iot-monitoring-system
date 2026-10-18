// ==========================================
// PostgreSQL Error Helpers
// ==========================================

/** Extract a PG SQLSTATE code (e.g. "23505") from an unknown error. */
export const getDbErrorCode = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string') return code
  }
  return undefined
}

export const isUniqueViolation = (error: unknown): boolean =>
  getDbErrorCode(error) === '23505'

export const isForeignKeyViolation = (error: unknown): boolean =>
  getDbErrorCode(error) === '23503'
