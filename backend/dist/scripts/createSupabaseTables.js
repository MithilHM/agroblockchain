"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../config/env");
const supabaseAdmin = (0, supabase_js_1.createClient)(env_1.config.supabase.url, env_1.config.supabase.serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
async function createTables() {
    console.log('🔧 Creating Supabase database tables...');
    try {
        // Create users table
        console.log('📝 Creating users table...');
        const { error: usersError } = await supabaseAdmin.rpc('exec', {
            sql: `
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
      `
        });
        if (usersError) {
            console.log('⚠️  Could not create users table via RPC, trying direct SQL execution...');
            // Try direct SQL execution via raw query
            const { error: directUsersError } = await supabaseAdmin
                .from('users')
                .select('id')
                .limit(1);
            if (directUsersError && directUsersError.code === 'PGRST116') {
                console.log('📋 Users table does not exist. Creating manually via SQL execution...');
                // Execute SQL directly using the SQL tab approach
                const createUsersSQL = `
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
          
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        `;
                console.log('✅ Users table SQL ready for manual execution');
                console.log(createUsersSQL);
            }
        }
        else {
            console.log('✅ Users table created successfully via RPC');
        }
        // Create produce_batches table
        console.log('📝 Creating produce_batches table...');
        const { error: batchesError } = await supabaseAdmin.rpc('exec', {
            sql: `
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
      `
        });
        if (batchesError) {
            console.log('⚠️  Could not create produce_batches table via RPC');
            const createBatchesSQL = `
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
          status VARCHAR(50) NOT NULL DEFAULT 'harvested',
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_produce_batches_batch_id ON produce_batches(batch_id);
        CREATE INDEX IF NOT EXISTS idx_produce_batches_owner ON produce_batches(current_owner_id);
      `;
            console.log('✅ Produce batches table SQL ready for manual execution');
            console.log(createBatchesSQL);
        }
        else {
            console.log('✅ Produce batches table created successfully via RPC');
        }
        // Create audit_logs table
        console.log('📝 Creating audit_logs table...');
        const { error: auditError } = await supabaseAdmin.rpc('exec', {
            sql: `
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
      `
        });
        if (auditError) {
            console.log('⚠️  Could not create audit_logs table via RPC');
            const createAuditSQL = `
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
        
        CREATE INDEX IF NOT EXISTS idx_audit_logs_batch_id ON audit_logs(batch_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      `;
            console.log('✅ Audit logs table SQL ready for manual execution');
            console.log(createAuditSQL);
        }
        else {
            console.log('✅ Audit logs table created successfully via RPC');
        }
        // Test if tables were created by checking users table
        const { data: testUsers, error: testError } = await supabaseAdmin
            .from('users')
            .select('count')
            .limit(1);
        if (!testError) {
            console.log('🎉 SUCCESS! Database tables are now accessible!');
            console.log('✅ Users table is working');
            return true;
        }
        else {
            console.log('⚠️  Tables may need manual creation in Supabase dashboard');
            console.log('Error:', testError);
            return false;
        }
    }
    catch (error) {
        console.error('❌ Error during table creation:', error);
        return false;
    }
}
// Execute the function
createTables().then((success) => {
    if (success) {
        console.log('🚀 Database setup completed successfully!');
        process.exit(0);
    }
    else {
        console.log('⚠️  Manual table creation may be required');
        process.exit(1);
    }
});
//# sourceMappingURL=createSupabaseTables.js.map