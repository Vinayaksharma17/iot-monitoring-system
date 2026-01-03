# Node-RED IoT Data Simulation

This Node-RED setup simulates IoT sensor data for the monitoring system by generating realistic temperature and humidity readings that are inserted into the PostgreSQL database.

## Overview

The simulation consists of two main flows:

1. **Initialization Flow**: Fetches active sensors from the backend API on startup
2. **Data Simulation Flow**: Generates realistic sensor readings every 60 seconds

## Flow Architecture

### Flow 1: Sensor Initialization

**Purpose**: Retrieve active sensors from the backend API and store them in global context.

**Flow Steps**:

1. **Inject Node**: Triggers once on startup (5-second delay)
2. **HTTP Request**: `GET http://backend:3000/api/sensors/active`
   - Returns sensor metadata: `sensorId`, `sensorName`, `bedroomName`, `type`, `minValue`, `maxValue`
3. **Function Node**: Stores sensors in `global.activeSensors` and initializes `lastSensorValues` for smooth transitions
4. **Debug Node**: Outputs initialization status

### Flow 2: Data Simulation

**Purpose**: Generate realistic sensor readings that maintain smooth transitions and stay within configured bounds.

**Flow Steps**:

1. **Inject Node**: Triggers every 60 seconds
2. **Prepare Sensors Function**: Retrieves active sensors from global context
3. **Split Node**: Processes each sensor individually
4. **Generate Value Function**:
   - For temperature: ±1.5°C random change with smooth transitions
   - For humidity: ±3% random change with smooth transitions
   - Respects `minValue` and `maxValue` constraints
   - Maintains last value for continuity
5. **PostgreSQL Insert**: Writes to `sensor_logs` table
6. **Debug Node**: Outputs generated readings

## Data Generation Algorithm

```javascript
// Temperature example
const change = (Math.random() - 0.5) * 3 // ±1.5°C
let newValue = lastValue + change
newValue = Math.max(minValue, Math.min(maxValue, newValue)) // Bound check
```

This creates realistic, smooth sensor readings that:

- Avoid sudden jumps
- Stay within physical sensor limits
- Simulate natural environmental variations

## Configuration

### PostgreSQL Connection

Located in the PostgreSQL config node:

- **Host**: `postgres` (Docker service name)
- **Port**: `5432`
- **Database**: `iot_monitoring`
- **User**: `iot_user`
- **Password**: `iot_password`

### Backend API Connection

The initialization flow connects to:

- **URL**: `http://backend:3000/api/sensors/active`
- **Method**: GET
- **Expected Response**: Array of active sensors with metadata

### Timing Configuration

- **Initialization Delay**: 5 seconds (allows backend to start)
- **Simulation Interval**: 60 seconds (1 minute)

To change the simulation frequency, modify the inject node's `repeat` property in `flows.json`.

## Custom Nodes

This setup uses three additional Node-RED nodes:

1. **node-red-node-postgres** (v1.0.4): PostgreSQL database operations
2. **node-red-contrib-loop-processing** (v0.6.1): Advanced loop control
3. **node-red-dashboard** (v3.6.0): Web-based dashboard UI

## File Structure

```
node-red/
├── package.json          # Dependencies and project metadata
├── settings.js           # Node-RED runtime configuration
├── flows.json           # Simulation flow definitions
├── Dockerfile           # Container image configuration
├── .dockerignore        # Docker build exclusions
└── README.md           # This file
```

## Settings Configuration

Key settings in `settings.js`:

- **Flow File**: `flows.json`
- **User Directory**: `/data`
- **Logging Level**: `info`
- **Context Storage**: Memory + File system persistence
- **HTTP Admin Root**: `/admin` (Flow editor UI)
- **HTTP Node Root**: `/` (Flow endpoints)
- **Dashboard UI**: `/ui` (Dashboard interface)

## Docker Setup

### Build Image

```bash
cd node-red
docker build -t iot-nodered:latest .
```

### Run Container

```bash
docker run -d \
  --name iot-nodered \
  -p 1880:1880 \
  -v node-red-data:/data \
  -e TZ=America/New_York \
  iot-nodered:latest
```

### Access Interfaces

- **Flow Editor**: http://localhost:1880/admin
- **Dashboard UI**: http://localhost:1880/ui

## Usage

### Starting the Simulation

1. Ensure PostgreSQL and backend services are running
2. Start Node-RED container
3. The initialization flow will automatically fetch active sensors
4. Data generation begins after 65 seconds (5s init delay + 60s first interval)

### Monitoring Simulation

- **Flow Editor**: View flow execution and debug messages at `/admin`
- **Dashboard**: Real-time sensor readings at `/ui`
- **Database**: Query `sensor_logs` table for historical data

### Modifying Flows

1. Access the flow editor at `/admin`
2. Make changes to flows
3. Click "Deploy" to apply changes
4. Flows are persisted to `flows.json`

### Adding New Sensors

The simulation automatically adapts when sensors are added via the backend API:

1. Create a new sensor using the backend API
2. Set `is_active = true`
3. The next initialization cycle (or restart Node-RED) will include it

## Troubleshooting

### No Data Being Generated

1. **Check Backend Connection**: Verify initialization flow successfully fetched sensors
2. **View Debug Messages**: Look for errors in debug panel
3. **Verify PostgreSQL**: Ensure database connection is successful
4. **Check Sensor Status**: Confirm sensors exist and `is_active = true`

### Database Connection Errors

- Verify PostgreSQL service is running
- Check connection credentials in PostgreSQL config node
- Ensure network connectivity between containers

### Backend API Not Responding

- Verify backend service is running on port 3000
- Check the backend health endpoint: `http://backend:3000/api/health`
- Ensure backend has database connection

## Integration with Backend

The simulation relies on the backend API endpoint `/api/sensors/active` which returns:

```json
[
  {
    "sensorId": 1,
    "sensorName": "Temp Sensor 1",
    "bedroomName": "Master Bedroom",
    "type": "temperature",
    "minValue": 15,
    "maxValue": 30
  }
]
```

## Data Schema

Generated sensor logs follow this structure:

```sql
INSERT INTO sensor_logs (sensor_id, value, recorded_at)
VALUES ($1, $2, NOW());
```

Where:

- `sensor_id`: References `sensors.sensor_id`
- `value`: Generated numeric reading (DECIMAL(10,2))
- `recorded_at`: Current timestamp

## Performance

- **Memory Usage**: ~50-100 MB (base Node-RED + custom nodes)
- **CPU Usage**: Minimal (periodic 60-second intervals)
- **Database Load**: One INSERT per sensor per minute
- **Scalability**: Supports 100+ sensors without performance degradation

## Future Enhancements

Potential improvements:

- Add anomaly simulation (sensor failures, outliers)
- Variable interval timing based on sensor type
- MQTT protocol support for real-time streaming
- WebSocket connections for live dashboard updates
- Machine learning-based pattern generation
- Historical data replay mode

## License

Part of the IoT Monitoring System project.
