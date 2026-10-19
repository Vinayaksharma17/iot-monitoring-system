# ==========================================
# Node-RED Dockerfile for IoT Simulation
# ==========================================
# Base image is pinned to a reviewed upstream tag. Update strategy:
# bump the tag deliberately (read the upstream release notes), rebuild,
# and re-verify the flow in a staging stack before deploying to production.
FROM nodered/node-red:5.0.8

# Switch to root to install our pinned node dependencies
USER root

WORKDIR /usr/src/node-red

# Install ONLY the extra palette nodes, pinned via package-lock.json.
# Installed into /tmp first and merged into the base image's node_modules so
# the base image's own package.json / package-lock.json stay untouched.
# (The base image already provides bash, curl and wget - it is Debian-based.)
COPY package.json package-lock.json /tmp/iot-nodes/
RUN cd /tmp/iot-nodes && \
    npm ci --omit=dev && \
    cp -r /tmp/iot-nodes/node_modules/. /usr/src/node-red/node_modules/ && \
    rm -rf /tmp/iot-nodes && \
    chown -R node-red:node-red /usr/src/node-red/node_modules && \
    npm cache clean --force

# Seed copies for named-volume users (dev) and for the bind-mount bootstrap
# performed by the entrypoint (production: bind mounts are not auto-populated).
COPY --chown=node-red:node-red settings.js flows.json /data/
COPY settings.js flows.json /opt/node-red-bootstrap/
COPY entrypoint.sh /usr/local/bin/iot-nodered-entrypoint.sh

RUN chmod +x /usr/local/bin/iot-nodered-entrypoint.sh && \
    chown -R node-red:node-red /opt/node-red-bootstrap /data

# Switch back to the non-root node-red user
USER node-red

EXPOSE 1880

ENV NODE_RED_ENABLE_SAFE_MODE=false \
    NODE_RED_ENABLE_PROJECTS=false \
    FLOWS=flows.json

# Health check (compose overrides this, but it keeps the raw image sane)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -fsS http://127.0.0.1:1880/ui/ >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/iot-nodered-entrypoint.sh"]
