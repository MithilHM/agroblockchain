"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = exports.supabaseService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
class SupabaseService {
    constructor() {
        this.supabaseClient = null;
        this.adminClient = null;
    }
    static getInstance() {
        if (!SupabaseService.instance) {
            SupabaseService.instance = new SupabaseService();
        }
        return SupabaseService.instance;
    }
    /**
     * Initialize Supabase clients
     */
    initialize() {
        if (!env_1.config.supabase.url || !env_1.config.supabase.anonKey) {
            console.warn('Supabase configuration not found. Running in local mode only.');
            return;
        }
        // Regular client with anon key (for client-side operations)
        this.supabaseClient = (0, supabase_js_1.createClient)(env_1.config.supabase.url, env_1.config.supabase.anonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: false
            }
        });
        // Admin client with service role key (for server-side operations)
        if (env_1.config.supabase.serviceRoleKey) {
            this.adminClient = (0, supabase_js_1.createClient)(env_1.config.supabase.url, env_1.config.supabase.serviceRoleKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
        }
        console.log('✅ Supabase clients initialized');
    }
    /**
     * Get the regular Supabase client (with anon key)
     */
    getClient() {
        return this.supabaseClient;
    }
    /**
     * Get the admin Supabase client (with service role key)
     */
    getAdminClient() {
        return this.adminClient;
    }
    /**
     * Check if Supabase is available
     */
    isAvailable() {
        return this.supabaseClient !== null;
    }
    /**
     * Create a user with email and password
     */
    async createUser(email, password, metadata) {
        if (!this.adminClient) {
            throw new Error('Supabase admin client not available');
        }
        const { data, error } = await this.adminClient.auth.admin.createUser({
            email,
            password,
            user_metadata: metadata,
            email_confirm: true
        });
        if (error)
            throw error;
        return data;
    }
    /**
     * Update user metadata
     */
    async updateUser(userId, updates) {
        if (!this.adminClient) {
            throw new Error('Supabase admin client not available');
        }
        const { data, error } = await this.adminClient.auth.admin.updateUserById(userId, updates);
        if (error)
            throw error;
        return data;
    }
    /**
     * Delete a user
     */
    async deleteUser(userId) {
        if (!this.adminClient) {
            throw new Error('Supabase admin client not available');
        }
        const { error } = await this.adminClient.auth.admin.deleteUser(userId);
        if (error)
            throw error;
    }
    /**
     * Upload file to Supabase Storage
     */
    async uploadFile(bucketName, filePath, file, options) {
        if (!this.supabaseClient) {
            throw new Error('Supabase client not available');
        }
        const { data, error } = await this.supabaseClient.storage
            .from(bucketName)
            .upload(filePath, file, options);
        if (error)
            throw error;
        return data;
    }
    /**
     * Get file URL from Supabase Storage
     */
    getFileUrl(bucketName, filePath) {
        if (!this.supabaseClient) {
            throw new Error('Supabase client not available');
        }
        const { data } = this.supabaseClient.storage
            .from(bucketName)
            .getPublicUrl(filePath);
        return data.publicUrl;
    }
    /**
     * Execute a database query using Supabase
     */
    async query(table) {
        if (!this.supabaseClient) {
            throw new Error('Supabase client not available');
        }
        return this.supabaseClient.from(table);
    }
    /**
     * Execute RPC (Remote Procedure Call) function
     */
    async rpc(functionName, params) {
        if (!this.supabaseClient) {
            throw new Error('Supabase client not available');
        }
        const { data, error } = await this.supabaseClient.rpc(functionName, params);
        if (error)
            throw error;
        return data;
    }
}
// Export singleton instance
exports.supabaseService = SupabaseService.getInstance();
// Database abstraction layer
class DatabaseService {
    /**
     * Determine whether to use local PostgreSQL or Supabase
     */
    static isUsingSupabase() {
        return env_1.config.database.mode === 'supabase' && exports.supabaseService.isAvailable();
    }
    /**
     * Get database connection information
     */
    static getDatabaseInfo() {
        if (this.isUsingSupabase()) {
            return {
                type: 'supabase',
                url: env_1.config.supabase.url
            };
        }
        return {
            type: 'postgresql',
            host: env_1.config.database.host,
            port: env_1.config.database.port,
            database: env_1.config.database.name
        };
    }
}
exports.DatabaseService = DatabaseService;
