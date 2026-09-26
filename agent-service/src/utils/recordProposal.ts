import type { AgentType, HumanDecision } from '@openvyapar/shared';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function recordProposalToBackend(
  agentActionId: string,
  businessId: string,
  agentType: AgentType,
  inputSummary: string,
  proposedAction: Record<string, unknown>,
  humanDecision: HumanDecision = 'pending'
): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/audit/agent-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_action_id: agentActionId,
        business_id: businessId,
        agent_type: agentType,
        input_summary: inputSummary,
        proposed_action: proposedAction,
        human_decision: humanDecision,
      }),
    });
  } catch (err) {
    // If backend is unreachable (e.g. unit tests running in isolation), log warning and continue
    // console.warn('Could not sync agent proposal to backend audit log:', err);
  }
}
