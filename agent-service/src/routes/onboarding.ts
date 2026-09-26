import { Router, type Request, type Response } from 'express';
import type { OnboardExtractRequest } from '@openvyapar/shared';
import { extractOnboardingData } from '../engine/onboarding.js';
import { sendAgentError } from '../lib/errors.js';
import { recordProposalToBackend } from '../utils/recordProposal.js';

export const onboardingRouter = Router();

onboardingRouter.post('/onboard-extract', async (req: Request<{}, {}, OnboardExtractRequest>, res: Response) => {
  try {
    const result = await extractOnboardingData(req.body);
    await recordProposalToBackend(
      result.agent_action_id,
      'pending_onboarding',
      'onboarding',
      `Zero-footprint onboarding extraction for ${result.proposed_business.name}`,
      result.proposed_business
    );
    res.status(200).json(result);
  } catch (err: any) {
    sendAgentError(res, 500, 'ONBOARD_EXTRACT_FAILED', err.message || 'Onboarding extraction failed', err);
  }
});
