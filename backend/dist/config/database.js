"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.databaseManager = exports.DatabaseManager = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const env_1 = require("./env");
const supabase_1 = require("./supabase");
const User_1 = require("../models/User");
const ProduceBatch_1 = require("../models/ProduceBatch");
const Auditlog_1 = require("../models/Auditlog");
// TypeORM DataSource for local PostgreSQL
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: env_1.config.database.host,
    port: env_1.config.database.port,
    username: env_1.config.database.username,
    password: env_1.config.database.password,
    database: env_1.config.database.name,
    synchronize: env_1.config.NODE_ENV !== 'production',
    logging: env_1.config.NODE_ENV === 'development',
    entities: [User_1.User, ProduceBatch_1.ProduceBatch, Auditlog_1.AuditLog],
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscribers/*.ts'],
});
/**
 * Database initialization service that supports both local PostgreSQL and Supabase
 */
class DatabaseManager {
    constructor() {
        this.initialized = false;
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    /**
     * Initialize the database connection based on configuration
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            if (env_1.config.database.mode === 'supabase') {
                await this.initializeSupabase();
            }
            else {
                await this.initializePostgreSQL();
            }
            this.initialized = true;
            console.log('✅ Database initialized successfully');
        }
        catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    /**
     * Initialize Supabase connection
     */
    async initializeSupabase() {
        if (!env_1.config.supabase.url || !env_1.config.supabase.anonKey) {
            throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
        }
        supabase_1.supabaseService.initialize();
        // Test the connection
        const client = supabase_1.supabaseService.getClient();
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
    async initializePostgreSQL() {
        await exports.AppDataSource.initialize();
        console.log('🐘 PostgreSQL connection established');
    }
    /**
     * Get the appropriate database client
     */
    getConnection() {
        if (env_1.config.database.mode === 'supabase') {
            return supabase_1.supabaseService.getClient();
        }
        return exports.AppDataSource;
    }
    /**
     * Check if using Supabase
     */
    isUsingSupabase() {
        return env_1.config.database.mode === 'supabase' && supabase_1.supabaseService.isAvailable();
    }
    /**
     * Close database connections
     */
    async close() {
        if (env_1.config.database.mode === 'local' && exports.AppDataSource.isInitialized) {
            await exports.AppDataSource.destroy();
            console.log('🐘 PostgreSQL connection closed');
        }
        // Supabase doesn't require manual connection closing
    }
    /**
     * Get database information
     */
    getDatabaseInfo() {
        if (this.isUsingSupabase()) {
            return {
                type: 'supabase',
                url: env_1.config.supabase.url,
                mode: env_1.config.database.mode
            };
        }
        return {
            type: 'postgresql',
            host: env_1.config.database.host,
            port: env_1.config.database.port,
            database: env_1.config.database.name,
            mode: env_1.config.database.mode
        };
    }
}
exports.DatabaseManager = DatabaseManager;
// Export singleton instance
exports.databaseManager = DatabaseManager.getInstance();
// Legacy export for backward compatibility
const initializeDatabase = async () => {
    await exports.databaseManager.initialize();
};
exports.initializeDatabase = initializeDatabase;
exports.default = exports.AppDataSource;
