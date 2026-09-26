import { Router, type Request, type Response } from 'express';
import type { VerifierFlagRequest } from '@openvyapar/shared';
import { analyzeVerifierTrust } from '../engine/verifier.js';

export const verifierRouter = Router();

/**
 * POST /agent/verifier-flag
 * Analyzes credentials and flags anomalies for verifier/underwriting
 *
 * GUARDRAIL: Read-only advisory analysis.
 */
verifierRouter.post('/verifier-flag', (req: Request<{}, {}, VerifierFlagRequest>, res: Response) => {
  try {
    const result = analyzeVerifierTrust(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Verifier flag analysis failed' });
  }
});
