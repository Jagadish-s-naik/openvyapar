import { Router, type Request, type Response } from 'express';
import type { VerifierFlagRequest } from '@openvyapar/shared';
import { analyzeVerifierTrust } from '../engine/verifier.js';
import { sendAgentError } from '../lib/errors.js';

export const verifierRouter = Router();

/**
 * POST /agent/verifier-flag
 * Analyzes credentials and flags anomalies for verifier/underwriting
 *
 * GUARDRAIL: Read-only advisory analysis.
 */
verifierRouter.post('/verifier-flag', async (req: Request<{}, {}, VerifierFlagRequest>, res: Response) => {
  try {
    const result = await analyzeVerifierTrust(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    sendAgentError(res, 500, 'VERIFIER_FLAG_FAILED', err.message || 'Verifier flag analysis failed', err);
  }
});
