import { Router, type Request, type Response } from 'express';
import type { ScopeSuggestRequest } from '@openvyapar/shared';
import { suggestDelegationScope } from '../engine/scoping.js';
import { recordProposalToBackend } from '../utils/recordProposal.js';

export const scopingRouter = Router();

/**
 * POST /agent/scope-suggest
 * Proposes least-privilege delegation scopes from natural language request
 *
 * GUARDRAIL: Proposes only. Requires human confirmation before /delegation/grant.
 */
scopingRouter.post('/scope-suggest', async (req: Request<{}, {}, ScopeSuggestRequest>, res: Response) => {
  try {
    const result = suggestDelegationScope(req.body);
    await recordProposalToBackend(
      result.agent_action_id,
      req.body.business_id,
      'delegation_scoping',
      `Least-privilege scoping suggestion for prompt: "${req.body.natural_language_prompt}"`,
      { proposed_scopes: result.proposed_scopes, explanation: result.explanation }
    );
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Scope suggestion failed' });
  }
});
