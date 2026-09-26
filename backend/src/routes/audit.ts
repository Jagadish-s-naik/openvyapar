import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import type { AgentAction, AgentType, HumanDecision, GetBusinessTimelineResponse } from '@openvyapar/shared';
import { db } from '../db/connection.js';
import { sendError } from '../utils/errors.js';
import { buildBusinessTimeline } from '../utils/timeline.js';

export const auditRouter = Router();

/**
 * GET /audit/:business_id
 * Returns immutable audit log trail for a business
 */
auditRouter.get('/:business_id', (req: Request<{ business_id: string }>, res: Response) => {
  const businessId = req.params.business_id;
  const business = db.getBusiness(businessId);
  if (!business) {
    return sendError(res, 404, `Business with id ${businessId} not found`);
  }

  const logs = db.getAuditLogsForBusiness(businessId);
  const agentActions = db.getAgentActionsForBusiness(businessId);

  res.json({
    success: true,
    business_id: businessId,
    audit_logs: logs,
    agent_proposals: agentActions,
  });
});

/**
 * GET /audit/:business_id/timeline
 * Returns enriched chronological timeline of all human mutations and AI agent interactions
 */
auditRouter.get('/:business_id/timeline', (req: Request<{ business_id: string }, {}, {}, { sort?: 'asc' | 'desc'; category?: string }>, res: Response) => {
  const businessId = req.params.business_id;
  const business = db.getBusiness(businessId);
  if (!business) {
    return sendError(res, 404, `Business with id ${businessId} not found`);
  }

  const sortOrder = req.query.sort === 'asc' ? 'asc' : 'desc';
  let timeline = buildBusinessTimeline(businessId, sortOrder);

  if (req.query.category) {
    timeline = timeline.filter((t) => t.category === req.query.category);
  }

  const responsePayload: GetBusinessTimelineResponse = {
    success: true,
    business_id: businessId,
    count: timeline.length,
    timeline,
  };

  res.json(responsePayload);
});

/**
 * POST /audit/agent-action
 * Records or updates an agent proposal (proposed vs. confirmed)
 */
auditRouter.post('/agent-action', (req: Request<{}, {}, {
  agent_action_id?: string;
  business_id: string;
  agent_type: AgentType;
  input_summary: string;
  proposed_action: Record<string, unknown>;
  human_decision?: HumanDecision;
}>, res: Response) => {
  try {
    const {
      agent_action_id,
      business_id,
      agent_type,
      input_summary,
      proposed_action,
      human_decision = 'pending',
    } = req.body;

    const actionId = agent_action_id || `agent-act-${crypto.randomUUID().slice(0, 8)}`;
    const createdAt = new Date().toISOString();

    const agentAction: AgentAction = {
      agent_action_id: actionId,
      business_id,
      agent_type,
      input_summary,
      proposed_action,
      human_decision,
      created_at: createdAt,
    };

    db.setAgentAction(agentAction);

    res.status(201).json({
      success: true,
      agent_action: agentAction,
    });
  } catch (err: unknown) {
    sendError(res, 500, (err as Error).message || 'Internal server error');
  }
});

/**
 * POST /audit/agent-action/:id/decision
 * Record human decision on an agent proposal (e.g. reject, edit, or manual confirm)
 */
auditRouter.post('/agent-action/:id/decision', (req: Request<{ id: string }, {}, {
  human_decision: HumanDecision;
  decided_by?: string;
  notes?: string;
  edited_payload?: Record<string, unknown>;
}>, res: Response) => {
  try {
    const actionId = req.params.id;
    const { human_decision, notes, edited_payload } = req.body;
    const decided_by = req.body.decided_by || req.actor?.actorId || 'did:person:owner';

    const agentAction = db.getAgentAction(actionId);
    if (!agentAction) {
      return sendError(res, 404, `Agent action with id ${actionId} not found`);
    }

    const previousDecision = agentAction.human_decision;
    agentAction.human_decision = human_decision;
    agentAction.decided_at = new Date().toISOString();

    if (edited_payload) {
      agentAction.proposed_action = { ...agentAction.proposed_action, ...edited_payload };
    }

    db.setAgentAction(agentAction);

    // Record in audit log if rejected or edited
    if (agentAction.business_id && agentAction.business_id !== 'pending_onboarding' && agentAction.business_id !== 'pending_proposal') {
      import('../utils/audit.js').then(({ recordAuditLog }) => {
        recordAuditLog(
          agentAction.business_id,
          'owner',
          decided_by,
          `agent_proposal_${human_decision}`,
          true,
          {
            req,
            diff: {
              human_decision: { before: previousDecision, after: human_decision },
            },
            metadata: { agent_action_id: actionId, notes },
          }
        );
      });
    }

    res.json({
      success: true,
      agent_action: agentAction,
    });
  } catch (err: unknown) {
    sendError(res, 500, (err as Error).message || 'Internal server error');
  }
});
