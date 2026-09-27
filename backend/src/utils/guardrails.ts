import type { AgentAction, AgentType } from '@openvyapar/shared';
import { db } from '../db/connection.js';

export interface ProposalValidationResult {
  valid: boolean;
  statusCode?: number;
  errorMessage?: string;
  proposal?: AgentAction;
}

/**
 * Validates an agent proposal before mutating business state.
 * Enforces PRD §8 & §12 Guardrails:
 * - Ensures proposal exists if agent_action_id is supplied (or registers it if incoming from agent service)
 * - Prevents re-executing already confirmed proposals (Idempotency Protection)
 * - Prevents executing rejected proposals
 */
export async function validateAgentProposal(
  agentActionId?: string,
  businessIdFallback: string = 'pending_proposal',
  agentTypeFallback: AgentType = 'onboarding'
): Promise<ProposalValidationResult> {
  if (!agentActionId) {
    return { valid: true };
  }

  let proposal = await db.getAgentAction(agentActionId);
  if (!proposal) {
    // Automatically register pending proposal so it is tracked and protected against duplicate confirmation
    proposal = {
      agent_action_id: agentActionId,
      business_id: businessIdFallback,
      agent_type: agentTypeFallback,
      input_summary: 'Agent proposed action',
      proposed_action: {},
      human_decision: 'pending',
      created_at: new Date().toISOString(),
    };
    await db.setAgentAction(proposal);
  }

  if (proposal.human_decision === 'confirmed') {
    return {
      valid: false,
      statusCode: 409,
      errorMessage: `Agent proposal '${agentActionId}' has already been confirmed and executed (idempotency violation).`,
    };
  }

  if (proposal.human_decision === 'rejected') {
    return {
      valid: false,
      statusCode: 400,
      errorMessage: `Agent proposal '${agentActionId}' was rejected and cannot be executed.`,
    };
  }

  return { valid: true, proposal };
}

/**
 * Atomically marks an agent proposal as confirmed and binds it to the created resource ID.
 */
export async function confirmAgentProposal(
  proposal: AgentAction,
  targetActionRef: string,
  businessId?: string,
  decidedAt?: string
): Promise<AgentAction> {
  proposal.human_decision = 'confirmed';
  proposal.decided_at = decidedAt || new Date().toISOString();
  proposal.target_action_ref = targetActionRef;
  if (businessId && (proposal.business_id === 'pending_proposal' || proposal.business_id === 'pending_onboarding')) {
    proposal.business_id = businessId;
  }
  await db.setAgentAction(proposal);
  return proposal;
}


