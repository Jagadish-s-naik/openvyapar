/**
 * Credential Data Models
 * Matching PRD §7
 */

export type IssuerType = 'gst_mock' | 'bank_mock' | 'marketplace_mock' | 'agent_witnessed';

export type CredentialType =
  | 'gst_compliant'
  | 'filing_history'
  | 'income_bracket'
  | 'order_history'
  | 'self_attested';

export type CredentialStatus = 'valid' | 'revoked';

export interface GstClaimPayload {
  gstin: string;
  legal_name: string;
  trade_name: string;
  registration_date: string;
  filing_status_last_6_months: 'all_on_time' | 'minor_delay' | 'defaulter';
  active_compliance_score: number; // 0 - 100
  last_return_filed: string; // ISO 8601
}

export interface BankIncomeClaimPayload {
  bank_name: string;
  account_category: 'current' | 'overdraft' | 'savings';
  turnover_bracket: 'under_10L' | '10L_to_25L' | '25L_to_50L' | '50L_to_1Cr' | 'above_1Cr';
  average_monthly_balance_tier: 'tier_1' | 'tier_2' | 'tier_3';
  active_loan_default: boolean;
  relationship_tenure_months: number;
}

export interface MarketplaceClaimPayload {
  platform_name: string;
  seller_id: string;
  total_completed_orders: number;
  customer_satisfaction_rating: number; // 1.0 - 5.0
  fulfillment_rate_pct: number;
  active_months: number;
  dispute_rate_pct: number;
}

export interface SelfAttestedClaimPayload {
  business_nature: string;
  established_year: number;
  approx_monthly_revenue: string;
  witnessed_by_csc_agent_id?: string;
  witness_notes?: string;
  location_coordinates?: { lat: number; lng: number };
}

export type CredentialClaim =
  | GstClaimPayload
  | BankIncomeClaimPayload
  | MarketplaceClaimPayload
  | SelfAttestedClaimPayload
  | Record<string, unknown>;

export interface Credential {
  credential_id: string; // UUID
  business_id: string; // e.g. "did:biz:sharma001"
  issuer: IssuerType;
  type: CredentialType;
  claim: CredentialClaim;
  issued_at: string; // ISO 8601
  expires_at: string | null;
  signature: string; // HMAC or keypair signature
  status: CredentialStatus;
  redacted_fields?: string[]; // Field names redacted during selective disclosure
  attribute_hashes?: Record<string, string>; // Sub-hashes for attribute verification
}
