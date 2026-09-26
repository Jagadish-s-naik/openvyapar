import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import type {
  DelegationToken,
  GrantDelegationRequest,
  RevokeDelegationRequest,
  DelegationActionResponse,
  GetDelegationsResponse,
} from '@openvyapar/shared';
import { db } from '../db/connection.js';
import { recordAuditLog } from '../utils/audit.js';
import { sendError } from '../utils/errors.js';
import { validateAgentProposal, confirmAgentProposal } from '../utils/guardrails.js';

import { requireOwner, requireRole } from '../middleware/auth.js';

export const delegationRouter = Router();

/**
 * POST /delegation/grant
 * Issue a scoped delegation token to an authorized delegate (e.g. CA or manager)
 */
delegationRouter.post('/grant', requireOwner((req) => req.body?.business_id), (req: Request<{}, {}, GrantDelegationRequest>, res: Response) => {
  try {
    const { business_id, delegate_person_id, scopes, expires_at = null, agent_action_id } = req.body;
    const granted_by = req.body.granted_by || req.actor?.actorId;

    if (!business_id || !delegate_person_id || !scopes || !Array.isArray(scopes) || !granted_by) {
      return sendError(res, 400, 'Missing required fields: business_id, delegate_person_id, scopes (array), granted_by');
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

    const tokenId = `tok-${crypto.randomUUID().slice(0, 8)}`;
    const createdAt = new Date().toISOString();

    const newToken: DelegationToken = {
      token_id: tokenId,
      business_id,
      delegate_person_id,
      scopes,
      granted_by,
      status: 'active',
      created_at: createdAt,
      expires_at: expires_at || null,
    };

    db.setDelegationToken(newToken);

    // Update agent action if proposed by delegation scoping agent
    if (proposalCheck.proposal) {
      confirmAgentProposal(proposalCheck.proposal, tokenId, createdAt);
    }

    recordAuditLog(
      business_id,
      'owner',
      granted_by,
      'grant_delegation',
      true,
      {
        req,
        diff: {
          delegation_status: { before: null, after: 'active' },
          scopes: { before: [], after: scopes },
        },
        metadata: { token_id: tokenId, delegate_person_id, scopes, agent_action_id },
      }
    );

    const responsePayload: DelegationActionResponse = {
      success: true,
      token: newToken,
    };

    res.status(201).json(responsePayload);
  } catch (err: any) {
    sendError(res, 500, err.message || 'Internal server error');
  }
});

/**
 * POST /delegation/revoke
 * Instantly revoke a delegation token
 */
delegationRouter.post('/revoke', requireRole(['owner', 'delegate'], (req) => req.body?.business_id), (req: Request<{}, {}, RevokeDelegationRequest>, res: Response) => {
  try {
    const { business_id, token_id } = req.body;
    const revoked_by = req.body.revoked_by || req.actor?.actorId;

    if (!business_id || !token_id || !revoked_by) {
      return sendError(res, 400, 'Missing required fields: business_id, token_id, revoked_by');
    }

    const token = db.getDelegationById(token_id);
    if (!token || token.business_id !== business_id) {
      return sendError(res, 404, `Delegation token with id ${token_id} not found for business`);
    }

    const previousStatus = token.status;
    token.status = 'revoked';
    db.setDelegationToken(token);

    recordAuditLog(
      business_id,
      'owner',
      revoked_by,
      'revoke_delegation',
      true,
      {
        req,
        diff: {
          status: { before: previousStatus, after: 'revoked' },
        },
        metadata: { token_id, revoked_at: new Date().toISOString() },
      }
    );

    const responsePayload: DelegationActionResponse = {
      success: true,
      token,
    };

    res.json(responsePayload);
  } catch (err: any) {
    sendError(res, 500, err.message || 'Internal server error');
  }
});

/**
 * GET /delegation/:business_id
 * List all active and revoked delegation tokens
 */
delegationRouter.get('/:business_id', (req: Request<{ business_id: string }>, res: Response) => {
  const businessId = req.params.business_id;
  const business = db.getBusiness(businessId);
  if (!business) {
    return sendError(res, 404, `Business with id ${businessId} not found`);
  }

  const rawTokens = db.getDelegationsForBusiness(businessId);
  const tokensWithDelegate = rawTokens.map((t) => ({
    ...t,
    delegate: db.getPerson(t.delegate_person_id) || undefined,
  }));

  const responsePayload: GetDelegationsResponse = {
    success: true,
    business_id: businessId,
    tokens: tokensWithDelegate,
  };

  res.json(responsePayload);
});
