-- Additional database schema updates for missing features

-- Update users table to include admin and regulator roles, and status field
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('farmer', 'distributor', 'retailer', 'admin', 'regulator'));

-- Add status field to users table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive'));
    END IF;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  batch_id UUID REFERENCES produce_batches(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file_uploads table for storing certificates and images
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES produce_batches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  file_hash VARCHAR(64), -- SHA-256 hash for integrity
  upload_type VARCHAR(50) NOT NULL CHECK (upload_type IN ('certificate', 'image', 'document')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quality_checks table for enhanced quality verification
CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES produce_batches(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES users(id),
  check_type VARCHAR(50) NOT NULL,
  parameters JSONB NOT NULL, -- Store quality parameters
  results JSONB NOT NULL, -- Store test results
  passed BOOLEAN NOT NULL,
  certificate_url TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_settings table for admin configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_file_uploads_batch_id ON file_uploads(batch_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_batch_id ON quality_checks(batch_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role, status) 
VALUES ('admin@agrichain.com', '$2a$10$rQZ5O6p4K8bJFbMbKr7pxuK.FJxYvJHlJzG0V2wdRkKgThCM5RI9W', 'System Administrator', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert default regulator user (password: regulator123)  
INSERT INTO users (email, password_hash, name, role, status)
VALUES ('regulator@agrichain.com', '$2a$10$8Xk9lP3Qv6uJr2tS4Hf7Z.M8nW2bC1vT5yR9qX0pK4jL6aE3sN8wG', 'Supply Chain Regulator', 'regulator', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert some default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('quality_check_required', 'true', 'Whether quality checks are mandatory for batch transfers'),
  ('max_batch_age_days', '30', 'Maximum age of batch before expiry warning'),
  ('notification_retention_days', '90', 'How long to keep notifications'),
  ('blockchain_network', '{"network": "sepolia", "enabled": true}', 'Blockchain network configuration')
ON CONFLICT (setting_key) DO NOTHING;