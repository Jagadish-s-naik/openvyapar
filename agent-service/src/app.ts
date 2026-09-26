import express, { type Application } from 'express';
import cors from 'cors';
import { onboardingRouter } from './routes/onboarding.js';
import { consentRouter } from './routes/consent.js';
import { scopingRouter } from './routes/scoping.js';
import { verifierRouter } from './routes/verifier.js';

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

  return app;
}
