import { Router, type Request, type Response } from 'express';
import type { ConsentExplainRequest } from '@openvyapar/shared';
import { explainConsent } from '../engine/consent.js';

export const consentRouter = Router();

/**
 * POST /agent/consent-explain
 * Explains selective-disclosure implications in plain language
 *
 * GUARDRAIL: Informational / proposal only.
 */
consentRouter.post('/consent-explain', (req: Request<{}, {}, ConsentExplainRequest>, res: Response) => {
  try {
    const result = explainConsent(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Consent explanation failed' });
  }
});
