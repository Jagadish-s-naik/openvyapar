import { Router, type Request, type Response } from 'express';
import type { VerifierFlagRequest } from '@openvyapar/shared';
import { analyzeVerifierTrust } from '../engine/verifier.js';
import { sendAgentError } from '../lib/errors.js';
import { recordProposalToBackend } from '../utils/recordProposal.js';

export const verifierRouter = Router();

verifierRouter.post('/verifier-flag', async (req: Request<{}, {}, VerifierFlagRequest>, res: Response) => {
  try {
    const result = await analyzeVerifierTrust(req.body);
    await recordProposalToBackend(
      result.agent_action_id,
      req.body.business_id,
      'verifier_trust',
      `Verifier trust & anomaly analysis (Verdict: ${result.overall_verdict})`,
      { verdict: result.overall_verdict, flags: result.flags }
    );
    res.status(200).json(result);
  } catch (err: any) {
    sendAgentError(res, 500, 'VERIFIER_FLAG_FAILED', err.message || 'Verifier flag analysis failed', err);
  }
});
