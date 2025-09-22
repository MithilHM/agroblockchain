import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

// Use the admin client with service role key
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createTablesManually() {
  console.log('🔧 Creating Supabase database tables manually...');
  
  try {
    // First, let's try to use the SQL REST API directly
    const response = await fetch(`${config.supabase.url}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.supabase.serviceRoleKey}`,
        'apikey': config.supabase.serviceRoleKey
      },
      body: JSON.stringify({
        sql: `
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
        `
      })
    });

    if (!response.ok) {
      console.log('⚠️  Direct SQL execution failed, trying alternative approach...');
      
      // Alternative: Try creating tables one by one using supabase-js
      console.log('📝 Creating users table...');
      
      // Try to access the users table to see if it exists
      const { error: usersCheck } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);
        
      if (usersCheck && usersCheck.code === 'PGRST116') {
        console.log('❌ Users table does not exist and cannot be created via API');
        console.log('📋 Please execute the following SQL in your Supabase SQL Editor:');
        console.log('');
        console.log('-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR --');
        console.log(`
-- Create users table
CREATE TABLE users (
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
CREATE TABLE produce_batches (
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
CREATE TABLE audit_logs (
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
CREATE TABLE batch_transfers (
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
        `);
        console.log('-- END OF SQL TO COPY --');
        console.log('');
        console.log('📝 Instructions:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to the SQL Editor');
        console.log('3. Copy and paste the SQL above');
        console.log('4. Click "Run" to execute');
        console.log('5. Restart your backend server');
        
        return false;
      } else {
        console.log('✅ Users table already exists or is accessible');
        return true;
      }
    } else {
      console.log('✅ Tables created successfully via direct SQL execution');
      
      // Test if tables were created
      const { error: testError } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);
        
      if (!testError) {
        console.log('🎉 SUCCESS! Database tables are now accessible!');
        return true;
      } else {
        console.log('⚠️  Tables may not be fully accessible yet');
        return false;
      }
    }
    
  } catch (error) {
    console.error('❌ Error during table creation:', error);
    return false;
  }
}

// Execute the function
createTablesManually().then((success) => {
  if (success) {
    console.log('🚀 Database setup completed successfully!');
    console.log('✅ You can now restart your backend server');
    process.exit(0);
  } else {
    console.log('⚠️  Manual intervention required - see instructions above');
    process.exit(1);
  }
});