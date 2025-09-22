import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { AppDataSource } from '../config/db';
import { supabaseService } from '../config/supabase';

class MigrationRunner {
  /**
   * Run migrations based on database mode
   */
  public static async run(): Promise<void> {
    console.log('🔄 Starting database migrations...');
    
    if (config.database.mode === 'supabase') {
      await this.runSupabaseMigrations();
    } else {
      await this.runPostgreSQLMigrations();
    }
    
    console.log('✅ Migrations completed successfully');
  }

  /**
   * Run migrations on Supabase
   */
  private static async runSupabaseMigrations(): Promise<void> {
    console.log('📡 Running Supabase migrations...');
    
    const client = supabaseService.getAdminClient();
    if (!client) {
      throw new Error('Supabase admin client not available');
    }

    const migrationFiles = this.getMigrationFiles();
    
    for (const file of migrationFiles) {
      console.log(`Executing migration: ${file}`);
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      
      // For Supabase, we need to execute SQL through the client
      // Note: This is a simplified approach. In production, you might want to use Supabase CLI
      try {
        const { error } = await client.rpc('exec_sql', { sql_query: sql });
        if (error) {
          console.error(`Error in migration ${file}:`, error);
          throw error;
        }
        console.log(`✅ Migration ${file} completed`);
      } catch (error) {
        console.warn(`⚠️  Migration ${file} may have already been applied or needs manual execution`);
        console.warn('Please run this migration manually in your Supabase SQL editor:');
        console.warn(`File: ${file}`);
      }
    }
  }

  /**
   * Run migrations on local PostgreSQL
   */
  private static async runPostgreSQLMigrations(): Promise<void> {
    console.log('🐘 Running PostgreSQL migrations...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const migrationFiles = this.getMigrationFiles();
    
    for (const file of migrationFiles) {
      console.log(`Executing migration: ${file}`);
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      
      try {
        await AppDataSource.query(sql);
        console.log(`✅ Migration ${file} completed`);
      } catch (error) {
        console.error(`Error in migration ${file}:`, error);
        throw error;
      }
    }
  }

  /**
   * Get all migration files in order
   */
  private static getMigrationFiles(): string[] {
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    return files;
  }

  /**
   * Create Supabase storage buckets
   */
  public static async createStorageBuckets(): Promise<void> {
    if (config.database.mode !== 'supabase') {
      return;
    }

    console.log('📦 Creating Supabase storage buckets...');
    
    const client = supabaseService.getAdminClient();
    if (!client) {
      throw new Error('Supabase admin client not available');
    }

    const buckets = [
      {
        id: 'batch-images',
        name: 'Batch Images',
        public: true
      },
      {
        id: 'quality-certificates',
        name: 'Quality Certificates',
        public: true
      },
      {
        id: 'user-documents',
        name: 'User Documents',
        public: false
      },
      {
        id: 'qr-codes',
        name: 'QR Codes',
        public: true
      }
    ];

    for (const bucket of buckets) {
      try {
        const { error } = await client.storage.createBucket(bucket.id, {
          public: bucket.public,
          allowedMimeTypes: ['image/*', 'application/pdf'],
          fileSizeLimit: 10 * 1024 * 1024 // 10MB
        });

        if (error && error.message !== 'Bucket already exists') {
          console.error(`Error creating bucket ${bucket.id}:`, error);
        } else {
          console.log(`✅ Bucket ${bucket.id} ready`);
        }
      } catch (error) {
        console.warn(`⚠️  Bucket ${bucket.id} may already exist`);
      }
    }
  }

  /**
   * Seed initial data
   */
  public static async seedData(): Promise<void> {
    console.log('🌱 Seeding initial data...');
    
    // Create admin user if it doesn't exist
    const adminUser = {
      email: 'admin@supplychain.com',
      password: 'admin123', // In production, use a secure password
      role: 'regulator',
      first_name: 'System',
      last_name: 'Administrator',
      is_verified: true,
      is_active: true
    };

    if (config.database.mode === 'supabase') {
      await this.seedSupabaseData(adminUser);
    } else {
      await this.seedPostgreSQLData(adminUser);
    }
  }

  private static async seedSupabaseData(adminUser: any): Promise<void> {
    const client = supabaseService.getClient();
    if (!client) return;

    // Check if admin user exists
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('email', adminUser.email)
      .single();

    if (!existingUser) {
      const { error } = await client.from('users').insert([adminUser]);
      if (error) {
        console.error('Error seeding admin user:', error);
      } else {
        console.log('✅ Admin user created');
      }
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  }

  private static async seedPostgreSQLData(adminUser: any): Promise<void> {
    try {
      const result = await AppDataSource.query(
        'SELECT id FROM users WHERE email = $1',
        [adminUser.email]
      );

      if (result.length === 0) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(adminUser.password, 10);
        
        await AppDataSource.query(`
          INSERT INTO users (email, password_hash, role, first_name, last_name, is_verified, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          adminUser.email,
          hashedPassword,
          adminUser.role,
          adminUser.first_name,
          adminUser.last_name,
          adminUser.is_verified,
          adminUser.is_active
        ]);
        
        console.log('✅ Admin user created');
      } else {
        console.log('ℹ️  Admin user already exists');
      }
    } catch (error) {
      console.error('Error seeding admin user:', error);
    }
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      await MigrationRunner.run();
      await MigrationRunner.createStorageBuckets();
      await MigrationRunner.seedData();
      console.log('🎉 Database setup completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  })();
}

export default MigrationRunner;