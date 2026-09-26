import { Router, type Request, type Response } from 'express';
import type { ScopeSuggestRequest } from '@openvyapar/shared';
import { suggestDelegationScope } from '../engine/scoping.js';
import { sendAgentError } from '../lib/errors.js';

export const scopingRouter = Router();

/**
 * POST /agent/scope-suggest
 * Proposes least-privilege delegation scopes from natural language request
 *
 * GUARDRAIL: Proposes only. Requires human confirmation before /delegation/grant.
 */
scopingRouter.post('/scope-suggest', async (req: Request<{}, {}, ScopeSuggestRequest>, res: Response) => {
  try {
    const result = await suggestDelegationScope(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    sendAgentError(res, 500, 'SCOPE_SUGGEST_FAILED', err.message || 'Scope suggestion failed', err);
  }
});
