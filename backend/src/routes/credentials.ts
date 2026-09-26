import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import type {
  Credential,
  IssueCredentialRequest,
  IssueCredentialResponse,
  GetCredentialsResponse,
} from '@openvyapar/shared';
import { db } from '../db/connection.js';
import { signCredential, verifyCredentialSignature } from '../utils/crypto.js';
import { recordAuditLog } from '../utils/audit.js';
import { sendError } from '../utils/errors.js';

export const credentialsRouter = Router();

/**
 * POST /credentials/issue
 * Issue a signed credential to a business (called by mock issuers or onboarding agent)
 */
credentialsRouter.post('/issue', (req: Request<{}, {}, IssueCredentialRequest>, res: Response) => {
  try {
    const { business_id, issuer, type, claim, expires_at = null, agent_action_id } = req.body;

    if (!business_id || !issuer || !type || !claim) {
      return sendError(res, 400, 'Missing required fields: business_id, issuer, type, claim');
    }

    const business = db.getBusiness(business_id);
    if (!business) {
      return sendError(res, 404, `Business with id ${business_id} not found`);
    }

    const credentialId = `cred-${issuer.replace('_mock', '')}-${crypto.randomUUID().slice(0, 8)}`;
    const issuedAt = new Date().toISOString();

    const signature = signCredential(business_id, issuer, type, claim, issuedAt);

    const newCredential: Credential = {
      credential_id: credentialId,
      business_id,
      issuer,
      type,
      claim,
      issued_at: issuedAt,
      expires_at: expires_at || null,
      signature,
      status: 'valid',
    };

    db.setCredential(newCredential);

    // Update agent action if originated from proposal
    if (agent_action_id) {
      const agentAction = db.getAgentAction(agent_action_id);
      if (agentAction) {
        agentAction.human_decision = 'confirmed';
        agentAction.decided_at = issuedAt;
        agentAction.target_action_ref = credentialId;
        db.setAgentAction(agentAction);
      }
    }

    recordAuditLog(
      business_id,
      'issuer',
      issuer,
      'issue_credential',
      true,
      { credential_id: credentialId, type, issuer }
    );

    const responsePayload: IssueCredentialResponse = {
      success: true,
      credential: newCredential,
    };

    res.status(201).json(responsePayload);
  } catch (err: any) {
    sendError(res, 500, err.message || 'Internal server error');
  }
});

/**
 * GET /credentials/:business_id
 * Retrieve all credentials issued to a business (with signature verification check)
 */
credentialsRouter.get('/:business_id', (req: Request<{ business_id: string }>, res: Response) => {
  const businessId = req.params.business_id;
  const business = db.getBusiness(businessId);
  if (!business) {
    return sendError(res, 404, `Business with id ${businessId} not found`);
  }

  const credentials = db.getCredentialsForBusiness(businessId);

  // Validate HMAC signatures on retrieval
  const checkedCredentials = credentials.map((cred) => {
    const check = verifyCredentialSignature(cred);
    return {
      ...cred,
      is_cryptographically_valid: check.isValid,
      verification_note: check.reason || 'Cryptographically verified with HMAC-SHA256 signature',
    };
  });

  const responsePayload: GetCredentialsResponse = {
    success: true,
    business_id: businessId,
    credentials: checkedCredentials as Credential[],
  };

  res.json(responsePayload);
});
