# IoT Monitoring System

A full-stack IoT monitoring system for tracking temperature and humidity sensors across multiple bedrooms. Built with React, Node.js, PostgreSQL, Grafana, and Node-RED.

![Project Status](https://img.shields.io/badge/status-production%20ready-brightgreen)

## 🌟 Features

- **Real-time Sensor Monitoring** - Track temperature and humidity across multiple bedrooms
- **Interactive Dashboard** - View sensor readings, statistics, and manage devices
- **Grafana Integration** - Embedded dashboards with real-time visualizations
- **RESTful API** - Complete backend API with authentication
- **Automated Data Collection** - Node-RED flows for simulated sensor data generation
- **Responsive UI** - Modern React frontend with Tailwind CSS
- **Docker Deployment** - Complete containerized setup with Docker Compose

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Production Deployment](#-production-deployment)
- [Contributing](#contributing)

## 🏗️ Architecture

\`\`\`
┌─────────────────┐
│   Frontend      │
│   (React)       │
│   Port: 5173    │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐      ┌──────────────┐
│   Backend       │◄─────┤  PostgreSQL  │
│   (Node.js)     │      │  Database    │
│   Port: 3000    │      │  Port: 5432  │
└────────┬────────┘      └──────────────┘
         │                       ▲
         │                       │
┌────────▼────────┐             │
│   Grafana       │             │
│   Analytics     │─────────────┘
│   Port: 3001    │
└─────────────────┘

┌─────────────────┐      ┌──────────────┐
│   Node-RED      │─────►│   Backend    │
│   Data Gen      │      │   API        │
│   Port: 1880    │      └──────────────┘
└─────────────────┘
\`\`\`

## 🛠️ Tech Stack

### Frontend
- React 18.2, TypeScript 5.3, Vite 5.0
- Tailwind CSS 3.4, TanStack Query 5.17
- React Router 6.21, Axios, date-fns

### Backend
- Node.js 20, Express 4.18, TypeScript
- PostgreSQL 15, node-postgres
- Winston (logging)

### Infrastructure
- Docker & Docker Compose
- Nginx, Node-RED, Grafana, Adminer

## 📦 Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+ for local development; **2.24+ for the production overlay**)
- Git

## 🚀 Installation

\`\`\`bash
# Clone repository
git clone https://github.com/Vinayaksharma17/iot-monitoring-system.git
cd iot-monitoring-system

# Create your environment file and set real secrets
cp .env.example .env
# Required: POSTGRES_PASSWORD, GRAFANA_ADMIN_PASSWORD, JWT_SECRET,
# JWT_REFRESH_SECRET, NODE_RED_ADMIN_PASSWORD_HASH, NODE_RED_CREDENTIAL_SECRET

# Start all services
docker compose up -d

# Verify services
docker compose ps
\`\`\`

## �� Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Grafana**: http://localhost:3001 (admin/admin)
- **Node-RED**: http://localhost:1880
- **Adminer**: http://localhost:8081

## 🔐 Authentication

**IMPORTANT:** For security, never use the default demo credentials in production.

The backend seeds an initial admin account at startup when `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set. Configure these in your `.env` before starting the backend. No hardcoded login credentials are shipped with the application.

The API uses JWT bearer tokens:
- `POST /api/auth/login` → returns `accessToken` and `refreshToken`
- `GET /api/auth/me` → returns the current user (send `Authorization: Bearer <accessToken>`)
- `POST /api/auth/refresh` → exchanges a valid refresh token for a new access token

**Grafana**: admin / admin (configure via `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`)  
**Database**: credentials from your `.env` (change defaults in production)

## 📖 Usage

### Managing Bedrooms
1. Navigate to Bedrooms page
2. Click "Add Bedroom"
3. Enter name and description
4. Edit or delete as needed

### Managing Sensors
1. Navigate to Sensors page
2. Select bedroom (optional filter)
3. Click "Add Sensor"
4. Configure: name, type, unit, thresholds

### Viewing Analytics
1. From Dashboard, click:
   - "All Bedrooms" - Overview
   - "Single Bedroom" - Detailed view
2. Full-screen Grafana dashboards
3. Auto-refresh enabled

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/login      # Authenticate and issue access/refresh tokens
POST   /api/auth/refresh    # Refresh an access token using a refresh token
GET    /api/auth/me         # Get current authenticated user (requires auth)
POST   /api/auth/logout     # Log out (client-side token discard, requires auth)
```

### Bedrooms
```
GET    /api/bedrooms        # Get all bedrooms (requires auth)
GET    /api/bedrooms/:id    # Get bedroom by ID (requires auth)
POST   /api/bedrooms        # Create a new bedroom (requires auth + write)
PUT    /api/bedrooms/:id    # Update bedroom (requires auth + update)
DELETE /api/bedrooms/:id    # Delete bedroom (requires admin role)
```

### Sensors
```
GET    /api/sensors         # Get all sensors (requires auth)
GET    /api/sensors/active  # Get active sensors (may require X-API-Key)
GET    /api/sensors/:id    # Get sensor by ID (requires auth)
GET    /api/sensors/bedrooms/:bedroomId  # Get sensors for bedroom (requires auth)
POST   /api/sensors/bedrooms/:bedroomId  # Create sensor (requires auth + write)
PUT    /api/sensors/:id    # Update sensor (requires auth + update)
DELETE /api/sensors/:id    # Delete sensor (requires admin role)
```

### Sensor Logs
```
GET    /api/sensor-logs                # Get sensor logs with filters (public)
GET    /api/sensor-logs/sensor/:id     # Get logs for a specific sensor (public)
GET    /api/sensor-logs/latest         # Get latest readings (public)
GET    /api/sensor-logs/statistics     # Get aggregated statistics (public)
```


## 📁 Project Structure

\`\`\`
iot-monitoring-system/
├── .github/workflows/  # CI, image publish, deploy
├── backend/          # Node.js/Express API
├── deploy/           # Production env template, deploy/backup scripts, cloudflared config
├── docs/             # Deployment guide
├── frontend/         # React application
├── database/         # PostgreSQL init scripts & migrations
├── grafana/          # Dashboards & provisioning
├── node-red/         # Data generation flows
├── compose.yaml              # Base (local/dev) Docker services
├── compose.production.yaml   # Production overlay (private, GHCR images)
└── compose.admin.yaml        # Optional overlay for private admin UIs
\`\`\`

## 🚢 Production Deployment

The app is deployed to a home server with prebuilt GHCR images, Tailscale and a
Cloudflare Tunnel. In production **only the frontend is published** (loopback +
tunnel); Grafana, Node-RED, Adminer and PostgreSQL are private.

\`\`\`bash
# One-time: generate secrets and validate the rendered stack
./deploy/generate-env.sh
docker compose --env-file deploy/.env -f compose.yaml -f compose.production.yaml config -q

# Deploy a published image tag (health-verified, auto-rollback on failure)
./deploy/deploy.sh v1.0.0
./deploy/deploy.sh --rollback-previous

# Back up database + state
./deploy/backup.sh
\`\`\`

CI/CD (`.github/workflows/`):

- **ci.yml** – lint, type-check, build, image build and Compose validation on
  every push/PR.
- **publish.yml** – builds and pushes `ghcr.io/<owner>/iot-monitoring-system-{backend,frontend,nodered}`
  on `v*` tags or manual dispatch.
- **deploy.yml** – deploys over the tailnet via strict SSH after approval
  (GitHub `production` environment), with rollback support.

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for the full runbook
(prerequisites, server setup, secrets handling, backups, troubleshooting).

## 🐳 Docker Commands

\`\`\`bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f [service]

# Rebuild service
docker compose build [service]
docker compose up -d [service]

# Check status
docker compose ps
\`\`\`

## 🔍 Troubleshooting

**Frontend blank screen**: Check browser console, verify backend is running  
**Database issues**: Check PostgreSQL logs, verify credentials  
**Grafana iframe error**: Ensure GF_SECURITY_ALLOW_EMBEDDING=true  
**No data**: Check Node-RED flows are deployed

### Grafana access lockdown

Embedded dashboards are served **read-only to anonymous users** and the top
navigation bar (including the search bar and its toggle) is hidden by appending
`&kiosk` to the iframe URLs in `frontend/src/utils/grafana.ts`.

The Grafana service in `compose.yaml` enforces this for local development:

- `GF_AUTH_ANONYMOUS_ENABLED=true` with `GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer`
  (anonymous users can view but cannot edit).
- `GF_AUTH_DISABLE_LOGIN_FORM=true` so the admin UI cannot be reached, even
  with valid credentials.

To temporarily regain admin access for maintenance, set
`GF_AUTH_DISABLE_LOGIN_FORM=false` and recreate the container
(`docker compose up -d --force-recreate grafana`), then sign in with the
`GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` credentials.

**Production is different by design:** Grafana is *private* (reachable only over
the tailnet or an SSH port-forward), so `compose.production.yaml` keeps the
login form enabled and the frontend build leaves `VITE_GRAFANA_URL` empty —
the embedded-dashboard entry points are hidden instead of showing a dead
iframe. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) §7.

### Node-RED security

The Node-RED editor requires login (`adminAuth`) and its credentials come from
the environment (`NODE_RED_ADMIN_PASSWORD_HASH`, `NODE_RED_ADMIN_USER`,
`NODE_RED_CREDENTIAL_SECRET`). The flows hold no secrets: the PostgreSQL
password and the backend `X-API-Key` are resolved from environment variables at
runtime.

---

**Made with ❤️ by Vinayak Sharma**
