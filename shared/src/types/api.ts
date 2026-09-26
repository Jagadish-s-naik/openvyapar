/**
 * API Contract Types (Request / Response DTOs)
 * Matching PRD §8
 */

import type { Business, BusinessMetadata, BusinessStatus, Person } from './business.js';
import type { BusinessRole, RoleStatus, RoleType } from './role.js';
import type { Credential, CredentialClaim, CredentialType, IssuerType } from './credential.js';
import type { DelegationScope, DelegationToken } from './delegation.js';
import type { ProofPurpose, ProofShare, VerificationStatus } from './proof.js';
import type { AgentAction, AgentType, HumanDecision } from './audit.js';

// -------------------------------------------------------------
// 1. Business Endpoints (/business, /business/:id/roles)
// -------------------------------------------------------------

export interface CreateBusinessRequest {
  name: string;
  primary_language?: 'hi' | 'kn' | 'en' | string;
  metadata?: Partial<BusinessMetadata>;
  owner_person_id: string;
  agent_action_id?: string; // If originated from onboarding agent suggestion
}

export interface CreateBusinessResponse {
  success: boolean;
  business: Business;
  owner_role: BusinessRole;
}

export interface GetBusinessResponse {
  success: boolean;
  business: Business;
  roles: BusinessRole[];
}

export interface AssignRoleRequest {
  person_id: string;
  role_type: RoleType;
  granted_by: string; // Actor ID
}

export interface AssignRoleResponse {
  success: boolean;
  role: BusinessRole;
}

export interface GetBusinessRolesResponse {
  success: boolean;
  business_id: string;
  roles: (BusinessRole & { person?: Person })[];
}

// -------------------------------------------------------------
// 2. Credential Endpoints (/credentials/issue, /credentials/:business_id)
// -------------------------------------------------------------

export interface IssueCredentialRequest {
  business_id: string;
  issuer: IssuerType;
  type: CredentialType;
  claim: CredentialClaim;
  expires_at?: string | null;
  agent_action_id?: string; // If originated from agent proposal
}

export interface IssueCredentialResponse {
  success: boolean;
  credential: Credential;
}

export interface GetCredentialsResponse {
  success: boolean;
  business_id: string;
  credentials: Credential[];
}

// -------------------------------------------------------------
// 3. Delegation Endpoints (/delegation/grant, /delegation/revoke)
// -------------------------------------------------------------

export interface GrantDelegationRequest {
  business_id: string;
  delegate_person_id: string;
  scopes: DelegationScope[];
  granted_by: string; // Owner person ID
  expires_at?: string | null;
  agent_action_id?: string; // If confirmed from delegation scoping agent
}

export interface RevokeDelegationRequest {
  business_id: string;
  token_id: string;
  revoked_by: string; // Actor person ID
}

export interface DelegationActionResponse {
  success: boolean;
  token: DelegationToken;
}

export interface GetDelegationsResponse {
  success: boolean;
  business_id: string;
  tokens: (DelegationToken & { delegate?: Person })[];
}

// -------------------------------------------------------------
// 4. Proof Endpoints (/proof/generate, /proof/verify/:proof_id)
// -------------------------------------------------------------

export interface GenerateProofRequest {
  business_id: string;
  purpose: ProofPurpose;
  disclosed_credential_ids: string[];
  shared_with: string;
  generated_by: string;
  agent_action_id?: string; // If originated from consent explainer
}

export interface GenerateProofResponse {
  success: boolean;
  proof: ProofShare;
  verification_url: string;
}

export interface VerifyProofResponse {
  success: boolean;
  proof: ProofShare;
  business: Business;
  credentials: Credential[];
  verification_status: VerificationStatus;
  tamper_details?: string[];
  trust_analysis?: {
    anomaly_flags: string[];
    summary: string;
    trust_score: number; // 0 - 100
  };
}

// -------------------------------------------------------------
// 5. Agent Endpoints (/agent/*)
// Guardrail: None of these endpoints mutate core business tables.
// They only propose actions and record to agent_action with human_decision: "pending".
// -------------------------------------------------------------

export interface ConsentExplainRequest {
  business_id: string;
  purpose: ProofPurpose;
  selected_credential_ids: string[];
  recipient_name: string;
  language?: 'hi' | 'kn' | 'en' | string;
}

export interface ConsentExplainResponse {
  success: boolean;
  agent_action_id: string;
  plain_language_explanation: string;
  shared_data_summary: string[];
  withheld_data_summary: string[];
  risk_assessment: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface ScopeSuggestRequest {
  business_id: string;
  natural_language_prompt: string; // e.g. "I want my CA to file my taxes"
  delegate_info?: {
    name?: string;
    phone?: string;
    role_description?: string;
  };
  language?: 'hi' | 'kn' | 'en' | string;
}

export interface ScopeSuggestResponse {
  success: boolean;
  agent_action_id: string;
  proposed_scopes: DelegationScope[];
  explanation: string;
  least_privilege_notes: string;
}

export interface OnboardExtractRequest {
  raw_transcript_or_text: string; // Free-text / voice transcript from CSC or owner
  csc_agent_id?: string;
  language?: 'hi' | 'kn' | 'en' | string;
}

export interface OnboardExtractResponse {
  success: boolean;
  agent_action_id: string;
  proposed_business: {
    name: string;
    sector: string;
    location: string;
    primary_language: string;
    contact_phone: string;
    owner_name: string;
  };
  proposed_starter_credential: {
    type: 'self_attested';
    claim: {
      business_nature: string;
      established_year: number;
      approx_monthly_revenue: string;
      witness_notes?: string;
    };
  };
  missing_fields: string[];
  confidence_score: number; // 0.0 - 1.0
}

export interface VerifierFlagRequest {
  proof_id: string;
  business_id: string;
  credentials: Credential[];
  business_status: BusinessStatus;
}

export interface VerifierFlagResponse {
  success: boolean;
  agent_action_id: string;
  anomalies_detected: boolean;
  flags: {
    severity: 'info' | 'warning' | 'alert';
    code: string;
    message: string;
  }[];
  overall_verdict: 'verified_clean' | 'attention_recommended' | 'high_risk';
  narrative_summary: string;
}

// -------------------------------------------------------------
// 6. Audit & Timeline Endpoints (/audit/:business_id, /audit/:business_id/timeline)
// -------------------------------------------------------------

export interface GetAuditLogsResponse {
  success: boolean;
  business_id: string;
  audit_logs: import('./audit.js').AuditLog[];
  agent_proposals: import('./audit.js').AgentAction[];
}

