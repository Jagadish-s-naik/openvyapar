import mongoose from 'mongoose';
import { config } from '../config.js';

export interface MongoConnectionStatus {
  connected: boolean;
  readyState: number; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  stateDescription: string;
  host?: string;
  port?: number;
  dbName?: string;
  error?: string;
}

const stateMap: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

let isEventListenersRegistered = false;

function registerConnectionEvents(): void {
  if (isEventListenersRegistered) return;
  isEventListenersRegistered = true;

  mongoose.connection.on('connected', () => {
    console.log(`🍃 [MongoDB] Connected successfully to database: ${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ [MongoDB] Connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ [MongoDB] Disconnected from database.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 [MongoDB] Reconnected to database.');
  });
}

/**
 * Connect to MongoDB using application config.
 */
export async function connectMongo(customUri?: string): Promise<typeof mongoose> {
  const uri = customUri || config.mongodb.uri;
  registerConnectionEvents();

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    return await mongoose.connect(uri, {
      dbName: config.mongodb.dbName,
      maxPoolSize: config.mongodb.maxPoolSize,
      serverSelectionTimeoutMS: config.mongodb.serverSelectionTimeoutMS,
      connectTimeoutMS: config.mongodb.connectTimeoutMS,
      autoIndex: config.mongodb.autoIndex,
    });
  } catch (error) {
    console.error(`❌ [MongoDB] Failed to connect to ${uri}:`, error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB cleanly.
 */
export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

/**
 * Get current MongoDB connection status.
 */
export function getMongoStatus(): MongoConnectionStatus {
  const readyState = mongoose.connection.readyState;
  const host = mongoose.connection.host;
  const port = mongoose.connection.port;
  const dbName = mongoose.connection.name;

  return {
    connected: readyState === 1,
    readyState,
    stateDescription: stateMap[readyState] || 'unknown',
    host: host || undefined,
    port: port || undefined,
    dbName: dbName || undefined,
  };
}

/**
 * Optional ping check to test active round-trip responsiveness.
 */
export async function pingMongo(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return { ok: false, error: 'Not connected to MongoDB' };
  }

  const start = Date.now();
  try {
    const adminDb = mongoose.connection.db.admin();
    await adminDb.ping();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
