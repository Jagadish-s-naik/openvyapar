import type {
  Business,
  Credential,
  DelegationToken,
  TimelineEvent,
  Person,
  ProofShare,
  ConsentExplainResponse,
  ScopeSuggestResponse,
} from '@openvyapar/shared';

export interface AgentAssistantResponse {
  success: boolean;
  answer: string;
  suggested_action?: {
    route?: string;
    label?: string;
  };
}

export const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001';
export const AGENT_URL = (import.meta as any).env?.VITE_AGENT_URL || 'http://localhost:3002';

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
// Backend API Calls (Port 3001)
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
  const query = new URLSearchParams();
  if (category && category !== 'all') query.set('category', category);
  if (sort) query.set('sort', sort);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`${BACKEND_URL}/audit/${businessId}/timeline${qStr}`);
}

export async function getPersonas(): Promise<{ success: boolean; personas: Person[] }> {
  return request(`${BACKEND_URL}/auth/personas`);
}

export async function triggerBatchIssuance(
  businessId: string,
  templateProfile?: string
): Promise<{ success: boolean; count: number; credentials: Credential[] }> {
  return request(`${BACKEND_URL}/mocks/issue-batch/${businessId}`, {
    method: 'POST',
    body: JSON.stringify(templateProfile ? { template_profile: templateProfile } : {}),
  });
}

export async function issueCredential(params: {
  business_id: string;
  issuer: string;
  type: string;
  claim: Record<string, any>;
}): Promise<{ success: boolean; credential: Credential }> {
  return request(`${BACKEND_URL}/credentials/issue`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function generateProof(params: {
  business_id: string;
  purpose: any;
  disclosed_credential_ids: string[];
  shared_with: string;
  generated_by?: string;
  agent_action_id?: string;
  expires_in_hours?: number;
  max_uses?: number;
}): Promise<{ success: boolean; proof: ProofShare; verification_url: string }> {
  return request(`${BACKEND_URL}/proof/generate`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function grantDelegation(params: {
  business_id: string;
  delegate_person_id: string;
  scopes: any[];
  granted_by?: string;
  agent_action_id?: string;
  expires_at?: string;
}): Promise<{ success: boolean; token: DelegationToken }> {
  return request(`${BACKEND_URL}/delegation/grant`, {
    method: 'POST',
    body: JSON.stringify(params),
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
  role_type: 'owner' | 'manager' | 'ca_accountant' | 'csc_agent' | 'staff';
  granted_by?: string;
}): Promise<{ success: boolean; role: any }> {
  return request(`${BACKEND_URL}/business/${params.business_id}/roles`, {
    method: 'POST',
    body: JSON.stringify({
      person_id: params.person_id,
      role_type: params.role_type,
      granted_by: params.granted_by,
    }),
  });
}

// ----------------------------------------------------------------------------
// Agent Service API Calls (Port 3002)
// ----------------------------------------------------------------------------

export async function explainConsent(params: {
  business_id: string;
  purpose: any;
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

export async function askAssistant(params: {
  message: string;
  language?: string;
  context?: Record<string, any>;
}): Promise<AgentAssistantResponse> {
  return request(`${AGENT_URL}/agent/assistant`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
