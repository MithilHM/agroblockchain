const { createClient } = require('@supabase/supabase-js');

async function setupDatabase() {
  const supabase = createClient(
    'https://wgxbgurprtunukhquymd.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneGJndXJwcnR1bnVraHF1eW1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU1MDA1OCwiZXhwIjoyMDc0MTI2MDU4fQ.VXQJGNmWiFjaH3FEcDTszrNAOtNhBqPgNTN_nKepXl4'
  );

  console.log('🔄 Setting up Supabase database tables...');

  // Create a simple user manually for testing
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: 'test@example.com',
          password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewAYZKbD3P8nGhte', // 'password123'
          role: 'farmer',
          first_name: 'Test',
          last_name: 'User',
          is_verified: false,
          is_active: true
        }
      ])
      .select();

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('\n📝 You need to create the users table manually in Supabase SQL Editor:');
      console.log(`
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
      `);
    } else {
      console.log('✅ Test user created successfully:', data);
    }
  } catch (err) {
    console.log('⚠️  Error:', err.message);
  }
}

setupDatabase();