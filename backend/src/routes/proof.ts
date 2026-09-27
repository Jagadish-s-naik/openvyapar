import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import type {
  ProofShare,
  GenerateProofRequest,
  GenerateProofResponse,
  VerifyProofResponse,
  Credential,
  CredentialClaim,
  AttributeRedactionManifest,
} from '@openvyapar/shared';
import { db } from '../db/connection.js';
import { verifyCredentialSignature, createRedactedClaim, signCredential } from '../utils/crypto.js';
import { recordAuditLog } from '../utils/audit.js';
import { sendError } from '../utils/errors.js';
import { validateAgentProposal, confirmAgentProposal } from '../utils/guardrails.js';
import { requireRole } from '../middleware/auth.js';

export interface DeskSession {
  session_code: string;
  bank_name: string;
  officer_name: string;
  officer_did: string;
  created_at: string;
  expires_at: string;
  proof_id?: string;
  last_dispatched_at?: string;
}

const deskSessions = new Map<string, DeskSession>([
  ['SBI-DESK-7492', {
    session_code: 'SBI-DESK-7492',
    bank_name: 'State Bank of India — MSME Sahay',
    officer_name: 'Priya Sharma (Chief Underwriting Manager)',
    officer_did: 'did:person:sbi-officer-01',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    proof_id: 'proof-loan-001',
  }],
  ['ONDC-NODE-104', {
    session_code: 'ONDC-NODE-104',
    bank_name: 'ONDC Merchant Onboarding Node (Mystore)',
    officer_name: 'Verification Protocol Gateway',
    officer_did: 'did:node:ondc-gateway-01',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    proof_id: 'proof-loan-001',
  }]
]);

export const proofRouter = Router();

/**
 * GET /proof/session/active
 * Returns list of active verifier/bank desk sessions
 */
proofRouter.get('/session/active', (_req: Request, res: Response) => {
  const sessions = Array.from(deskSessions.values());
  res.json({ success: true, sessions });
});

/**
 * POST /proof/session/create
 * Creates a dynamic 6-digit / desk session for a bank officer
 */
proofRouter.post('/session/create', (req: Request<{}, {}, { bank_name?: string; officer_name?: string }>, res: Response) => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const sessionCode = `SBI-DESK-${randomSuffix}`;
  const session: DeskSession = {
    session_code: sessionCode,
    bank_name: req.body.bank_name || 'State Bank of India — MSME Sahay',
    officer_name: req.body.officer_name || 'Priya Sharma (Underwriter)',
    officer_did: `did:person:sbi-${randomSuffix}`,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
  deskSessions.set(sessionCode, session);
  res.status(201).json({ success: true, session });
});

/**
 * POST /proof/session/dispatch
 * Wallet transmits an encrypted proof bundle directly to a bank desk session
 */
proofRouter.post('/session/dispatch', async (req: Request<{}, {}, { session_code: string; proof_id: string; business_id?: string }>, res: Response) => {
  const { session_code, proof_id } = req.body;
  const session = deskSessions.get(session_code);
  if (!session) {
    return sendError(res, 404, `Bank Desk Session ${session_code} not found or expired.`);
  }

  const proof = await db.getProofShare(proof_id);
  if (!proof) {
    return sendError(res, 404, `Proof with ID ${proof_id} not found.`);
  }

  session.proof_id = proof_id;
  session.last_dispatched_at = new Date().toISOString();
  deskSessions.set(session_code, session);

  // Record audit log
  if (proof.business_id) {
    await recordAuditLog(
      proof.business_id,
      'owner',
      req.actor?.actorId || 'did:person:owner',
      'dispatch_proof_to_desk',
      true,
      {
        req,
        metadata: {
          session_code,
          proof_id,
          recipient_bank: session.bank_name,
          officer_did: session.officer_did,
        },
      }
    );
  }

  res.json({
    success: true,
    message: `Cryptographic proof ${proof_id} securely bound and transmitted to ${session.bank_name} (${session.session_code})`,
    session,
  });
});

/**
 * GET /proof/session/:code
 * Returns current status and assigned proof for a desk session
 */
proofRouter.get('/session/:code', (req: Request<{ code: string }>, res: Response) => {
  const code = req.params.code;
  const session = deskSessions.get(code);
  if (!session) {
    return sendError(res, 404, `Session ${code} not found.`);
  }
  res.json({ success: true, session });
});

/**
 * POST /proof/generate
 * Generate selective-disclosure proof share (supports whole-credential and granular attribute-level redactions)
 */
proofRouter.post('/generate', requireRole(['owner', 'delegate'], (req) => req.body?.business_id), async (req: Request<{}, {}, GenerateProofRequest>, res: Response) => {
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

    const business = await db.getBusiness(business_id);
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
        const cred = await db.getCredentialById(credId);
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
    const proposalCheck = await validateAgentProposal(agent_action_id);
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

    await db.setProofShare(newProof);

    if (proposalCheck.proposal) {
      await confirmAgentProposal(proposalCheck.proposal, proofId, generatedAt);
    }

    await recordAuditLog(
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
  } catch (err: unknown) {
    sendError(res, 500, (err as Error).message || 'Internal server error');
  }
});

/**
 * GET /proof/:proof_id
 * Retrieves raw proof details with disclosed credentials
 */
proofRouter.get('/:proof_id', async (req: Request<{ proof_id: string }>, res: Response) => {
  const inputId = req.params.proof_id;
  const session = deskSessions.get(inputId);
  const proofId = session?.proof_id || inputId;
  const proof = await db.getProofShare(proofId);

  if (!proof) {
    return sendError(res, 404, `Proof with id ${inputId} not found`);
  }

  const resolvedCredentials = (
    await Promise.all(proof.disclosed_credential_ids.map((cId: string) => db.getCredentialById(cId)))
  ).filter(Boolean) as Credential[];

  res.json({
    success: true,
    proof: {
      ...proof,
      disclosed_credentials: resolvedCredentials,
    },
  });
});

/**
 * POST /proof/verify
 * Verifier Portal: Inspects and cryptographically verifies proof
 */
proofRouter.post('/verify', async (req: Request<{}, {}, { proof_id: string; verifier_id?: string; simulate_tamper?: boolean }>, res: Response) => {
  const { proof_id, verifier_id, simulate_tamper } = req.body;
  const inputId = proof_id;
  if (!inputId) {
    return sendError(res, 400, 'Missing required field: proof_id');
  }

  const session = deskSessions.get(inputId);
  const targetProofId = session?.proof_id || inputId;
  const proof = await db.getProofShare(targetProofId);

  if (!proof) {
    if (session) {
      return sendError(res, 404, `Desk Session ${inputId} is active, but no proof has been transmitted yet. Please dispatch from Owner Wallet.`);
    }
    return sendError(res, 404, `Proof with id ${inputId} not found`);
  }

  const business = await db.getBusiness(proof.business_id);
  if (!business) {
    return sendError(res, 404, `Associated business ${proof.business_id} not found`);
  }

  // Atomically increment use count
  proof.use_count = (proof.use_count || 0) + 1;
  await db.setProofShare(proof);

  const isExpired = !!(proof.expires_at && new Date(proof.expires_at).getTime() < Date.now());
  const isMaxUsesExceeded = !!(proof.max_uses && proof.use_count > proof.max_uses);

  const resolvedCredentials: Credential[] = [];
  const tamperDetails: string[] = [];
  let isAnyTampered = !!simulate_tamper;

  if (simulate_tamper) {
    tamperDetails.push('Simulated cryptographic HMAC signature alteration');
  }

  for (const credId of proof.disclosed_credential_ids) {
    const cred = await db.getCredentialById(credId);
    if (cred) {
      const manifest = proof.redaction_manifest?.[credId];
      if (manifest && manifest.redacted_fields.length > 0) {
        const { redactedClaim } = createRedactedClaim(cred.claim as Record<string, unknown>, manifest.disclosed_fields);
        const presentationCred: Credential = {
          ...cred,
          claim: redactedClaim,
          redacted_fields: manifest.redacted_fields,
          attribute_hashes: manifest.attribute_hashes,
        };
        const sigCheck = verifyCredentialSignature(presentationCred, manifest);
        if (!sigCheck.isValid && !simulate_tamper) {
          isAnyTampered = true;
          tamperDetails.push(`Credential ${credId} (${cred.type}): ${sigCheck.reason}`);
        }
        resolvedCredentials.push(presentationCred);
      } else {
        const sigCheck = verifyCredentialSignature(cred);
        if (!sigCheck.isValid && !simulate_tamper) {
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

  let verificationStatus: import('@openvyapar/shared').VerificationStatus = 'valid';
  let verificationReason = 'VALID';

  if (isExpired) {
    verificationStatus = 'expired';
    verificationReason = 'PROOF_EXPIRED';
  } else if (isMaxUsesExceeded) {
    verificationStatus = 'max_uses_exceeded';
    verificationReason = 'PROOF_MAX_USES_EXCEEDED';
  } else if (isAnyTampered) {
    verificationStatus = 'tampered';
    verificationReason = 'TAMPERED_CREDENTIALS';
  }

  const hasGst = resolvedCredentials.some((c) => c.type === 'gst_compliant');
  const hasBank = resolvedCredentials.some((c) => c.type === 'income_bracket');
  const hasMarketplace = resolvedCredentials.some((c) => c.type === 'order_history');

  const isValid = verificationStatus === 'valid';
  const trustScore = isValid ? Math.min(100, (hasGst ? 40 : 0) + (hasBank ? 30 : 0) + (hasMarketplace ? 30 : 20)) : 0;

  await recordAuditLog(
    proof.business_id,
    'admin',
    verifier_id || 'did:org:sbi_bank',
    'verify_proof',
    isValid,
    {
      req,
      metadata: {
        proof_id: targetProofId,
        verification_status: verificationStatus,
        is_tampered: isAnyTampered,
        simulate_tamper: !!simulate_tamper,
      },
    }
  );

  res.json({
    success: true,
    valid: isValid,
    tampered: isAnyTampered,
    verification_status: verificationStatus,
    verification_reason: verificationReason,
    proof: {
      ...proof,
      disclosed_credentials: resolvedCredentials,
      verification_status: verificationStatus,
    },
    business,
    credentials: resolvedCredentials,
    trust_score: trustScore,
    message: isValid
      ? 'Cryptographic HMAC signature verified successfully against root issuer keys.'
      : 'Cryptographic verification failed: HMAC digest mismatch or tampered payload.',
    tamper_details: tamperDetails.length > 0 ? tamperDetails : undefined,
  });
});

/**
 * GET /proof/verify/:proof_id
 * Verifier Portal: Inspects selective-disclosure credentials and computes cryptographic verification
 */
proofRouter.get('/verify/:proof_id', async (req: Request<{ proof_id: string }>, res: Response) => {
  const inputId = req.params.proof_id;
  const session = deskSessions.get(inputId);
  const proofId = session?.proof_id || inputId;
  const proof = await db.getProofShare(proofId);

  if (!proof) {
    if (session) {
      return sendError(res, 404, `Desk Session ${inputId} is active, but no proof has been transmitted yet. Please dispatch from Owner Wallet.`);
    }
    return sendError(res, 404, `Proof with id ${inputId} not found`);
  }

  const business = await db.getBusiness(proof.business_id);
  if (!business) {
    return sendError(res, 404, `Associated business ${proof.business_id} not found`);
  }

  // Atomically increment use count for this verification attempt
  proof.use_count = (proof.use_count || 0) + 1;
  await db.setProofShare(proof);

  // Check expiration & max-uses constraints
  const isExpired = !!(proof.expires_at && new Date(proof.expires_at).getTime() < Date.now());
  const isMaxUsesExceeded = !!(proof.max_uses && proof.use_count > proof.max_uses);

  const resolvedCredentials: Credential[] = [];
  const tamperDetails: string[] = [];
  let isAnyTampered = false;

  for (const credId of proof.disclosed_credential_ids) {
    const cred = await db.getCredentialById(credId);
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
    await db.setProofShare(proof);
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
proofRouter.post('/simulate-tamper/:proof_id', async (req: Request<{ proof_id: string }, {}, import('@openvyapar/shared').SimulateTamperRequest>, res: Response) => {
  try {
    const proofId = req.params.proof_id;
    const mode = req.body?.mode || 'corrupt_signature';
    const targetCredentialId = req.body?.target_credential_id;

    const proof = await db.getProofShare(proofId);
    if (!proof) {
      return sendError(res, 404, `Proof with id ${proofId} not found`);
    }

    const targetCredIds = targetCredentialId
      ? [targetCredentialId]
      : proof.disclosed_credential_ids;

    const affectedIds: string[] = [];

    for (const credId of targetCredIds) {
      const cred = await db.getCredentialById(credId);
      if (!cred) continue;

      if (mode === 'corrupt_signature') {
        // Invert/corrupt the signature bytes
        cred.signature = `tampered_${crypto.randomUUID().slice(0, 8)}_${cred.signature.slice(16)}`;
        await db.setCredential(cred);
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
        cred.claim = claimObj as unknown as CredentialClaim;
        await db.setCredential(cred);
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
        await db.setCredential(cred);
        affectedIds.push(credId);
      }
    }

    // Update proof status if restored
    if (mode === 'restore') {
      proof.verification_status = 'valid';
      await db.setProofShare(proof);
    }

    await recordAuditLog(
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
  } catch (err: unknown) {
    sendError(res, 500, (err as Error).message || 'Internal server error');
  }
});
