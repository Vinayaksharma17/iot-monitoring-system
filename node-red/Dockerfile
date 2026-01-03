# ==========================================
# Node-RED Dockerfile for IoT Simulation
# ==========================================

# Use official Node-RED image as base
FROM nodered/node-red:latest

# Switch to root user to install additional packages
USER root

# Install additional system dependencies if needed
RUN apk add --no-cache \
    bash \
    curl

# Switch back to node-red user
USER node-red

# Set working directory
WORKDIR /usr/src/node-red

# Install custom Node-RED nodes
RUN npm install --save \
    node-red-node-postgres@1.0.4 \
    node-red-contrib-loop-processing@0.6.1 \
    node-red-dashboard@3.6.0

# Create data directory
RUN mkdir -p /data

# Copy Node-RED configuration files
COPY --chown=node-red:node-red settings.js /data/settings.js
COPY --chown=node-red:node-red flows.json /data/flows.json

# Expose Node-RED port
EXPOSE 1880

# Set environment variables
ENV NODE_RED_ENABLE_SAFE_MODE=false \
    NODE_RED_ENABLE_PROJECTS=false \
    FLOWS=flows.json

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:1880/ || exit 1

# The base image already has CMD to start Node-RED
# CMD ["npm", "start", "--cache", "/data/.npm", "--", "--userDir", "/data"]
