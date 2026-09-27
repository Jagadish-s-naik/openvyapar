import type {
  Business,
  BusinessRole,
  Credential,
  CredentialClaim,
  DelegationScope,
  DelegationToken,
  TimelineEvent,
  Person,
  ProofPurpose,
  ProofShare,
  GenerateProofResponse,
  IssueMockBatchResponse,
  ConsentExplainResponse,
  ScopeSuggestResponse,
  OnboardExtractResponse,
  VerifierFlagResponse,
  RoleType,
} from '@openvyapar/shared';

export interface AgentAssistantResponse {
  success: boolean;
  answer: string;
  suggested_action?: {
    route?: string;
    label?: string;
  };
}

export const BACKEND_URL = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BACKEND_URL || 'http://localhost:3000';
export const AGENT_URL = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_AGENT_URL || BACKEND_URL;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok && !data.success) {
    const errorMsg = data.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }
  return data;
}

// ----------------------------------------------------------------------------
// Core Backend API Calls (Port 3000)
// ----------------------------------------------------------------------------

export async function getBusiness(businessId: string): Promise<{ success: boolean; business: Business }> {
  return request(`${BACKEND_URL}/business/${businessId}`);
}

export async function getCredentials(businessId: string): Promise<{ success: boolean; credentials: Credential[] }> {
  return request(`${BACKEND_URL}/credentials/${businessId}`);
}

export async function getDelegations(businessId: string): Promise<{ success: boolean; tokens: DelegationToken[] }> {
  return request(`${BACKEND_URL}/delegation/${businessId}`);
}

export async function getAuditTimeline(
  businessId: string,
  category?: string,
  sort: 'asc' | 'desc' = 'desc'
): Promise<{ success: boolean; timeline: TimelineEvent[]; count: number }> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (sort) params.set('sort', sort);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`${BACKEND_URL}/audit/${businessId}/timeline${q}`);
}

export async function getPersonas(): Promise<{ success: boolean; personas: Person[] }> {
  return request(`${BACKEND_URL}/auth/personas`);
}

export async function triggerMockIssuance(
  businessId: string,
  issuerKey: 'gst' | 'bank' | 'marketplace'
): Promise<{ success: boolean; credential: Credential }> {
  return request(`${BACKEND_URL}/mocks/issue/${issuerKey}`, {
    method: 'POST',
    body: JSON.stringify({ business_id: businessId }),
  });
}

export async function triggerBatchMocks(
  businessId: string
): Promise<{ success: boolean; issued: Credential[]; credentials: Credential[] }> {
  const res = await request<IssueMockBatchResponse>(`${BACKEND_URL}/mocks/issue-batch/${businessId}`, {
    method: 'POST',
    body: JSON.stringify({ business_id: businessId }),
  });
  return { success: res.success, issued: res.credentials, credentials: res.credentials };
}

export async function triggerBatchIssuance(
  businessId: string,
  templateProfile?: string
): Promise<{ success: boolean; credentials: Credential[] }> {
  const res = await request<IssueMockBatchResponse>(`${BACKEND_URL}/mocks/issue-batch/${businessId}`, {
    method: 'POST',
    body: JSON.stringify({ template: templateProfile }),
  });
  return { success: res.success, credentials: res.credentials };
}

export async function issueCredential(params: {
  business_id: string;
  issuer: string;
  type: string;
  claim: CredentialClaim | Record<string, unknown>;
}): Promise<{ success: boolean; credential: Credential }> {
  return request(`${BACKEND_URL}/credentials/issue`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function generateProof(params: {
  business_id: string;
  purpose: ProofPurpose | string;
  recipient_name?: string;
  shared_with?: string;
  selected_credential_ids?: string[];
  disclosed_credential_ids?: string[];
  expires_in_hours?: number;
  agent_action_id?: string;
  confirmed_by_human?: boolean;
  generated_by?: string;
}): Promise<{ success: boolean; proof: ProofShare; qr_payload: string; verification_url: string }> {
  const payload = {
    business_id: params.business_id,
    purpose: params.purpose,
    recipient_name: params.recipient_name || params.shared_with || 'General Verifier',
    disclosed_credential_ids: params.disclosed_credential_ids || params.selected_credential_ids || [],
    expires_in_hours: params.expires_in_hours || 48,
    agent_action_id: params.agent_action_id,
    confirmed_by_human: params.confirmed_by_human,
  };
  const res = await request<GenerateProofResponse>(`${BACKEND_URL}/proof/generate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    success: res.success,
    proof: res.proof,
    qr_payload: res.proof?.proof_id,
    verification_url: res.verification_url || `/verifier?proof_id=${res.proof?.proof_id}`,
  };
}

export async function getProof(
  proofId: string
): Promise<{ success: boolean; proof: ProofShare }> {
  return request(`${BACKEND_URL}/proof/${proofId}`);
}

export async function verifyProof(params: {
  proof_id: string;
  verifier_id?: string;
  simulate_tamper?: boolean;
}): Promise<{
  success: boolean;
  valid: boolean;
  tampered: boolean;
  proof?: ProofShare;
  business?: Business;
  credentials?: Credential[];
  trust_score?: number;
  message?: string;
}> {
  return request(`${BACKEND_URL}/proof/verify`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function grantDelegation(params: {
  business_id: string;
  delegatee_person_id?: string;
  delegate_person_id?: string;
  delegatee_name?: string;
  scopes: DelegationScope[] | string[];
  expires_at?: string;
  agent_action_id?: string;
  confirmed_by_human?: boolean;
  granted_by?: string;
}): Promise<{ success: boolean; token: DelegationToken }> {
  const payload = {
    business_id: params.business_id,
    delegate_person_id: params.delegate_person_id || params.delegatee_person_id || 'did:person:ca001',
    scopes: params.scopes,
    expires_at: params.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
    agent_action_id: params.agent_action_id,
    confirmed_by_human: params.confirmed_by_human,
  };
  return request(`${BACKEND_URL}/delegation/grant`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function revokeDelegation(params: {
  business_id: string;
  token_id: string;
  revoked_by?: string;
}): Promise<{ success: boolean; token: DelegationToken }> {
  return request(`${BACKEND_URL}/delegation/revoke`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function transferOwnership(params: {
  business_id: string;
  person_id: string;
  role_type: RoleType;
  granted_by?: string;
}): Promise<{ success: boolean; role: BusinessRole }> {
  return request(`${BACKEND_URL}/business/${params.business_id}/roles`, {
    method: 'POST',
    body: JSON.stringify({
      person_id: params.person_id,
      role_type: params.role_type,
      granted_by: params.granted_by,
    }),
  });
}

export async function createBusiness(params: {
  name: string;
  primary_language?: string;
  owner_person_id?: string;
  agent_action_id?: string;
  confirmed_by_human?: boolean;
  starter_credential?: Credential | Record<string, unknown>;
}): Promise<{ success: boolean; business: Business; starter_credential?: Credential }> {
  return request(`${BACKEND_URL}/business`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ----------------------------------------------------------------------------
// Agent API Calls (Port 3000 /agent/*)
// ----------------------------------------------------------------------------

export async function explainConsent(params: {
  business_id: string;
  purpose: ProofPurpose | string;
  selected_credential_ids: string[];
  recipient_name: string;
  language?: string;
}): Promise<ConsentExplainResponse> {
  return request(`${AGENT_URL}/agent/consent-explain`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function suggestScopes(params: {
  business_id: string;
  natural_language_prompt: string;
  delegate_info: { name: string; email?: string; phone?: string };
  language?: string;
}): Promise<ScopeSuggestResponse> {
  return request(`${AGENT_URL}/agent/scope-suggest`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function extractOnboarding(params: {
  raw_transcript_or_text: string;
  csc_agent_id?: string;
  language?: string;
}): Promise<OnboardExtractResponse> {
  return request(`${AGENT_URL}/agent/onboard-extract`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function analyzeVerifierTrust(params: {
  proof_id: string;
  business_id: string;
  business_status?: string;
  credentials: Credential[];
  language?: string;
}): Promise<VerifierFlagResponse> {
  return request(`${AGENT_URL}/agent/verifier-flag`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function askAssistant(params: {
  message: string;
  language?: string;
  context?: Record<string, unknown>;
}): Promise<AgentAssistantResponse> {
  return request(`${AGENT_URL}/agent/assistant`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
