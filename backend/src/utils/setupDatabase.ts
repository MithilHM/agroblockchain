import { supabaseAdmin } from '../config/supabase';
import { logger } from './logger';

export async function setupDatabaseTables(): Promise<void> {
  try {
    logger.info('🔧 Setting up database tables...');

    // Create users table
    await supabaseAdmin.rpc('exec_sql', {
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

    // Create produce_batches table
    await supabaseAdmin.rpc('exec_sql', {
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

    // Create audit_logs table
    await supabaseAdmin.rpc('exec_sql', {
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

    logger.info('✅ Database tables setup completed');
  } catch (error) {
    logger.warn('⚠️  Database tables may need to be created manually in Supabase dashboard');
    logger.warn('Error:', error);
  }
}