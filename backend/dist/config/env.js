"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    // Application
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '8001'),
    API_PREFIX: process.env.API_PREFIX || '/api',
    // Supabase
    supabase: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    },
    // Blockchain
    blockchain: {
        rpcUrl: process.env.RPC_URL || '',
        contractAddress: process.env.CONTRACT_ADDRESS || '',
        privateKey: process.env.PRIVATE_KEY || ''
    },
    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'blockchain-supply-chain-secret-key-2024',
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
const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'];
if (exports.config.NODE_ENV === 'production') {
    requiredVars.push('SUPABASE_SERVICE_ROLE_KEY', 'RPC_URL', 'CONTRACT_ADDRESS');
}
for (const varName of requiredVars) {
    if (!process.env[varName]) {
        throw new Error(`Required environment variable ${varName} is not set`);
    }
}
exports.default = exports.config;
//# sourceMappingURL=env.js.map