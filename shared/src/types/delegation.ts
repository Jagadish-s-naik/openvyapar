/**
 * Delegation Data Models
 * Scoped permissions separated from identity roles
 * Matching PRD §7
 */

export type DelegationScope =
  | 'file_returns'
  | 'view_compliance'
  | 'update_profile'
  | 'view_order_history'
  | 'manage_inventory'
  | 'submit_loan_application'
  | string;

export type DelegationStatus = 'active' | 'revoked';

export interface DelegationToken {
  token_id: string; // UUID
  business_id: string; // e.g. "did:biz:sharma001"
  delegate_person_id: string; // e.g. "did:person:ca001"
  scopes: DelegationScope[];
  granted_by: string; // e.g. "did:person:ramesh001"
  status: DelegationStatus;
  created_at: string; // ISO 8601
  expires_at: string | null;
}
