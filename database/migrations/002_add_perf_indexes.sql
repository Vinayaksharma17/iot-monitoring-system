-- =====================================================
-- Migration 002: Composite indexes for hot read paths
-- =====================================================
-- The two heaviest read patterns are:
--   1. GET /api/sensor-logs/sensor/:id  -> WHERE sensor_id = ?
--      ORDER BY timestamp DESC LIMIT n
--   2. GET /api/sensor-logs             -> WHERE room_name = ?
--      AND sensor_name = ? ORDER BY timestamp DESC LIMIT n
--   3. GET /api/sensor-logs/latest      -> DISTINCT ON (sensor_id)
--      ORDER BY sensor_id, timestamp DESC
--
-- The existing single-column indexes (sensor_id, timestamp) cannot
-- satisfy the ORDER BY without a sort step; these composites let
-- Postgres scan the index backwards and stop at LIMIT.
--
-- Usage:
--   docker compose exec -T postgres psql -U iot_user -d iot_monitoring \
--     < database/migrations/002_add_perf_indexes.sql
-- =====================================================

BEGIN;

-- Per-sensor history + DISTINCT ON latest-readings queries
CREATE INDEX IF NOT EXISTS idx_sensor_logs_sensor_id_timestamp
    ON sensor_logs (sensor_id, timestamp DESC);

-- Filtered log queries by room + sensor name, newest first
CREATE INDEX IF NOT EXISTS idx_sensor_logs_room_sensor_timestamp
    ON sensor_logs (room_name, sensor_name, timestamp DESC);

-- The new composite is a strict superset of the old prefix index,
-- so the old one is redundant and can be dropped.
DROP INDEX IF EXISTS idx_sensor_logs_room_sensor;

COMMIT;
