import cors, { type CorsOptions } from 'cors';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  for (const pattern of allowedOrigins) {
    if (pattern === '*' || pattern === origin) {
      return true;
    }
    if (pattern.includes('*')) {
      const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      const regex = new RegExp(`^${escaped}$`, 'i');
      if (regex.test(origin)) {
        return true;
      }
    }
  }
  return false;
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, server-to-server, tests)
    if (!origin) {
      return callback(null, true);
    }

    // Check against configured allowed origins (supports exact matches and wildcards like *.vercel.app)
    if (isOriginAllowed(origin, config.allowedOrigins)) {
      return callback(null, true);
    }

    // Allow Vercel preview and production domains by default (e.g. https://*.vercel.app)
    if (/^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    // Check if origin is any localhost / 127.0.0.1 port
    if (localhostRegex.test(origin)) {
      return callback(null, true);
    }

    // In development mode, allow all origins
    if (config.isDev) {
      return callback(null, true);
    }

    callback(new Error(`Origin '${origin}' not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'x-openvyapar-actor-id',
    'x-openvyapar-actor-role',
    'x-request-id',
  ],
  exposedHeaders: [
    'x-openvyapar-actor-id',
    'x-openvyapar-actor-role',
    'x-request-id',
    'x-response-time',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);

/**
 * Security and Tracing Headers Middleware
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime();

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  const requestId = (req.headers['x-request-id'] as string) || `req-${Date.now().toString(36)}`;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    // Note: header is written before stream ends, finish event tracks metrics if needed
  });

  next();
}
