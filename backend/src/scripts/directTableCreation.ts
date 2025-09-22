import { createClient } from '@supabase/supabase-js';

// Using the credentials from the .env file
const SUPABASE_URL = 'https://uqigpfgcdzbswzikjgqi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaWdwZmdjZHpic3d6aWtqZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODUyNjczOSwiZXhwIjoyMDc0MTAyNzM5fQ.mvKgMwVRYKMIiHys7R4f4XJa10xuj4RTZ8XD98rx0II';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDatabaseTables() {
  console.log('🔧 Creating database tables in Supabase...');

  try {
    // SQL to create all required tables
    const createTablesSQL = `
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
    `;

    // Try using the REST API directly
    console.log('📝 Executing SQL via REST API...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sql: createTablesSQL
      })
    });

    if (response.ok) {
      console.log('✅ Tables created successfully via REST API');
    } else {
      console.log('⚠️  REST API approach failed, trying alternative method...');
      
      // Alternative: Use SQL endpoint
      console.log('📝 Trying SQL endpoint...');
      
      const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        },
        body: createTablesSQL
      });

      if (sqlResponse.ok) {
        console.log('✅ Tables created successfully via SQL endpoint');
      } else {
        const errorText = await sqlResponse.text();
        console.log('❌ SQL endpoint failed:', errorText);
        
        console.log('');
        console.log('📋 MANUAL SETUP REQUIRED:');
        console.log('Please copy and paste the following SQL into your Supabase SQL Editor:');
        console.log('');
        console.log('-- COPY FROM HERE --');
        console.log(createTablesSQL);
        console.log('-- COPY TO HERE --');
        console.log('');
        console.log('Instructions:');
        console.log('1. Go to https://uqigpfgcdzbswzikjgqi.supabase.co/project/_/sql');
        console.log('2. Paste the SQL above');
        console.log('3. Click "Run"');
        console.log('4. Restart your backend server');
        
        return false;
      }
    }

    // Test if tables were created
    console.log('🧪 Testing table creation...');
    
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.log('⚠️  Tables may not be fully accessible:', error.message);
      return false;
    } else {
      console.log('🎉 SUCCESS! Database tables are working!');
      return true;
    }

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    return false;
  }
}

// Execute the function
createDatabaseTables().then((success) => {
  if (success) {
    console.log('🚀 Database setup completed successfully!');
    console.log('✅ You can now restart your backend server and test registration');
    process.exit(0);
  } else {
    console.log('⚠️  Manual table creation may be required');
    process.exit(1);
  }
});