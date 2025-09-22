import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './env';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

class SupabaseService {
  private static instance: SupabaseService;
  private supabaseClient: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;

  private constructor() {}

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Initialize Supabase clients
   */
  public initialize(): void {
    if (!config.supabase.url || !config.supabase.anonKey) {
      console.warn('Supabase configuration not found. Running in local mode only.');
      return;
    }

    // Regular client with anon key (for client-side operations)
    this.supabaseClient = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false
        }
      }
    );

    // Admin client with service role key (for server-side operations)
    if (config.supabase.serviceRoleKey) {
      this.adminClient = createClient(
        config.supabase.url,
        config.supabase.serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
    }

    console.log('✅ Supabase clients initialized');
  }

  /**
   * Get the regular Supabase client (with anon key)
   */
  public getClient(): SupabaseClient | null {
    return this.supabaseClient;
  }

  /**
   * Get the admin Supabase client (with service role key)
   */
  public getAdminClient(): SupabaseClient | null {
    return this.adminClient;
  }

  /**
   * Check if Supabase is available
   */
  public isAvailable(): boolean {
    return this.supabaseClient !== null;
  }

  /**
   * Create a user with email and password
   */
  public async createUser(email: string, password: string, metadata?: any) {
    if (!this.adminClient) {
      throw new Error('Supabase admin client not available');
    }

    const { data, error } = await this.adminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: true
    });

    if (error) throw error;
    return data;
  }

  /**
   * Update user metadata
   */
  public async updateUser(userId: string, updates: any) {
    if (!this.adminClient) {
      throw new Error('Supabase admin client not available');
    }

    const { data, error } = await this.adminClient.auth.admin.updateUserById(userId, updates);
    if (error) throw error;
    return data;
  }

  /**
   * Delete a user
   */
  public async deleteUser(userId: string) {
    if (!this.adminClient) {
      throw new Error('Supabase admin client not available');
    }

    const { error } = await this.adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;
  }

  /**
   * Upload file to Supabase Storage
   */
  public async uploadFile(bucketName: string, filePath: string, file: Buffer, options?: any) {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await this.supabaseClient.storage
      .from(bucketName)
      .upload(filePath, file, options);

    if (error) throw error;
    return data;
  }

  /**
   * Get file URL from Supabase Storage
   */
  public getFileUrl(bucketName: string, filePath: string): string {
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
  public async query(table: string) {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not available');
    }

    return this.supabaseClient.from(table);
  }

  /**
   * Execute RPC (Remote Procedure Call) function
   */
  public async rpc(functionName: string, params?: any) {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await this.supabaseClient.rpc(functionName, params);
    if (error) throw error;
    return data;
  }
}

// Export singleton instance
export const supabaseService = SupabaseService.getInstance();

// Database abstraction layer
export class DatabaseService {
  /**
   * Determine whether to use local PostgreSQL or Supabase
   */
  public static isUsingSupabase(): boolean {
    return config.database.mode === 'supabase' && supabaseService.isAvailable();
  }

  /**
   * Get database connection information
   */
  public static getDatabaseInfo() {
    if (this.isUsingSupabase()) {
      return {
        type: 'supabase',
        url: config.supabase.url
      };
    }
    return {
      type: 'postgresql',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name
    };
  }
}