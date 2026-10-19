import { env } from '../config/env.js'
import { query } from '../config/database.js'
import { logger } from '../middleware/logger.middleware.js'

// ==========================================
// Data Retention Service
// ==========================================
// Keeps the sensor_logs table (heap + all indexes) within a fixed disk
// budget by deleting the OLDEST raw readings in small batches.
//
// Sizing model: targetRows = capBytes / RETENTION_BYTES_PER_ROW, where the
// bytes-per-row constant was measured on the live demo database
// (243 B/row including all four indexes). Deletion decisions are made from
// the live row count (pg_class.reltuples) rather than the physical file
// size: the physical size includes free pages that VACUUM cannot always
// return to the OS, and deleting against that number would silently
// over-delete on every run.
//
// Every run: measure → delete exactly the row excess (oldest first,
// batched with pauses so inserts/reads are never blocked) →
// VACUUM (ANALYZE) so disk is reclaimed and stats stay fresh.

const TABLE = 'sensor_logs'
const BATCH_ROWS = 20_000
const BATCH_PAUSE_MS = 50
const MAX_BATCHES_PER_RUN = 5_000 // hard safety cap: 100M rows per run
const BYTES_PER_GB = 1024 ** 3
const BYTES_PER_MB = 1024 ** 2

export interface RetentionRunResult {
  capBytes: number
  bytesBefore: number
  bytesAfter: number
  liveRowsBefore: number
  targetRows: number
  rowsDeleted: number
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const fmtMb = (bytes: number): string =>
  `${(bytes / BYTES_PER_MB).toFixed(1)} MB`

const tableBytes = async (): Promise<number> => {
  const { rows } = await query(
    `SELECT pg_total_relation_size($1::regclass)::bigint AS bytes`,
    [TABLE]
  )
  return Number(rows[0]?.bytes ?? 0)
}

/** Live row count via pg_class.reltuples (fresh after ANALYZE); exact count as fallback. */
const liveRowCount = async (): Promise<number> => {
  const { rows } = await query(
    `SELECT reltuples::bigint AS reltuples
       FROM pg_class
      WHERE oid = $1::regclass`,
    [TABLE]
  )
  const estimate = Number(rows[0]?.reltuples ?? -1)
  if (estimate > 0) return estimate

  const { rows: countRows } = await query(
    `SELECT count(*) AS count FROM ${TABLE}`
  )
  return Number(countRows[0]?.count ?? 0)
}

/** Deletes up to `limit` oldest rows (by timestamp) via direct heap access. */
const deleteOldestBatch = async (limit: number): Promise<number> => {
  const { rowCount } = await query(
    `DELETE FROM ${TABLE}
      WHERE ctid IN (
        SELECT ctid FROM ${TABLE}
         ORDER BY timestamp ASC
         LIMIT $1
      )`,
    [limit]
  )
  return rowCount ?? 0
}

/**
 * Enforce the retention cap once. Returns null when nothing needed to
 * happen, otherwise a summary of the run. Safe to call concurrently:
 * overlapping calls are skipped.
 */
export const enforceRetention = async (): Promise<RetentionRunResult | null> => {
  const capBytes = Math.round(env.retentionMaxSizeGb * BYTES_PER_GB)
  if (capBytes <= 0) return null

  const bytesBefore = await tableBytes()
  if (bytesBefore <= capBytes) {
    logger.debug(
      `Retention: sensor_logs ${fmtMb(bytesBefore)} is within the ${env.retentionMaxSizeGb} GB cap`
    )
    return null
  }

  const liveRows = await liveRowCount()
  const targetRows = Math.floor(capBytes / env.retentionBytesPerRow)

  if (liveRows <= targetRows) {
    // Physical size is over budget but the live data already fits: the
    // excess is dead/fragmented pages. One VACUUM reclaims what it can.
    await query('VACUUM (ANALYZE) sensor_logs')
    const bytesAfter = await tableBytes()
    logger.info(
      `Retention: sensor_logs ${fmtMb(bytesBefore)} → ${fmtMb(bytesAfter)} ` +
        `(cap ${env.retentionMaxSizeGb} GB); live data already fits, VACUUM only`
    )
    return {
      capBytes,
      bytesBefore,
      bytesAfter,
      liveRowsBefore: liveRows,
      targetRows,
      rowsDeleted: 0,
    }
  }

  const excess = liveRows - targetRows
  logger.info(
    `Retention: sensor_logs ${fmtMb(bytesBefore)} exceeds ${env.retentionMaxSizeGb} GB cap ` +
      `— deleting ${excess} oldest of ${liveRows} rows (target ${targetRows})`
  )

  let rowsDeleted = 0
  let batches = 0
  while (rowsDeleted < excess && batches < MAX_BATCHES_PER_RUN) {
    const wanted = Math.min(BATCH_ROWS, excess - rowsDeleted)
    const deleted = await deleteOldestBatch(wanted)
    if (deleted === 0) break // table exhausted
    rowsDeleted += deleted
    batches += 1
    if (rowsDeleted < excess) await sleep(BATCH_PAUSE_MS)
  }

  if (rowsDeleted > 0) {
    // Reclaim dead pages for the OS and refresh planner statistics.
    await query('VACUUM (ANALYZE) sensor_logs')
  }

  const bytesAfter = await tableBytes()

  if (batches >= MAX_BATCHES_PER_RUN && rowsDeleted < excess) {
    logger.warn(
      `Retention: stopped after ${MAX_BATCHES_PER_RUN} batches ` +
        `(${rowsDeleted} of ${excess} rows); will continue next run`
    )
  }
  logger.info(
    `Retention: sensor_logs ${fmtMb(bytesBefore)} → ${fmtMb(bytesAfter)} ` +
      `(cap ${env.retentionMaxSizeGb} GB), deleted ${rowsDeleted} rows in ${batches} batches`
  )

  return {
    capBytes,
    bytesBefore,
    bytesAfter,
    liveRowsBefore: liveRows,
    targetRows,
    rowsDeleted,
  }
}

// ------------------------------------------
// Scheduler
// ------------------------------------------

let intervalTimer: NodeJS.Timeout | null = null
let runInProgress = false

/**
 * Start the recurring retention job: one run immediately at startup,
 * then every RETENTION_CHECK_INTERVAL_MINUTES. No-op when the cap is 0.
 */
export const startRetentionScheduler = (): void => {
  if (env.retentionMaxSizeGb <= 0) {
    logger.info('⏸️  Data retention disabled (RETENTION_MAX_SIZE_GB=0)')
    return
  }

  const run = (): void => {
    if (runInProgress) {
      logger.warn('Retention: previous run still in progress, skipping')
      return
    }
    runInProgress = true
    enforceRetention()
      .catch((error: unknown) => {
        logger.error('Retention job failed:', error)
      })
      .finally(() => {
        runInProgress = false
      })
  }

  run()
  intervalTimer = setInterval(
    run,
    env.retentionCheckIntervalMinutes * 60_000
  )
  intervalTimer.unref()
  logger.info(
    `🕒 Data retention active: ${env.retentionMaxSizeGb} GB cap, ` +
      `checked every ${env.retentionCheckIntervalMinutes} min`
  )
}

export const stopRetentionScheduler = (): void => {
  if (intervalTimer) {
    clearInterval(intervalTimer)
    intervalTimer = null
  }
}
