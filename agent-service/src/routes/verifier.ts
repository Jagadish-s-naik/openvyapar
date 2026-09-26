import { Router, type Request, type Response } from 'express';
import type { VerifierFlagRequest } from '@openvyapar/shared';
import { analyzeVerifierTrust } from '../engine/verifier.js';
import { recordProposalToBackend } from '../utils/recordProposal.js';

export const verifierRouter = Router();

/**
 * POST /agent/verifier-flag
 * Analyzes credentials and flags anomalies for verifier/underwriting
 *
 * GUARDRAIL: Read-only advisory analysis.
 */
verifierRouter.post('/verifier-flag', async (req: Request<{}, {}, VerifierFlagRequest>, res: Response) => {
  try {
    const result = analyzeVerifierTrust(req.body);
    await recordProposalToBackend(
      result.agent_action_id,
      req.body.business_id,
      'verifier_trust',
      `Verifier trust & anomaly analysis (Verdict: ${result.overall_verdict})`,
      { verdict: result.overall_verdict, flags: result.flags }
    );
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Verifier flag analysis failed' });
  }
});
