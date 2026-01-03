# IoT Monitoring System - Backend API

Backend API service for the IoT Monitoring System built with Node.js, Express, TypeScript, and PostgreSQL.

## 🛠️ Technology Stack

- **Runtime**: Node.js v20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with `pg` client
- **Validation**: Joi
- **Logging**: Winston + Morgan
- **Security**: Helmet, CORS

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # PostgreSQL connection pool
│   ├── controllers/
│   │   ├── bedroom.controller.ts
│   │   ├── sensor.controller.ts
│   │   └── sensor-log.controller.ts
│   ├── middleware/
│   │   ├── error.middleware.ts  # Error handling
│   │   └── logger.middleware.ts # Winston + Morgan logging
│   ├── routes/
│   │   ├── bedroom.routes.ts
│   │   ├── sensor.routes.ts
│   │   └── sensor-log.routes.ts
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── validators/
│   │   ├── bedroom.validator.ts
│   │   └── sensor.validator.ts
│   └── index.ts                 # Server entry point
├── Dockerfile
├── .dockerignore
├── .env.example
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL database

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Setup environment variables:**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/iot_monitoring
   PORT=3000
   NODE_ENV=development
   ```

3. **Run in development mode:**

   ```bash
   npm run dev
   ```

4. **Build for production:**

   ```bash
   npm run build
   ```

5. **Run in production mode:**
   ```bash
   npm start
   ```

## 📡 API Endpoints

### Health Check

- `GET /health` - Server health status

### Bedrooms

- `GET /api/bedrooms` - Get all bedrooms
- `GET /api/bedrooms/:id` - Get bedroom by ID
- `POST /api/bedrooms` - Create a new bedroom
- `PUT /api/bedrooms/:id` - Update bedroom
- `DELETE /api/bedrooms/:id` - Delete bedroom

### Sensors

- `GET /api/sensors/active` - Get all active sensors (for Node-RED)
- `GET /api/sensors/:id` - Get sensor by ID
- `POST /api/bedrooms/:bedroomId/sensors` - Create sensor for bedroom
- `PUT /api/sensors/:id` - Update sensor
- `DELETE /api/sensors/:id` - Delete sensor
- `GET /api/sensors/bedrooms/:bedroomId` - Get all sensors for a bedroom

### Sensor Logs

- `GET /api/sensor-logs` - Get sensor logs (with filters)
- `GET /api/sensor-logs/latest` - Get latest readings
- `GET /api/sensor-logs/statistics` - Get aggregated statistics

## 📝 Example API Requests

### Create Bedroom

```bash
curl -X POST http://localhost:3000/api/bedrooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Master Bedroom",
    "description": "Main bedroom with ensuite"
  }'
```

### Create Sensor

```bash
curl -X POST http://localhost:3000/api/bedrooms/1/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Temperature Sensor 1",
    "type": "temperature",
    "unit": "°C",
    "minValue": 22.5,
    "maxValue": 35.0,
    "isActive": true
  }'
```

### Get Sensor Logs

```bash
curl "http://localhost:3000/api/sensor-logs?limit=100&roomName=Bedroom%201"
```

## 🐳 Docker

Build and run with Docker:

```bash
# Build image
docker build -t iot-backend .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  iot-backend
```

## 🔐 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Joi validation schemas
- **SQL Injection Protection**: Parameterized queries
- **Error Handling**: Custom error middleware

## 📊 Logging

Logs are written to:

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

## 🧪 Environment Variables

| Variable       | Description                  | Default       |
| -------------- | ---------------------------- | ------------- |
| `NODE_ENV`     | Environment mode             | `development` |
| `PORT`         | Server port                  | `3000`        |
| `DATABASE_URL` | PostgreSQL connection string | Required      |
| `CORS_ORIGIN`  | Allowed CORS origin          | `*`           |
| `LOG_LEVEL`    | Winston log level            | `info`        |

## 📦 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run clean` - Remove build directory

## 🤝 Contributing

Backend API is part of the IoT Monitoring System project.

## 📄 License

MIT
