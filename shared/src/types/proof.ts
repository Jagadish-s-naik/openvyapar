/**
 * Selective Disclosure Proof Models
 * Matching PRD §7
 */

import type { Credential } from './credential.js';

export type ProofPurpose =
  | 'loan_application'
  | 'platform_onboarding'
  | 'license_renewal'
  | 'vendor_qualification'
  | string;

export type VerificationStatus = 'valid' | 'tampered' | 'expired';

export interface ProofShare {
  proof_id: string; // UUID
  business_id: string; // e.g. "did:biz:sharma001"
  purpose: ProofPurpose;
  disclosed_credential_ids: string[]; // List of credential UUIDs
  disclosed_credentials?: Credential[]; // Hydrated credentials when resolved
  shared_with: string; // e.g. "Viksit Capital Lender"
  generated_at: string; // ISO 8601
  link_or_qr: string; // Verification URL / QR code token
  verification_status: VerificationStatus;
}
