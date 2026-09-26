import { Router, type Request, type Response } from 'express';
import type { ConsentExplainRequest } from '@openvyapar/shared';
import { explainConsent } from '../../agents/engine/consent.js';
import { sendAgentError } from '../../agents/lib/errors.js';
import { recordProposalToBackend } from '../../agents/utils/recordProposal.js';

export const consentRouter = Router();

consentRouter.post('/consent-explain', async (req: Request<{}, {}, ConsentExplainRequest>, res: Response) => {
  try {
    const result = await explainConsent(req.body);
    await recordProposalToBackend(
      result.agent_action_id,
      req.body.business_id,
      'consent_explainer',
      `Consent explanation for ${req.body.purpose} shared with ${req.body.recipient_name}`,
      { purpose: req.body.purpose, recipient_name: req.body.recipient_name, selected_credentials: req.body.selected_credential_ids }
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    sendAgentError(res, 500, 'CONSENT_EXPLAIN_FAILED', (err as Error).message || 'Consent explanation failed', err);
  }
});
