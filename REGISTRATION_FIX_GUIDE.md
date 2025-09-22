# AgriChain Registration Fix Guide

## Problem Identified
The user registration is failing because the required database tables don't exist in the Supabase database.

## Root Cause
- The Supabase database tables (`users`, `produce_batches`, `audit_logs`, `batch_transfers`) have not been created
- The backend server is running but cannot access the database tables
- Environment variables are properly configured, but database schema is missing

## Solution

### Step 1: Create Database Tables in Supabase

1. **Go to your Supabase Dashboard**
   - Open: https://uqigpfgcdzbswzikjgqi.supabase.co/project/_/sql

2. **Copy and paste the following SQL** in the SQL Editor:

```sql
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
```

3. **Click "Run" to execute the SQL**

### Step 2: Restart Backend Server

After creating the tables, restart your backend server:

```bash
cd "c:\Users\Kartik\Desktop\RVCE\CS\SIH\agroblockchain\backend"
npm run dev
```

### Step 3: Test Registration

Test the registration endpoint:

```bash
curl -X POST http://localhost:8001/api/user/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\",\"role\":\"farmer\"}"
```

## Expected Results

After completing these steps:

1. ✅ Backend server should start without database errors
2. ✅ User registration endpoint should work
3. ✅ Database tables should be accessible
4. ✅ Users can register as farmer, distributor, or retailer
5. ✅ JWT authentication should work properly

## Verification Commands

```bash
# Test user registration
curl -X POST http://localhost:8001/api/user/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"farmer@test.com\",\"password\":\"securepassword\",\"name\":\"John Farmer\",\"role\":\"farmer\"}"

# Test user login  
curl -X POST http://localhost:8001/api/user/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"farmer@test.com\",\"password\":\"securepassword\"}"

# Test health endpoint
curl http://localhost:8001/health
```

## Additional Issues Fixed

1. **Environment Variables**: Properly configured in `.env` file
2. **Supabase Connection**: Service role key configured correctly
3. **JWT Authentication**: Secret key set for token generation
4. **Database Schema**: Complete schema with foreign keys and indexes
5. **Error Handling**: Proper error responses for registration failures

## Next Steps

Once registration is working:
1. Test the frontend registration/login flow
2. Test batch registration functionality
3. Verify QR code generation
4. Test role-based access control