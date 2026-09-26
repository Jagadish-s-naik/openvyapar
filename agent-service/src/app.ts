import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { onboardingRouter } from './routes/onboarding.js';
import { consentRouter } from './routes/consent.js';
import { scopingRouter } from './routes/scoping.js';
import { verifierRouter } from './routes/verifier.js';
import { assistantRouter } from './routes/assistant.js';
import { sendAgentError } from './lib/errors.js';

export function createAgentApp(): Application {
  const app = express();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'openvyapar-agent-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Agent endpoints matching PRD §8
  app.use('/agent', onboardingRouter);
  app.use('/agent', consentRouter);
  app.use('/agent', scopingRouter);
  app.use('/agent', verifierRouter);
  app.use('/agent', assistantRouter);

  // Global standardized error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const code = err.code || (status === 400 ? 'INVALID_JSON_BODY' : 'INTERNAL_SERVER_ERROR');
    sendAgentError(res, status, code, err.message || 'An unexpected error occurred', err.details || null);
  });

  return app;
}
