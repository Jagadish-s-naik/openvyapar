import { Router, type Request, type Response } from 'express';
import type { ConsentExplainRequest } from '@openvyapar/shared';
import { explainConsent } from '../engine/consent.js';
import { recordProposalToBackend } from '../utils/recordProposal.js';

export const consentRouter = Router();

/**
 * POST /agent/consent-explain
 * Explains selective-disclosure implications in plain language
 *
 * GUARDRAIL: Informational / proposal only.
 */
consentRouter.post('/consent-explain', async (req: Request<{}, {}, ConsentExplainRequest>, res: Response) => {
  try {
    const result = explainConsent(req.body);
    await recordProposalToBackend(
      result.agent_action_id,
      req.body.business_id,
      'consent_explainer',
      `Consent explanation for ${req.body.purpose} shared with ${req.body.recipient_name}`,
      { purpose: req.body.purpose, recipient_name: req.body.recipient_name, selected_credentials: req.body.selected_credential_ids }
    );
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Consent explanation failed' });
  }
});
