import { Router, type Request, type Response } from 'express';
import type { ScopeSuggestRequest } from '@openvyapar/shared';
import { suggestDelegationScope } from '../engine/scoping.js';

export const scopingRouter = Router();

/**
 * POST /agent/scope-suggest
 * Proposes least-privilege delegation scopes from natural language request
 *
 * GUARDRAIL: Proposes only. Requires human confirmation before /delegation/grant.
 */
scopingRouter.post('/scope-suggest', (req: Request<{}, {}, ScopeSuggestRequest>, res: Response) => {
  try {
    const result = suggestDelegationScope(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Scope suggestion failed' });
  }
});
