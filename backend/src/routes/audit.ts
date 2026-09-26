import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import type { AgentAction, AgentType, HumanDecision } from '@openvyapar/shared';
import { db } from '../db/connection.js';
import { sendError } from '../utils/errors.js';

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
  } catch (err: any) {
    sendError(res, 500, err.message || 'Internal server error');
  }
});
