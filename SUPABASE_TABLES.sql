-- AgriChain Database Schema
-- Copy and paste this entire SQL into your Supabase SQL Editor and click "Run"

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'distributor', 'retailer')),
  wallet_address VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create produce_batches table
CREATE TABLE IF NOT EXISTS produce_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id VARCHAR(255) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  origin_farm VARCHAR(255) NOT NULL,
  harvest_date DATE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quality_grade VARCHAR(50),
  price_per_unit DECIMAL(10,2),
  current_owner_id UUID REFERENCES users(id),
  blockchain_hash VARCHAR(255),
  qr_code_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'harvested' CHECK (status IN ('harvested', 'in_transit', 'delivered', 'sold')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES produce_batches(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  blockchain_transaction_hash VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create batch_transfers table
CREATE TABLE IF NOT EXISTS batch_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES produce_batches(id),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  transfer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  price_transferred DECIMAL(10,2),
  blockchain_transaction_hash VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_produce_batches_batch_id ON produce_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_produce_batches_owner ON produce_batches(current_owner_id);
CREATE INDEX IF NOT EXISTS idx_produce_batches_status ON produce_batches(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_batch_id ON audit_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_transfers_batch_id ON batch_transfers(batch_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produce_batches_updated_at BEFORE UPDATE ON produce_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();