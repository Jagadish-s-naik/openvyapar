import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import type {
  ProofShare,
  GenerateProofRequest,
  GenerateProofResponse,
  VerifyProofResponse,
  Credential,
  AttributeRedactionManifest,
} from '@openvyapar/shared';
import { db } from '../db/connection.js';
import { verifyCredentialSignature, createRedactedClaim, signCredential } from '../utils/crypto.js';
import { recordAuditLog } from '../utils/audit.js';
import { sendError } from '../utils/errors.js';
import { validateAgentProposal, confirmAgentProposal } from '../utils/guardrails.js';

import { requireRole } from '../middleware/auth.js';

export const proofRouter = Router();

/**
 * POST /proof/generate
 * Generate selective-disclosure proof share (supports whole-credential and granular attribute-level redactions)
 */
proofRouter.post('/generate', requireRole(['owner', 'delegate'], (req) => req.body?.business_id), (req: Request<{}, {}, GenerateProofRequest>, res: Response) => {
  try {
    const {
      business_id,
      purpose,
      disclosed_credential_ids,
      shared_with,
      agent_action_id,
      expires_at,
      max_uses,
      disclosed_attributes,
    } = req.body;
    const generated_by = req.body.generated_by || req.actor?.actorId;

    if (!business_id || !purpose || !disclosed_credential_ids || !shared_with || !generated_by) {
      return sendError(res, 400, 'Missing required fields: business_id, purpose, disclosed_credential_ids, shared_with, generated_by');
    }

    if (max_uses !== undefined && max_uses !== null) {
      if (typeof max_uses !== 'number' || !Number.isInteger(max_uses) || max_uses <= 0) {
        return sendError(res, 400, 'Invalid max_uses: must be a positive integer greater than 0');
      }
    }

    if (expires_at !== undefined && expires_at !== null) {
      const expiresTimestamp = new Date(expires_at).getTime();
      if (isNaN(expiresTimestamp)) {
        return sendError(res, 400, 'Invalid expires_at: must be a valid ISO 8601 date string');
      }
    }

    const business = db.getBusiness(business_id);
    if (!business) {
      return sendError(res, 404, `Business with id ${business_id} not found`);
    }

    // Validate and build attribute redaction manifests if granular attributes specified
    let redactionManifest: Record<string, AttributeRedactionManifest> | undefined = undefined;
    if (disclosed_attributes && typeof disclosed_attributes === 'object') {
      redactionManifest = {};
      for (const [credId, allowedKeys] of Object.entries(disclosed_attributes)) {
        if (!disclosed_credential_ids.includes(credId)) {
          return sendError(res, 400, `Credential ${credId} in disclosed_attributes is not in disclosed_credential_ids`);
        }
        const cred = db.getCredentialById(credId);
        if (!cred) {
          return sendError(res, 404, `Disclosed credential ${credId} not found`);
        }
        if (!Array.isArray(allowedKeys)) {
          return sendError(res, 400, `Allowed keys for credential ${credId} must be an array of attribute names`);
        }
        const claimObj = cred.claim as Record<string, unknown>;
        for (const key of allowedKeys) {
          if (!(key in claimObj)) {
            return sendError(res, 400, `Attribute '${key}' does not exist on credential ${credId}`);
          }
        }
        const { manifest } = createRedactedClaim(claimObj, allowedKeys);
        redactionManifest[credId] = manifest;
      }
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
      expires_at: expires_at || null,
      max_uses: max_uses !== undefined ? max_uses : null,
      use_count: 0,
      disclosed_attributes: disclosed_attributes || undefined,
      redaction_manifest: redactionManifest && Object.keys(redactionManifest).length > 0 ? redactionManifest : undefined,
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
        metadata: {
          proof_id: proofId,
          purpose,
          shared_with,
          disclosed_count: disclosed_credential_ids.length,
          expires_at: newProof.expires_at,
          max_uses: newProof.max_uses,
          granular_redactions_applied: !!newProof.redaction_manifest,
        },
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

  // Atomically increment use count for this verification attempt
  proof.use_count = (proof.use_count || 0) + 1;
  db.setProofShare(proof);

  // Check expiration & max-uses constraints
  const isExpired = !!(proof.expires_at && new Date(proof.expires_at).getTime() < Date.now());
  const isMaxUsesExceeded = !!(proof.max_uses && proof.use_count > proof.max_uses);

  const resolvedCredentials: Credential[] = [];
  const tamperDetails: string[] = [];
  let isAnyTampered = false;

  for (const credId of proof.disclosed_credential_ids) {
    const cred = db.getCredentialById(credId);
    if (cred) {
      const manifest = proof.redaction_manifest?.[credId];
      if (manifest && manifest.redacted_fields.length > 0) {
        // Redacted credential presentation
        const { redactedClaim } = createRedactedClaim(cred.claim as Record<string, unknown>, manifest.disclosed_fields);
        const presentationCred: Credential = {
          ...cred,
          claim: redactedClaim,
          redacted_fields: manifest.redacted_fields,
          attribute_hashes: manifest.attribute_hashes,
        };
        const sigCheck = verifyCredentialSignature(presentationCred, manifest);
        if (!sigCheck.isValid) {
          isAnyTampered = true;
          tamperDetails.push(`Credential ${credId} (${cred.type}): ${sigCheck.reason}`);
        }
        resolvedCredentials.push(presentationCred);
      } else {
        // Full credential presentation
        const sigCheck = verifyCredentialSignature(cred);
        if (!sigCheck.isValid) {
          isAnyTampered = true;
          tamperDetails.push(`Credential ${credId} (${cred.type}): ${sigCheck.reason}`);
        }
        resolvedCredentials.push(cred);
      }
    } else {
      isAnyTampered = true;
      tamperDetails.push(`Disclosed credential ${credId} is missing or has been deleted.`);
    }
  }

  // Determine overall verification status and reason code
  let verificationStatus: import('@openvyapar/shared').VerificationStatus = 'valid';
  let verificationReason = 'VALID';

  if (isExpired) {
    verificationStatus = 'expired';
    verificationReason = 'PROOF_EXPIRED';
    tamperDetails.push(`Proof expired on ${proof.expires_at}`);
  } else if (isMaxUsesExceeded) {
    verificationStatus = 'max_uses_exceeded';
    verificationReason = 'PROOF_MAX_USES_EXCEEDED';
    tamperDetails.push(`Proof maximum use limit of ${proof.max_uses} exceeded (attempt #${proof.use_count})`);
  } else if (isAnyTampered) {
    verificationStatus = 'tampered';
    verificationReason = 'TAMPERED_CREDENTIALS';
  }

  // Persist status change if transitioned
  if (proof.verification_status !== verificationStatus) {
    proof.verification_status = verificationStatus;
    db.setProofShare(proof);
  }

  // Compute baseline trust assessment for Verifier
  const hasGst = resolvedCredentials.some((c) => c.type === 'gst_compliant');
  const hasBank = resolvedCredentials.some((c) => c.type === 'income_bracket');
  const hasMarketplace = resolvedCredentials.some((c) => c.type === 'order_history');

  const anomalyFlags: string[] = [];
  if (isExpired) anomalyFlags.push(`Proof token expired on ${proof.expires_at}`);
  if (isMaxUsesExceeded) anomalyFlags.push(`Proof single/multi-use quota of ${proof.max_uses} exceeded`);
  if (!hasGst) anomalyFlags.push('GST compliance credential not disclosed');
  if (business.status !== 'active') anomalyFlags.push(`Business status is currently '${business.status}'`);

  const isInvalid = verificationStatus !== 'valid';
  const trustScore = isInvalid ? 0 : Math.min(100, (hasGst ? 40 : 0) + (hasBank ? 30 : 0) + (hasMarketplace ? 30 : 20));

  let summary = `Verified authentic DPI selective-disclosure proof for ${proof.purpose}.`;
  if (isExpired) {
    summary = `Proof expired at ${proof.expires_at}. Verifier access rejected.`;
  } else if (isMaxUsesExceeded) {
    summary = `Proof quota limit of ${proof.max_uses} exceeded (attempt #${proof.use_count}). Verifier access rejected.`;
  } else if (isAnyTampered) {
    summary = `Cryptographic verification failed. Evidence of payload alteration or missing credentials.`;
  }

  // Compile redaction summary for Verifier UI
  const redactionSummary: Record<string, { disclosed: string[]; redacted: string[] }> = {};
  if (proof.redaction_manifest) {
    for (const [cId, manifest] of Object.entries(proof.redaction_manifest)) {
      redactionSummary[cId] = {
        disclosed: manifest.disclosed_fields,
        redacted: manifest.redacted_fields,
      };
    }
  }

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
    verification_reason: verificationReason,
    use_count: proof.use_count,
    max_uses: proof.max_uses ?? null,
    expires_at: proof.expires_at ?? null,
    redaction_summary: Object.keys(redactionSummary).length > 0 ? redactionSummary : undefined,
    tamper_details: tamperDetails.length > 0 ? tamperDetails : undefined,
    trust_analysis: {
      anomaly_flags: anomalyFlags,
      summary,
      trust_score: trustScore,
    },
  };

  res.json(responsePayload);
});

/**
 * POST /proof/simulate-tamper/:proof_id
 * Live Demonstration API: Allows corrupting signature bytes or claim values on the fly,
 * or restoring authentic state, to witness real-time verifier alerts and cryptographic rejections.
 */
proofRouter.post('/simulate-tamper/:proof_id', (req: Request<{ proof_id: string }, {}, import('@openvyapar/shared').SimulateTamperRequest>, res: Response) => {
  try {
    const proofId = req.params.proof_id;
    const mode = req.body?.mode || 'corrupt_signature';
    const targetCredentialId = req.body?.target_credential_id;

    const proof = db.getProofShare(proofId);
    if (!proof) {
      return sendError(res, 404, `Proof with id ${proofId} not found`);
    }

    const targetCredIds = targetCredentialId
      ? [targetCredentialId]
      : proof.disclosed_credential_ids;

    const affectedIds: string[] = [];

    for (const credId of targetCredIds) {
      const cred = db.getCredentialById(credId);
      if (!cred) continue;

      if (mode === 'corrupt_signature') {
        // Invert/corrupt the signature bytes
        cred.signature = `tampered_${crypto.randomUUID().slice(0, 8)}_${cred.signature.slice(16)}`;
        db.setCredential(cred);
        affectedIds.push(credId);
      } else if (mode === 'corrupt_claim_payload') {
        // Alter claim data without regenerating signature
        const claimObj = { ...(cred.claim as Record<string, unknown>) };
        if ('turnover_bracket' in claimObj) {
          claimObj.turnover_bracket = 'above_1Cr';
        } else if ('active_compliance_score' in claimObj) {
          claimObj.active_compliance_score = 100;
        } else if ('total_completed_orders' in claimObj) {
          claimObj.total_completed_orders = 99999;
        } else {
          claimObj.unauthorized_tampered_flag = true;
        }
        cred.claim = claimObj as any;
        db.setCredential(cred);
        affectedIds.push(credId);
      } else if (mode === 'restore') {
        // Recompute authentic HMAC signature
        cred.signature = signCredential(
          cred.business_id,
          cred.issuer,
          cred.type,
          cred.claim,
          cred.issued_at
        );
        db.setCredential(cred);
        affectedIds.push(credId);
      }
    }

    // Update proof status if restored
    if (mode === 'restore') {
      proof.verification_status = 'valid';
      db.setProofShare(proof);
    }

    recordAuditLog(
      proof.business_id,
      'admin',
      req.actor?.actorId || 'system_tamper_simulator',
      'simulate_tamper',
      true,
      {
        req,
        metadata: {
          proof_id: proofId,
          mode,
          affected_credential_ids: affectedIds,
        },
      }
    );

    const responsePayload: import('@openvyapar/shared').SimulateTamperResponse = {
      success: true,
      proof_id: proofId,
      mode,
      affected_credential_ids: affectedIds,
      details: mode === 'restore'
        ? `Successfully restored authentic cryptographic signatures for credentials: ${affectedIds.join(', ')}`
        : `Successfully simulated ${mode} on credentials: ${affectedIds.join(', ')}. Verifier inspection will now fail.`,
      restored: mode === 'restore',
    };

    res.json(responsePayload);
  } catch (err: any) {
    sendError(res, 500, err.message || 'Internal server error');
  }
});
