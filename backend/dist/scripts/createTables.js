"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../config/supabase");
const logger_1 = require("../utils/logger");
async function createTables() {
    try {
        logger_1.logger.info('🔧 Creating database tables...');
        // Create users table
        const usersResult = await supabase_1.supabaseAdmin.from('users').select('count').limit(1);
        if (usersResult.error && usersResult.error.code === 'PGRST116') {
            // Table doesn't exist, create it using SQL query
            console.log('Creating users table...');
            // Note: We need to create tables directly in Supabase dashboard or using SQL editor
            // This script is for reference - tables should be created manually
            logger_1.logger.info(`
        Please create the following tables in your Supabase SQL Editor:
        
        -- Users table
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
        
        -- Produce batches table
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
        
        -- Audit logs table
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
        
        -- Create indexes
        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_users_role ON users(role);
        CREATE INDEX idx_produce_batches_batch_id ON produce_batches(batch_id);
      `);
        }
        else {
            logger_1.logger.info('✅ Users table already exists or is accessible');
        }
    }
    catch (error) {
        logger_1.logger.error('Error checking/creating tables:', error);
    }
}
createTables();
//# sourceMappingURL=createTables.js.map