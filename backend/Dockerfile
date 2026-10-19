# ==========================================
# Multi-Stage Dockerfile for Node.js Backend
# ==========================================

# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files (package-lock.json is required for a reproducible npm ci)
COPY package*.json ./

# Install all dependencies (including dev dependencies for building),
# deterministically from package-lock.json
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev

# ==========================================
# Stage 2: Production
# ==========================================
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodeuser && \
    adduser -S nodeuser -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only, deterministically from the lockfile
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p logs && \
    chown -R nodeuser:nodeuser /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check (compose provides its own; this keeps the raw image sane).
# 127.0.0.1 avoids the IPv6/IPv4 localhost ambiguity inside containers.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start application
CMD ["node", "dist/index.js"]
