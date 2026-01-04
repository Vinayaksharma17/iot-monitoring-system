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

## 🔐 Login Credentials

**Frontend**: admin@example.com / admin123  
**Grafana**: admin / admin  
**Database**: postgres / postgres

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

### Bedrooms
\`\`\`
GET    /api/bedrooms
GET    /api/bedrooms/:id
POST   /api/bedrooms
PUT    /api/bedrooms/:id
DELETE /api/bedrooms/:id
\`\`\`

### Sensors
\`\`\`
GET    /api/sensors/active
GET    /api/sensors/bedrooms/:bedroomId
POST   /api/sensors/bedrooms/:bedroomId
PUT    /api/sensors/:id
DELETE /api/sensors/:id
\`\`\`

### Sensor Logs
\`\`\`
GET    /api/sensor-logs
GET    /api/sensor-logs/latest
GET    /api/sensor-logs/statistics
\`\`\`


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
