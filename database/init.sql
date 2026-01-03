-- =====================================================
-- IoT Monitoring System - Database Initialization Script
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. Create Bedrooms Table
-- =====================================================
CREATE TABLE IF NOT EXISTS bedrooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE bedrooms IS 'Stores bedroom/room information for the IoT monitoring system';
COMMENT ON COLUMN bedrooms.name IS 'Unique name of the bedroom';
COMMENT ON COLUMN bedrooms.description IS 'Optional description of the bedroom';

-- =====================================================
-- 2. Create Sensors Table
-- =====================================================
CREATE TABLE IF NOT EXISTS sensors (
    id SERIAL PRIMARY KEY,
    bedroom_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('temperature', 'humidity')),
    unit VARCHAR(10) NOT NULL,
    min_value NUMERIC(5,2) NOT NULL,
    max_value NUMERIC(5,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraint with CASCADE delete
    CONSTRAINT fk_bedroom
        FOREIGN KEY (bedroom_id) 
        REFERENCES bedrooms(id)
        ON DELETE CASCADE,
    
    -- Unique constraint for bedroom_id and name combination
    CONSTRAINT unique_bedroom_sensor
        UNIQUE (bedroom_id, name),
    
    -- Check constraint for min/max values
    CONSTRAINT check_min_max
        CHECK (min_value < max_value)
);

-- Add comments
COMMENT ON TABLE sensors IS 'Stores sensor configuration and metadata';
COMMENT ON COLUMN sensors.type IS 'Type of sensor: temperature or humidity';
COMMENT ON COLUMN sensors.unit IS 'Unit of measurement (°C, %)';
COMMENT ON COLUMN sensors.is_active IS 'Indicates if sensor is currently active';

-- =====================================================
-- 3. Create Sensor Logs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS sensor_logs (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL,
    room_name VARCHAR(50) NOT NULL,
    sensor_name VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    value NUMERIC(5,2) NOT NULL,
    
    -- Foreign key constraint with CASCADE delete
    CONSTRAINT fk_sensor
        FOREIGN KEY (sensor_id)
        REFERENCES sensors(id)
        ON DELETE CASCADE
);

-- Add comments
COMMENT ON TABLE sensor_logs IS 'Stores time-series sensor reading data';
COMMENT ON COLUMN sensor_logs.value IS 'Sensor reading value';

-- =====================================================
-- 4. Create Indexes for Performance
-- =====================================================

-- Index on timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_sensor_logs_timestamp 
    ON sensor_logs(timestamp DESC);

-- Index on sensor_id for filtering by sensor
CREATE INDEX IF NOT EXISTS idx_sensor_logs_sensor_id 
    ON sensor_logs(sensor_id);

-- Composite index for room and sensor name queries
CREATE INDEX IF NOT EXISTS idx_sensor_logs_room_sensor 
    ON sensor_logs(room_name, sensor_name);

-- Index on bedroom_id in sensors table
CREATE INDEX IF NOT EXISTS idx_sensors_bedroom_id 
    ON sensors(bedroom_id);

-- Index on sensor type for filtering
CREATE INDEX IF NOT EXISTS idx_sensors_type 
    ON sensors(type);

-- =====================================================
-- 5. Create Trigger Function for Auto-Update Timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to bedrooms table
CREATE TRIGGER trigger_update_bedrooms_updated_at
    BEFORE UPDATE ON bedrooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to sensors table
CREATE TRIGGER trigger_update_sensors_updated_at
    BEFORE UPDATE ON sensors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. Insert Sample Data - Bedrooms
-- =====================================================
INSERT INTO bedrooms (name, description) VALUES
    ('Bedroom 1', 'Master bedroom with temperature and humidity monitoring'),
    ('Bedroom 2', 'Guest bedroom with environmental sensors')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 7. Insert Sample Data - Sensors
-- =====================================================
INSERT INTO sensors (bedroom_id, name, type, unit, min_value, max_value, is_active) VALUES
    -- Bedroom 1 sensors
    (1, 'Temperature Sensor 1', 'temperature', '°C', 22.50, 35.00, TRUE),
    (1, 'Humidity Sensor 1', 'humidity', '%', 30.00, 70.00, TRUE),
    
    -- Bedroom 2 sensors
    (2, 'Temperature Sensor 2', 'temperature', '°C', 22.50, 35.00, TRUE),
    (2, 'Humidity Sensor 2', 'humidity', '%', 30.00, 70.00, TRUE)
ON CONFLICT (bedroom_id, name) DO NOTHING;

-- =====================================================
-- 8. Create Helpful Views for Reporting
-- =====================================================

-- View for latest sensor readings
CREATE OR REPLACE VIEW latest_sensor_readings AS
SELECT DISTINCT ON (sl.sensor_id)
    b.name AS bedroom_name,
    s.name AS sensor_name,
    s.type AS sensor_type,
    s.unit,
    sl.value,
    sl.timestamp
FROM sensor_logs sl
JOIN sensors s ON sl.sensor_id = s.id
JOIN bedrooms b ON s.bedroom_id = b.id
WHERE s.is_active = TRUE
ORDER BY sl.sensor_id, sl.timestamp DESC;

-- View for sensor statistics
CREATE OR REPLACE VIEW sensor_statistics AS
SELECT 
    b.name AS bedroom_name,
    s.name AS sensor_name,
    s.type AS sensor_type,
    s.unit,
    COUNT(sl.id) AS reading_count,
    ROUND(AVG(sl.value)::numeric, 2) AS avg_value,
    ROUND(MIN(sl.value)::numeric, 2) AS min_value,
    ROUND(MAX(sl.value)::numeric, 2) AS max_value,
    MAX(sl.timestamp) AS last_reading
FROM sensors s
JOIN bedrooms b ON s.bedroom_id = b.id
LEFT JOIN sensor_logs sl ON s.id = sl.sensor_id
WHERE s.is_active = TRUE
GROUP BY b.name, s.name, s.type, s.unit;

-- =====================================================
-- 9. Grant Permissions (Optional - for production)
-- =====================================================
-- Uncomment and modify if you need specific user permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO iot_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO iot_user;

-- =====================================================
-- 10. Verification Queries
-- =====================================================

-- Display created tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Display sample data
SELECT 'Bedrooms' AS table_name, COUNT(*) AS row_count FROM bedrooms
UNION ALL
SELECT 'Sensors', COUNT(*) FROM sensors
UNION ALL
SELECT 'Sensor Logs', COUNT(*) FROM sensor_logs;

-- Display sensor configuration
SELECT 
    b.name AS bedroom,
    s.name AS sensor,
    s.type,
    s.unit,
    CONCAT(s.min_value, ' - ', s.max_value) AS range,
    s.is_active
FROM sensors s
JOIN bedrooms b ON s.bedroom_id = b.id
ORDER BY b.name, s.type;

-- =====================================================
-- End of Initialization Script
-- =====================================================