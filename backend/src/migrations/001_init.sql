-- Supply Chain Database Schema
-- Compatible with both PostgreSQL and Supabase

-- Enable UUID extension (Supabase has this by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'distributor', 'retailer', 'consumer', 'regulator')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  wallet_address VARCHAR(42),
  company_name VARCHAR(255),
  license_number VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Produce batches table
CREATE TABLE IF NOT EXISTS produce_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_number VARCHAR(100) UNIQUE NOT NULL,
  farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_owner_id UUID NOT NULL REFERENCES users(id),
  produce_type VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  quantity_kg DECIMAL(10,2) NOT NULL,
  harvest_date DATE NOT NULL,
  expiry_date DATE,
  farm_location JSONB, -- {lat, lng, address}
  certification_type VARCHAR(100),
  certification_body VARCHAR(255),
  organic BOOLEAN DEFAULT FALSE,
  quality_grade VARCHAR(20),
  price_per_kg DECIMAL(10,2),
  blockchain_tx_hash VARCHAR(66), -- Ethereum transaction hash
  contract_address VARCHAR(42), -- Smart contract address
  qr_code_path VARCHAR(500),
  images JSONB, -- Array of image URLs
  status VARCHAR(50) DEFAULT 'harvested' CHECK (status IN ('harvested', 'in_transit', 'delivered', 'sold', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch transfers/ownership history table
CREATE TABLE IF NOT EXISTS batch_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES produce_batches(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  transfer_type VARCHAR(50) NOT NULL CHECK (transfer_type IN ('sale', 'transfer', 'return')),
  price_paid DECIMAL(10,2),
  quantity_transferred_kg DECIMAL(10,2) NOT NULL,
  location JSONB, -- Transfer location
  blockchain_tx_hash VARCHAR(66),
  digital_signature VARCHAR(500), -- OTP verification signature
  notes TEXT,
  transfer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality checks table
CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES produce_batches(id) ON DELETE CASCADE,
  checker_id UUID NOT NULL REFERENCES users(id),
  check_type VARCHAR(50) NOT NULL CHECK (check_type IN ('visual', 'chemical', 'microbial', 'nutritional')),
  results JSONB NOT NULL, -- Check results and metrics
  passed BOOLEAN NOT NULL,
  check_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location JSONB,
  certificate_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  batch_id UUID REFERENCES produce_batches(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  blockchain_tx_hash VARCHAR(66),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(500),
  related_batch_id UUID REFERENCES produce_batches(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage buckets for Supabase (will be ignored in PostgreSQL)
-- These are created automatically in Supabase, but we document them here

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

CREATE INDEX IF NOT EXISTS idx_produce_batches_batch_number ON produce_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_produce_batches_farmer_id ON produce_batches(farmer_id);
CREATE INDEX IF NOT EXISTS idx_produce_batches_current_owner_id ON produce_batches(current_owner_id);
CREATE INDEX IF NOT EXISTS idx_produce_batches_status ON produce_batches(status);
CREATE INDEX IF NOT EXISTS idx_produce_batches_harvest_date ON produce_batches(harvest_date);

CREATE INDEX IF NOT EXISTS idx_batch_transfers_batch_id ON batch_transfers(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_transfers_from_user ON batch_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_batch_transfers_to_user ON batch_transfers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_batch_transfers_date ON batch_transfers(transfer_date);

CREATE INDEX IF NOT EXISTS idx_quality_checks_batch_id ON quality_checks(batch_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_checker_id ON quality_checks(checker_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_batch_id ON audit_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Row Level Security (RLS) policies for Supabase
-- These will be ignored in regular PostgreSQL

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Produce batches policies
ALTER TABLE produce_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view batches they own or are involved with" ON produce_batches
  FOR SELECT USING (
    farmer_id::text = auth.uid()::text OR 
    current_owner_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM batch_transfers 
      WHERE batch_id = produce_batches.id 
      AND (from_user_id::text = auth.uid()::text OR to_user_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Farmers can create batches" ON produce_batches
  FOR INSERT WITH CHECK (
    farmer_id::text = auth.uid()::text AND
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'farmer')
  );

CREATE POLICY "Owners can update their batches" ON produce_batches
  FOR UPDATE USING (current_owner_id::text = auth.uid()::text);

-- Batch transfers policies
ALTER TABLE batch_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transfers they're involved in" ON batch_transfers
  FOR SELECT USING (
    from_user_id::text = auth.uid()::text OR 
    to_user_id::text = auth.uid()::text
  );

CREATE POLICY "Users can create transfers from their batches" ON batch_transfers
  FOR INSERT WITH CHECK (
    from_user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM produce_batches 
      WHERE id = batch_id AND current_owner_id::text = auth.uid()::text
    )
  );

-- Quality checks policies
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quality checks" ON quality_checks
  FOR SELECT USING (true);

CREATE POLICY "Regulators and owners can create quality checks" ON quality_checks
  FOR INSERT WITH CHECK (
    checker_id::text = auth.uid()::text AND
    (
      EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'regulator') OR
      EXISTS (
        SELECT 1 FROM produce_batches 
        WHERE id = batch_id AND current_owner_id::text = auth.uid()::text
      )
    )
  );

-- Audit logs policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Notifications policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produce_batches_updated_at BEFORE UPDATE ON produce_batches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();