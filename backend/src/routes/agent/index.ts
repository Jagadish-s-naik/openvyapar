import { Router } from 'express';
import { onboardingRouter } from './onboarding.js';
import { consentRouter } from './consent.js';
import { scopingRouter } from './scoping.js';
import { verifierRouter } from './verifier.js';
import { assistantRouter } from './assistant.js';

export const agentRouter = Router();

agentRouter.use(onboardingRouter);
agentRouter.use(consentRouter);
agentRouter.use(scopingRouter);
agentRouter.use(verifierRouter);
agentRouter.use(assistantRouter);
