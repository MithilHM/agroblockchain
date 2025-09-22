"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const supabase_1 = require("./supabase");
const logger_1 = require("../utils/logger");
const initializeDatabase = async () => {
    try {
        // Test the connection with a simple query
        const { data, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('count')
            .limit(1);
        if (error) {
            if (error.code === 'PGRST116') {
                // Table doesn't exist - this is expected on first run
                logger_1.logger.warn('⚠️  Database tables not found. Please create them using the Supabase dashboard.');
                logger_1.logger.info(`
📋 SQL to execute in Supabase SQL Editor:

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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
        `);
                // Don't exit, continue without tables for now
                logger_1.logger.info('⚡ Server will continue running. User registration will fail until tables are created.');
                return;
            }
            else {
                throw error;
            }
        }
        logger_1.logger.info('✅ Supabase connection established successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Error connecting to Supabase:', error);
        // Don't exit in development, just warn
        if (process.env.NODE_ENV !== 'production') {
            logger_1.logger.warn('⚠️  Continuing in development mode despite database issues...');
            return;
        }
        process.exit(1);
    }
};
exports.initializeDatabase = initializeDatabase;
exports.default = { initializeDatabase: exports.initializeDatabase };
//# sourceMappingURL=database.js.map