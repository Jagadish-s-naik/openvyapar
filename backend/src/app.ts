import express, { type Application } from 'express';
import cors from 'cors';
import { businessRouter } from './routes/business.js';
import { credentialsRouter } from './routes/credentials.js';
import { delegationRouter } from './routes/delegation.js';
import { proofRouter } from './routes/proof.js';
import { auditRouter } from './routes/audit.js';
import { mocksRouter } from './routes/mocks.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { healthRouter } from './routes/health.js';
import { agentRouter } from './routes/agent/index.js';
import { authContextMiddleware } from './middleware/auth.js';
import { corsMiddleware, securityHeadersMiddleware } from './middleware/cors.js';

export function createApp(): Application {
  const app = express();

  // Global Middleware
  app.use(corsMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(express.json());
  app.use(authContextMiddleware);

  // Health and Readiness Probes
  app.use('/health', healthRouter);

  // API Routes matching PRD §8
  app.use('/auth', authRouter);
  app.use('/admin', adminRouter);
  app.use('/business', businessRouter);
  app.use('/credentials', credentialsRouter);
  app.use('/delegation', delegationRouter);
  app.use('/proof', proofRouter);
  app.use('/audit', auditRouter);
  app.use('/mocks', mocksRouter);
  app.use('/agent', agentRouter);

  return app;
}
