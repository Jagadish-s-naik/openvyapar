import type { AgentType, HumanDecision, AgentAction } from '@openvyapar/shared';
import { db } from '../../db/connection.js';

export async function recordProposalToBackend(
  agentActionId: string,
  businessId: string,
  agentType: AgentType,
  inputSummary: string,
  proposedAction: Record<string, unknown>,
  humanDecision: HumanDecision = 'pending'
): Promise<void> {
  try {
    const agentAction: AgentAction = {
      agent_action_id: agentActionId,
      business_id: businessId,
      agent_type: agentType,
      input_summary: inputSummary,
      proposed_action: proposedAction,
      human_decision: humanDecision,
      created_at: new Date().toISOString(),
    };
    db.setAgentAction(agentAction);
  } catch (_err) {
    // Gracefully continue if DB record fails
  }
}
