/**
 * Audit Log & Agent Action Data Models
 * Matching PRD §7
 */

export type AuditActorType = 'owner' | 'delegate' | 'agent_suggestion' | 'issuer';

export interface AuditLog {
  log_id: string; // UUID
  business_id: string; // e.g. "did:biz:sharma001"
  actor_type: AuditActorType;
  actor_id: string; // e.g. "did:person:ramesh001"
  action: string; // e.g. "issue_credential", "revoke_token", "generate_proof", "transfer_ownership"
  confirmed_by_human: boolean;
  timestamp: string; // ISO 8601
  metadata?: Record<string, unknown>;
}

export type AgentType =
  | 'onboarding'
  | 'consent_explainer'
  | 'delegation_scoping'
  | 'compliance_nudge'
  | 'verifier_trust';

export type HumanDecision = 'confirmed' | 'edited' | 'rejected' | 'pending';

export interface AgentAction {
  agent_action_id: string; // UUID
  business_id: string; // e.g. "did:biz:sharma001"
  agent_type: AgentType;
  input_summary: string;
  proposed_action: Record<string, unknown>;
  human_decision: HumanDecision;
  created_at: string; // ISO 8601
  decided_at?: string | null;
  target_action_ref?: string; // Links to resulting real mutation ID if confirmed
}
