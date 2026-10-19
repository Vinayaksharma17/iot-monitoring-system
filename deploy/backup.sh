#!/usr/bin/env bash
#
# Back up the production stack's state to $BACKUP_DIR.
#
#   ./deploy/backup.sh                      # database + Grafana + Node-RED flows
#   BACKUP_RETENTION_DAYS=30 ./deploy/backup.sh
#
# Contents per run:
#   1. Logical PostgreSQL dump (pg_dump, gzipped, verified non-empty).
#   2. Tar of Node-RED /data (flows + settings), excluding node_modules.
#   3. Tar of Grafana /var/lib/grafana (SQLite db, dashboards state).
#
# Reading state only: does not stop containers and does not modify data.

set -euo pipefail
umask 077

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/deploy/.env"
DATA_ROOT="/srv/appdata/iot-monitoring"
BACKUP_DIR="${BACKUP_DIR:-$DATA_ROOT/backups}"

log()  { printf '[backup] %s\n' "$*"; }
fail() { printf '[backup] ERROR: %s\n' "$*" >&2; exit 1; }

[[ -f "$ENV_FILE" ]] || fail "$ENV_FILE not found"
env_get() { sed -n "s/^$1=//p" "$ENV_FILE" | head -n1; }

PG_USER="$(env_get POSTGRES_USER)"; PG_USER="${PG_USER:-iot_user}"
PG_DB="$(env_get POSTGRES_DB)";     PG_DB="${PG_DB:-iot_monitoring}"
RETENTION_DAYS="$(env_get BACKUP_RETENTION_DAYS)"
RETENTION_DAYS="${RETENTION_DAYS:-${BACKUP_RETENTION_DAYS:-14}}"

STAMP="$(date -u +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# --- 1. Database dump --------------------------------------------------------
dump="$BACKUP_DIR/postgres-${STAMP}.sql.gz"
log "Dumping database to $dump"
if ! docker exec iot-postgres pg_dump -U "$PG_USER" -d "$PG_DB" | gzip > "$dump"; then
  rm -f "$dump"
  fail "pg_dump failed (is the postgres container running/healthy?)"
fi
gzip -t "$dump" || { rm -f "$dump"; fail "dump is corrupt"; }
size="$(wc -c < "$dump" | tr -d ' ')"
(( size > 100 )) || { rm -f "$dump"; fail "dump suspiciously small (${size} bytes)"; }
log "Database dump OK (${size} bytes)"

# --- 2. Node-RED flows/settings ---------------------------------------------
if [[ -d "$DATA_ROOT/nodered" ]]; then
  tar_out="$BACKUP_DIR/nodered-${STAMP}.tar.gz"
  log "Archiving Node-RED data to $tar_out"
  sudo tar --exclude='./node_modules' -czf "$tar_out" -C "$DATA_ROOT/nodered" . \
    || log "WARN: Node-RED archive failed (continuing)"
fi

# --- 3. Grafana state -------------------------------------------------------
if [[ -d "$DATA_ROOT/grafana" ]]; then
  tar_out="$BACKUP_DIR/grafana-${STAMP}.tar.gz"
  log "Archiving Grafana data to $tar_out"
  sudo tar -czf "$tar_out" -C "$DATA_ROOT/grafana" . \
    || log "WARN: Grafana archive failed (continuing)"
fi

# --- Retention --------------------------------------------------------------
log "Pruning backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name '*.sql.gz' -o -name '*.tar.gz' \) \
  -mtime "+${RETENTION_DAYS}" -print -delete || log "WARN: prune step failed"

log "Backups in $BACKUP_DIR:"
ls -1t "$BACKUP_DIR" | head -n 10
