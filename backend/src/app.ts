import express, { type Application } from 'express';
import cors from 'cors';
import { businessRouter } from './routes/business.js';
import { credentialsRouter } from './routes/credentials.js';
import { delegationRouter } from './routes/delegation.js';
import { proofRouter } from './routes/proof.js';
import { auditRouter } from './routes/audit.js';
import { mocksRouter } from './routes/mocks.js';
import { authRouter } from './routes/auth.js';
import { authContextMiddleware } from './middleware/auth.js';

export function createApp(): Application {
  const app = express();

  // Global Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-openvyapar-actor-id', 'x-openvyapar-actor-role'],
  }));
  app.use(express.json());
  app.use(authContextMiddleware);

  // Health Check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'openvyapar-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API Routes matching PRD §8
  app.use('/auth', authRouter);
  app.use('/business', businessRouter);
  app.use('/credentials', credentialsRouter);
  app.use('/delegation', delegationRouter);
  app.use('/proof', proofRouter);
  app.use('/audit', auditRouter);
  app.use('/mocks', mocksRouter);

  return app;
}
