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

export type VerificationStatus = 'valid' | 'tampered' | 'expired' | 'max_uses_exceeded';

export interface AttributeRedactionManifest {
  disclosed_fields: string[];
  redacted_fields: string[];
  attribute_hashes: Record<string, string>; // field_name -> SHA-256 hash
  root_hash: string;
}

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
  expires_at?: string | null; // ISO 8601 timestamp or null
  max_uses?: number | null; // Max number of allowed verifications (e.g. 1 for single-use)
  use_count?: number; // Total number of times inspected/verified
  disclosed_attributes?: Record<string, string[]>; // Optional per-credential disclosed field names
  redaction_manifest?: Record<string, AttributeRedactionManifest>; // Optional per-credential sub-hashes
}
