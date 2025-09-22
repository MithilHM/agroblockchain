import { DataSource } from 'typeorm';
import { config } from './env';
import { User } from '../models/User';
import { ProduceBatch } from '../models/ProduceBatch';
import { AuditLog } from '../models/Auditlog';
import { databaseManager } from './database';

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

export const initializeDatabase = async (): Promise<void> => {
  try {
    await databaseManager.initialize();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};

export default AppDataSource;