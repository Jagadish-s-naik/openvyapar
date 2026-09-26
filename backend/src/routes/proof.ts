import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import type {
  ProofShare,
  GenerateProofRequest,
  GenerateProofResponse,
  VerifyProofResponse,
  Credential,
} from '@openvyapar/shared';
import { db } from '../db/connection.js';
import { verifyCredentialSignature } from '../utils/crypto.js';
import { recordAuditLog } from '../utils/audit.js';
import { sendError } from '../utils/errors.js';
import { validateAgentProposal, confirmAgentProposal } from '../utils/guardrails.js';

import { requireRole } from '../middleware/auth.js';

export const proofRouter = Router();

/**
 * POST /proof/generate
 * Generate selective-disclosure proof share
 */
proofRouter.post('/generate', requireRole(['owner', 'delegate'], (req) => req.body?.business_id), (req: Request<{}, {}, GenerateProofRequest>, res: Response) => {
  try {
    const { business_id, purpose, disclosed_credential_ids, shared_with, agent_action_id } = req.body;
    const generated_by = req.body.generated_by || req.actor?.actorId;

    if (!business_id || !purpose || !disclosed_credential_ids || !shared_with || !generated_by) {
      return sendError(res, 400, 'Missing required fields: business_id, purpose, disclosed_credential_ids, shared_with, generated_by');
    }

    const business = db.getBusiness(business_id);
    if (!business) {
      return sendError(res, 404, `Business with id ${business_id} not found`);
    }

    // Validate agent proposal guardrail & idempotency if agent_action_id is supplied
    const proposalCheck = validateAgentProposal(agent_action_id);
    if (!proposalCheck.valid) {
      return sendError(res, proposalCheck.statusCode || 400, proposalCheck.errorMessage || 'Invalid agent proposal');
    }

    const proofId = `proof-${purpose.slice(0, 4)}-${crypto.randomUUID().slice(0, 8)}`;
    const generatedAt = new Date().toISOString();
    const verificationUrl = `https://openvyapar.in/verify/${proofId}`;

    const newProof: ProofShare = {
      proof_id: proofId,
      business_id,
      purpose,
      disclosed_credential_ids,
      shared_with,
      generated_at: generatedAt,
      link_or_qr: verificationUrl,
      verification_status: 'valid',
    };

    db.setProofShare(newProof);

    if (proposalCheck.proposal) {
      confirmAgentProposal(proposalCheck.proposal, proofId, generatedAt);
    }

    recordAuditLog(
      business_id,
      'owner',
      generated_by,
      'generate_proof',
      true,
      {
        req,
        diff: {
          disclosed_credentials: { before: [], after: disclosed_credential_ids },
        },
        metadata: { proof_id: proofId, purpose, shared_with, disclosed_count: disclosed_credential_ids.length },
      }
    );

    const responsePayload: GenerateProofResponse = {
      success: true,
      proof: newProof,
      verification_url: verificationUrl,
    };

    res.status(201).json(responsePayload);
  } catch (err: any) {
    sendError(res, 500, err.message || 'Internal server error');
  }
});

/**
 * GET /proof/verify/:proof_id
 * Verifier Portal: Inspects selective-disclosure credentials and computes cryptographic verification
 */
proofRouter.get('/verify/:proof_id', (req: Request<{ proof_id: string }>, res: Response) => {
  const proofId = req.params.proof_id;
  const proof = db.getProofShare(proofId);

  if (!proof) {
    return sendError(res, 404, `Proof with id ${proofId} not found`);
  }

  const business = db.getBusiness(proof.business_id);
  if (!business) {
    return sendError(res, 404, `Associated business ${proof.business_id} not found`);
  }

  const resolvedCredentials: Credential[] = [];
  const tamperDetails: string[] = [];
  let isAnyTampered = false;

  for (const credId of proof.disclosed_credential_ids) {
    const cred = db.getCredentialById(credId);
    if (cred) {
      const sigCheck = verifyCredentialSignature(cred);
      if (!sigCheck.isValid) {
        isAnyTampered = true;
        tamperDetails.push(`Credential ${credId} (${cred.type}): ${sigCheck.reason}`);
      }
      resolvedCredentials.push(cred);
    } else {
      isAnyTampered = true;
      tamperDetails.push(`Disclosed credential ${credId} is missing or has been deleted.`);
    }
  }

  const verificationStatus = isAnyTampered ? 'tampered' : 'valid';

  // Compute baseline trust assessment for Verifier
  const hasGst = resolvedCredentials.some((c) => c.type === 'gst_compliant');
  const hasBank = resolvedCredentials.some((c) => c.type === 'income_bracket');
  const hasMarketplace = resolvedCredentials.some((c) => c.type === 'order_history');

  const anomalyFlags: string[] = [];
  if (!hasGst) anomalyFlags.push('GST compliance credential not disclosed');
  if (business.status !== 'active') anomalyFlags.push(`Business status is currently '${business.status}'`);

  const trustScore = verificationStatus === 'tampered' ? 0 : Math.min(100, (hasGst ? 40 : 0) + (hasBank ? 30 : 0) + (hasMarketplace ? 30 : 20));

  const responsePayload: VerifyProofResponse = {
    success: true,
    proof: {
      ...proof,
      disclosed_credentials: resolvedCredentials,
      verification_status: verificationStatus,
    },
    business,
    credentials: resolvedCredentials,
    verification_status: verificationStatus,
    tamper_details: tamperDetails.length > 0 ? tamperDetails : undefined,
    trust_analysis: {
      anomaly_flags: anomalyFlags,
      summary: verificationStatus === 'valid'
        ? `Verified authentic DPI selective-disclosure proof for ${proof.purpose}.`
        : `Cryptographic verification failed. Evidence of payload alteration or missing credentials.`,
      trust_score: trustScore,
    },
  };

  res.json(responsePayload);
});
