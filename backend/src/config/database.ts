import { DataSource } from 'typeorm';
import { config } from './env';
import { supabaseService } from './supabase';
import { User } from '../models/User';
import { ProduceBatch } from '../models/ProduceBatch';
import { AuditLog } from '../models/Auditlog';

// TypeORM DataSource for local PostgreSQL
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  synchronize: config.NODE_ENV !== 'production',
  logging: config.NODE_ENV === 'development',
  entities: [User, ProduceBatch, AuditLog],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});

/**
 * Database initialization service that supports both local PostgreSQL and Supabase
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private initialized = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize the database connection based on configuration
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      if (config.database.mode === 'supabase') {
        await this.initializeSupabase();
      } else {
        await this.initializePostgreSQL();
      }
      
      this.initialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Supabase connection
   */
  private async initializeSupabase(): Promise<void> {
    if (!config.supabase.url || !config.supabase.anonKey) {
      throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
    }

    supabaseService.initialize();
    
    // Test the connection
    const client = supabaseService.getClient();
    if (!client) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Test query to verify connection
    const { error } = await client.from('users').select('*').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned", which is fine
      console.warn('Supabase connection test warning:', error.message);
    }

    console.log('📡 Supabase connection established');
  }

  /**
   * Initialize local PostgreSQL connection
   */
  private async initializePostgreSQL(): Promise<void> {
    await AppDataSource.initialize();
    console.log('🐘 PostgreSQL connection established');
  }

  /**
   * Get the appropriate database client
   */
  public getConnection() {
    if (config.database.mode === 'supabase') {
      return supabaseService.getClient();
    }
    return AppDataSource;
  }

  /**
   * Check if using Supabase
   */
  public isUsingSupabase(): boolean {
    return config.database.mode === 'supabase' && supabaseService.isAvailable();
  }

  /**
   * Close database connections
   */
  public async close(): Promise<void> {
    if (config.database.mode === 'local' && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🐘 PostgreSQL connection closed');
    }
    // Supabase doesn't require manual connection closing
  }

  /**
   * Get database information
   */
  public getDatabaseInfo() {
    if (this.isUsingSupabase()) {
      return {
        type: 'supabase',
        url: config.supabase.url,
        mode: config.database.mode
      };
    }
    return {
      type: 'postgresql',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      mode: config.database.mode
    };
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();

// Legacy export for backward compatibility
export const initializeDatabase = async (): Promise<void> => {
  await databaseManager.initialize();
};

export default AppDataSource;