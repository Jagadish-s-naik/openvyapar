import { Router, type Request, type Response } from 'express';
import type { ConsentExplainRequest } from '@openvyapar/shared';
import { explainConsent } from '../engine/consent.js';
import { sendAgentError } from '../lib/errors.js';

export const consentRouter = Router();

/**
 * POST /agent/consent-explain
 * Explains selective-disclosure implications in plain language
 *
 * GUARDRAIL: Informational / proposal only.
 */
consentRouter.post('/consent-explain', async (req: Request<{}, {}, ConsentExplainRequest>, res: Response) => {
  try {
    const result = await explainConsent(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    sendAgentError(res, 500, 'CONSENT_EXPLAIN_FAILED', err.message || 'Consent explanation failed', err);
  }
});
