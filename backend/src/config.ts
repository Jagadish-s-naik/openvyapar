import dotenv from 'dotenv';

dotenv.config();

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
];

const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') !== 'production',
  allowedOrigins: Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins])),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/openvyapar',
    dbName: process.env.MONGODB_DB_NAME || 'openvyapar',
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 10,
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 5000,
    connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS) || 10000,
    autoIndex: (process.env.NODE_ENV || 'development') !== 'production',
    isEnabled: process.env.ENABLE_MONGODB === 'true' || !!process.env.MONGODB_URI,
  },
};

