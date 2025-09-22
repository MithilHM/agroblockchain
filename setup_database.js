const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wgxbgurprtunukhquymd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneGJndXJwcnR1bnVraHF1eW1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU1MDA1OCwiZXhwIjoyMDc0MTI2MDU4fQ.VXQJGNmWiFjaH3FEcDTszrNAOtNhBqPgNTN_nKepXl4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🔄 Setting up database tables...');
  
  try {
    // Create users table
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      `
    });

    if (usersError) {
      console.log('Users table may already exist or needs manual creation');
    } else {
      console.log('✅ Users table created');
    }

  } catch (error) {
    console.log('⚠️  Database setup requires manual intervention');
    console.log('Please execute the following SQL in your Supabase SQL editor:');
    console.log(`
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number VARCHAR(100) UNIQUE NOT NULL,
  farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_owner_id UUID NOT NULL REFERENCES users(id),
  produce_type VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  quantity_kg DECIMAL(10,2) NOT NULL,
  harvest_date DATE NOT NULL,
  expiry_date DATE,
  farm_location JSONB,
  certification_type VARCHAR(100),
  certification_body VARCHAR(255),
  organic BOOLEAN DEFAULT FALSE,
  quality_grade VARCHAR(20),
  price_per_kg DECIMAL(10,2),
  blockchain_tx_hash VARCHAR(66),
  contract_address VARCHAR(42),
  qr_code_path VARCHAR(500),
  images JSONB,
  status VARCHAR(50) DEFAULT 'harvested' CHECK (status IN ('harvested', 'in_transit', 'delivered', 'sold', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);
  }
}

setupDatabase();