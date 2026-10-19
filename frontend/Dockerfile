# Multi-stage build for React frontend

# ==========================================
# Stage 1: Build the application
# ==========================================
# Pinned to a reviewed Node.js 20 tag; bump deliberately with the lockfile.
FROM node:20-alpine AS builder

WORKDIR /app

# Runtime configuration is baked into the bundle at build time by Vite.
# Both default to the same-origin setup ("/api" is proxied by nginx to the
# backend). VITE_GRAFANA_URL is intentionally empty for production: Grafana
# stays private, so the embedded-dashboard UI is disabled in that build.
ARG VITE_API_URL=""
ARG VITE_GRAFANA_URL=""
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_GRAFANA_URL=${VITE_GRAFANA_URL}

# Copy package files (lockfile required for reproducible npm ci)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ==========================================
# Stage 2: Serve with nginx
# ==========================================
# Pinned to a reviewed nginx tag; bump deliberately.
FROM nginx:1.27-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check (compose provides its own; 127.0.0.1 avoids the IPv6/IPv4
# localhost ambiguity inside containers)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
