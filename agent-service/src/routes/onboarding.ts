import { Router, type Request, type Response } from 'express';
import type { OnboardExtractRequest } from '@openvyapar/shared';
import { extractOnboardingData } from '../engine/onboarding.js';
import { recordProposalToBackend } from '../utils/recordProposal.js';

export const onboardingRouter = Router();

/**
 * POST /agent/onboard-extract
 * Extract structured business metadata and starter self-attested credential
 * from free-text / voice transcript.
 *
 * GUARDRAIL: Does NOT write to business table. Proposes only.
 */
onboardingRouter.post('/onboard-extract', async (req: Request<{}, {}, OnboardExtractRequest>, res: Response) => {
  try {
    const result = extractOnboardingData(req.body);
    await recordProposalToBackend(
      result.agent_action_id,
      'pending_onboarding',
      'onboarding',
      `Zero-footprint onboarding extraction for ${result.proposed_business.name}`,
      result.proposed_business
    );
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Onboarding extraction failed' });
  }
});
