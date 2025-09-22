const https = require('https');

// Direct REST API call to Supabase to create tables
async function createTables() {
  const url = 'https://wgxbgurprtunukhquymd.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneGJndXJwcnR1bnVraHF1eW1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU1MDA1OCwiZXhwIjoyMDc0MTI2MDU4fQ.VXQJGNmWiFjaH3FEcDTszrNAOtNhBqPgNTN_nKepXl4';

  // SQL to create users table
  const createUsersSQL = `
    CREATE TABLE IF NOT EXISTS users (
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
  `;

  console.log('🔄 Creating users table in Supabase...');
  console.log('📋 SQL to execute in Supabase SQL Editor:');
  console.log('');
  console.log(createUsersSQL);
  console.log('');
  console.log('🔗 Go to: https://supabase.com/dashboard/project/wgxbgurprtunukhquymd/sql/new');
  console.log('📝 Copy and paste the SQL above, then click "Run"');
  console.log('');
  
  // Also create a simple test user insertion SQL
  console.log('📝 After creating the table, you can test with this user:');
  console.log(`
INSERT INTO users (email, password_hash, role, first_name, last_name, is_verified, is_active)
VALUES (
  'admin@supplychain.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewAYZKbD3P8nGhte',
  'regulator',
  'System',
  'Administrator',
  true,
  true
);
  `);
}

createTables();