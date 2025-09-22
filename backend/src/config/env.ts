import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'supplychain'
  },

  // Blockchain
  blockchain: {
    rpcUrl: process.env.RPC_URL || '',
    contractAddress: process.env.CONTRACT_ADDRESS || '',
    privateKey: process.env.PRIVATE_KEY || ''
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expire: process.env.JWT_EXPIRE || '24h'
  },

  // AWS S3
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.S3_BUCKET_NAME || 'supply-chain-files'
  },

  // IPFS
  ipfs: {
    url: process.env.IPFS_URL || 'http://localhost:5001'
  },

  // QR Codes
  qr: {
    baseUrl: process.env.QR_BASE_URL || 'http://localhost:3000/batch'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// Validate required environment variables
const requiredVars = ['JWT_SECRET', 'DB_PASSWORD'];

if (config.NODE_ENV === 'production') {
  requiredVars.push('RPC_URL', 'CONTRACT_ADDRESS', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY');
}

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Required environment variable ${varName} is not set`);
  }
}

export default config;