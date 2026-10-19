#!/bin/bash
# ==========================================
# Node-RED bootstrap entrypoint
# ==========================================
# Production uses a BIND MOUNT for /data (so the operator owns the data on the
# host). Unlike named volumes, Docker does NOT populate bind mounts from the
# image, so settings.js / flows.json would be missing on a fresh server.
# This entrypoint seeds them only when absent, then hands over to the upstream
# entrypoint which starts Node-RED itself.
#
# It never overwrites existing files: flows edited in the (auth-protected)
# editor and persisted into /data survive restarts and image upgrades.

set -e

BOOTSTRAP_DIR="/opt/node-red-bootstrap"
DATA_DIR="${NODE_RED_DATA_DIR:-/data}"

mkdir -p "$DATA_DIR"

if [ ! -f "$DATA_DIR/settings.js" ]; then
    echo "[iot-entrypoint] Seeding settings.js into $DATA_DIR"
    cp "$BOOTSTRAP_DIR/settings.js" "$DATA_DIR/settings.js"
fi

if [ ! -f "$DATA_DIR/flows.json" ]; then
    echo "[iot-entrypoint] Seeding flows.json into $DATA_DIR"
    cp "$BOOTSTRAP_DIR/flows.json" "$DATA_DIR/flows.json"
fi

exec /usr/src/node-red/entrypoint.sh "$@"
