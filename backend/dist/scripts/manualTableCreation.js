"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../config/env");
const supabase = (0, supabase_js_1.createClient)(env_1.config.supabase.url, env_1.config.supabase.serviceRoleKey);
async function createTablesManually() {
    try {
        console.log('Creating tables manually...');
        // Create users table
        const { error: usersError } = await supabase.rpc('sql', {
            query: `
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
            console.error('Error creating users table:', usersError);
        }
        else {
            console.log('✅ Users table created successfully');
        }
        // Create produce_batches table
        const { error: batchesError } = await supabase.rpc('sql', {
            query: `
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
            console.error('Error creating produce_batches table:', batchesError);
        }
        else {
            console.log('✅ Produce batches table created successfully');
        }
        // Create audit_logs table
        const { error: auditError } = await supabase.rpc('sql', {
            query: `
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
            console.error('Error creating audit_logs table:', auditError);
        }
        else {
            console.log('✅ Audit logs table created successfully');
        }
        console.log('Database setup completed!');
    }
    catch (error) {
        console.error('Fatal error during table creation:', error);
    }
}
createTablesManually();
//# sourceMappingURL=manualTableCreation.js.map