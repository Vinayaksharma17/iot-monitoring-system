-- =====================================================
-- Migration 001: Add users table (Authentication & RBAC)
-- =====================================================
-- Apply this to an existing database created before the users table existed.
-- init.sql already contains this table for fresh databases.
--
-- Usage:
--   docker compose exec -T postgres psql -U iot_user -d iot_monitoring \
--     < database/migrations/001_add_users.sql
-- =====================================================

BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT check_user_role
        CHECK (role IN ('admin', 'viewer'))
);

COMMENT ON TABLE users IS 'Stores application users for authentication and role-based access control';
COMMENT ON COLUMN users.email IS 'Unique login email';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt password hash - never store plaintext passwords';
COMMENT ON COLUMN users.role IS 'User role: admin or viewer';

CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

-- Reuse the shared updated_at trigger function (created by init.sql)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
