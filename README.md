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
- Docker Compose (2.0+)
- Git

## 🚀 Installation

\`\`\`bash
# Clone repository
git clone https://github.com/Vinayaksharma17/iot-monitoring-system.git
cd iot-monitoring-system

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
├── backend/          # Node.js/Express API
├── frontend/         # React application
├── database/         # PostgreSQL init scripts
├── grafana/          # Dashboards & config
├── node-red/         # Data generation flows
└── compose.yaml      # Docker services
\`\`\`

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

---

**Made with ❤️ by Vinayak Sharma**
