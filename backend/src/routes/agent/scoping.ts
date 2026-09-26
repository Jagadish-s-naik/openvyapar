import { Router, type Request, type Response } from 'express';
import type { ScopeSuggestRequest } from '@openvyapar/shared';
import { suggestDelegationScope } from '../../agents/engine/scoping.js';
import { sendAgentError } from '../../agents/lib/errors.js';
import { recordProposalToBackend } from '../../agents/utils/recordProposal.js';

export const scopingRouter = Router();

scopingRouter.post('/scope-suggest', async (req: Request<{}, {}, ScopeSuggestRequest>, res: Response) => {
  try {
    const result = await suggestDelegationScope(req.body);
    await recordProposalToBackend(
      result.agent_action_id,
      req.body.business_id,
      'delegation_scoping',
      `Least-privilege scoping suggestion for prompt: "${req.body.natural_language_prompt}"`,
      { proposed_scopes: result.proposed_scopes, plain_summary: result.plain_summary }
    );
    res.status(200).json(result);
  } catch (err: any) {
    sendAgentError(res, 500, 'SCOPE_SUGGEST_FAILED', err.message || 'Scope suggestion failed', err);
  }
});
