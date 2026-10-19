#!/usr/bin/env bash
#
# Deploy (or roll back) the production stack on the home server.
#
#   ./deploy/deploy.sh                  # deploy IMAGE_TAG from deploy/.env
#   ./deploy/deploy.sh v1.0.0           # deploy a specific tag
#   ./deploy/deploy.sh v1.0.0 --rollback-previous   # force previous tag
#
# Behaviour:
#   - Pulls prebuilt GHCR images and (re)creates containers with --no-build.
#   - Waits for every container to report healthy and the site to answer 200.
#   - On failure, automatically rolls back to the previously deployed tag.
#   - Never uses `down`, never deletes volumes, never touches other stacks.
#
# Safe to re-run: it is idempotent and only affects this Compose project.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/deploy/.env"
STATE_FILE="$ROOT/deploy/.deployed"
DATA_ROOT="/srv/appdata/iot-monitoring"

CONTAINERS=(iot-postgres iot-backend iot-nodered iot-grafana iot-frontend)

log()  { printf '[deploy] %s\n' "$*"; }
fail() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

[[ -f "$ENV_FILE" ]] || fail "$ENV_FILE not found. Run ./deploy/generate-env.sh first."
command -v docker >/dev/null 2>&1 || fail "docker not found"

# Compose >= 2.24 is required for the !reset / !override merge tags.
COMPOSE_VERSION="$(docker compose version --short 2>/dev/null || echo 0)"
if [[ "$(printf '%s\n2.24.0\n' "$COMPOSE_VERSION" | sort -V | head -n1)" != "2.24.0" ]]; then
  fail "Docker Compose >= 2.24 required (found ${COMPOSE_VERSION:-none})"
fi

env_get() { sed -n "s/^$1=//p" "$ENV_FILE" | head -n1; }

TAG="${1:-}"
if [[ "$TAG" == --* ]]; then TAG=""; fi
TAG="${TAG:-$(env_get IMAGE_TAG)}"
TAG="${TAG:-latest}"
FRONTEND_PORT="$(env_get FRONTEND_PORT)"; FRONTEND_PORT="${FRONTEND_PORT:-5173}"

PREV_TAG=""
if [[ -f "$STATE_FILE" ]]; then
  PREV_TAG="$(sed -n 's/^IMAGE_TAG=//p' "$STATE_FILE" | head -n1)"
fi

# Allow forcing a rollback to the recorded previous tag without knowing it.
if [[ "${2:-}" == "--rollback-previous" ]]; then
  [[ -n "$PREV_TAG" ]] || fail "No previous tag recorded in $STATE_FILE"
  log "Rolling back: ${TAG} -> ${PREV_TAG}"
  TAG="$PREV_TAG"
  PREV_TAG=""
fi

COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$ROOT/compose.yaml" -f "$ROOT/compose.production.yaml")

# --- Ensure persistent directories exist with the right owners ---------------
# (uid: postgres 999, node-red 1000, grafana 472, backend nodeuser 1001)
ensure_dir() {
  local path="$1" uid="$2" gid="$3"
  if [[ ! -d "$path" ]]; then
    log "Creating $path"
    sudo mkdir -p "$path" || fail "Could not create $path"
  fi
  if command -v stat >/dev/null 2>&1; then
    local cur
    cur="$(stat -c '%u' "$path" 2>/dev/null || echo '?')"
    if [[ "$cur" != "$uid" ]]; then
      log "Setting owner ${uid}:${gid} on $path"
      sudo chown -R "${uid}:${gid}" "$path" || log "WARN: chown $path failed; check permissions manually"
    fi
  fi
}

log "Ensuring data directories under $DATA_ROOT"
ensure_dir "$DATA_ROOT/postgres"     999  999
ensure_dir "$DATA_ROOT/nodered"      1000 1000
ensure_dir "$DATA_ROOT/grafana"      472  472
ensure_dir "$DATA_ROOT/backend-logs" 1001 1001

# --- Validate the rendered config before touching anything -------------------
IMAGE_TAG="$TAG" "${COMPOSE[@]}" config -q || fail "compose config is invalid"

# --- Pull images -------------------------------------------------------------
log "Pulling images for tag: $TAG"
IMAGE_TAG="$TAG" "${COMPOSE[@]}" pull --quiet || fail "image pull failed (is the tag published and the GHCR token valid?)"

# --- Bring the stack up ------------------------------------------------------
log "Applying stack (up -d --no-build)"
IMAGE_TAG="$TAG" "${COMPOSE[@]}" up -d --no-build --remove-orphans

# --- Wait for health ---------------------------------------------------------
wait_healthy() {
  local deadline=$((SECONDS + 180))
  while (( SECONDS < deadline )); do
    local all_ok=1
    for c in "${CONTAINERS[@]}"; do
      local status
      status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$c" 2>/dev/null || echo missing)"
      case "$status" in
        healthy) ;;
        unhealthy|missing|exited)
          log "Container $c is $status"
          return 1
          ;;
        *) all_ok=0 ;;
      esac
    done
    if (( all_ok == 1 )); then
      return 0
    fi
    sleep 5
  done
  log "Timed out waiting for all containers to report healthy"
  return 1
}

verify_http() {
  local ok=1
  log "Checking http://127.0.0.1:${FRONTEND_PORT}/"
  if ! curl -fsS -o /dev/null "http://127.0.0.1:${FRONTEND_PORT}/"; then ok=0; fi
  log "Checking http://127.0.0.1:${FRONTEND_PORT}/api (proxied to backend)"
  if ! curl -fsS -o /dev/null "http://127.0.0.1:${FRONTEND_PORT}/api"; then ok=0; fi
  if (( ok == 1 )); then return 0; fi
  return 1
}

deploy_ok=1
if ! wait_healthy; then deploy_ok=0; fi
if (( deploy_ok == 1 )); then
  if ! verify_http; then deploy_ok=0; fi
fi

if (( deploy_ok == 0 )); then
  log "Deployment of $TAG did NOT become healthy."
  IMAGE_TAG="$TAG" "${COMPOSE[@]}" ps || true
  if [[ -n "$PREV_TAG" && "$PREV_TAG" != "$TAG" ]]; then
    log "Rolling back to previous tag: $PREV_TAG"
    IMAGE_TAG="$PREV_TAG" "${COMPOSE[@]}" pull --quiet || true
    IMAGE_TAG="$PREV_TAG" "${COMPOSE[@]}" up -d --no-build --remove-orphans || true
    if wait_healthy; then
      log "Rollback to $PREV_TAG succeeded."
    else
      log "WARNING: rollback to $PREV_TAG also unhealthy - manual attention required."
    fi
  else
    log "No previous tag to roll back to."
  fi
  exit 1
fi

{
  echo "IMAGE_TAG=$TAG"
  echo "DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  for c in "${CONTAINERS[@]}"; do
    echo "${c}_IMAGE=$(docker inspect -f '{{.Config.Image}}@{{.Image}}' "$c" 2>/dev/null || echo unknown)"
  done
} > "$STATE_FILE"

log "Deployment healthy: tag=$TAG"
IMAGE_TAG="$TAG" "${COMPOSE[@]}" ps
