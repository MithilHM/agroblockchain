import { supabaseAdmin } from './supabase';
import { logger } from '../utils/logger';

export const initializeDatabase = async (): Promise<void> => {
  try {
    // Test the connection
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = relation does not exist (table not created yet)
      throw error;
    }
    
    logger.info('✅ Supabase connection established successfully');
    
    // Create tables if they don't exist
    await createTables();
    
  } catch (error) {
    logger.error('❌ Error connecting to Supabase:', error);
    process.exit(1);
  }
};

const createTables = async (): Promise<void> => {
  try {
    // Create users table
    await supabaseAdmin.rpc('create_users_table_if_not_exists');
    
    // Create produce_batches table  
    await supabaseAdmin.rpc('create_produce_batches_table_if_not_exists');
    
    // Create audit_logs table
    await supabaseAdmin.rpc('create_audit_logs_table_if_not_exists');
    
    logger.info('✅ Database tables initialized');
  } catch (error) {
    logger.warn('⚠️  Could not create tables via RPC, they may need to be created manually in Supabase dashboard');
    logger.warn('Error:', error);
  }
};

export default { initializeDatabase };