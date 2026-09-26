import { Router, type Request, type Response } from 'express';
import { db } from '../db/connection.js';
import { config } from '../config.js';

export const healthRouter = Router();

/**
 * GET /health
 * Comprehensive service diagnostic and telemetry probe
 */
healthRouter.get('/', (_req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const dbStats = db.getStats();
  const snapshotCount = db.listSnapshots().length;

  res.json({
    status: 'healthy',
    service: 'openvyapar-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: Number(process.uptime().toFixed(2)),
    memory: {
      heap_used_mb: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
      heap_total_mb: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
      rss_mb: (memUsage.rss / 1024 / 1024).toFixed(2),
    },
    database: {
      status: 'connected',
      record_counts: dbStats,
      snapshots_count: snapshotCount,
    },
    subsystems: {
      gst_mock: {
        status: 'active',
        issuer_id: 'gst_mock',
        algorithm: 'HMAC-SHA256',
        supported_types: ['gst_compliant'],
      },
      bank_mock: {
        status: 'active',
        issuer_id: 'bank_mock',
        algorithm: 'HMAC-SHA256',
        supported_types: ['bank_statement_summary'],
      },
      marketplace_mock: {
        status: 'active',
        issuer_id: 'marketplace_mock',
        algorithm: 'HMAC-SHA256',
        supported_types: ['marketplace_reputation'],
      },
      csc_witness: {
        status: 'active',
        issuer_id: 'agent_witnessed',
        algorithm: 'HMAC-SHA256',
        supported_types: ['self_attested'],
      },
    },
    environment: {
      node_version: process.version,
      env: config.nodeEnv,
      port: config.port,
      allowed_origins_count: config.allowedOrigins.length,
    },
  });
});

/**
 * GET /health/ready
 * Fast readiness probe for load balancers & process orchestrators
 */
healthRouter.get('/ready', (_req: Request, res: Response) => {
  res.json({
    ready: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/live
 * Liveness probe
 */
healthRouter.get('/live', (_req: Request, res: Response) => {
  res.json({
    live: true,
    status: 'ok',
  });
});
