import crypto from 'node:crypto';
import type { Credential, CredentialClaim } from '@openvyapar/shared';

// Issuer Secret Keys (in a real deployment, these would be KMS-held private keys)
const ISSUER_SECRETS: Record<string, string> = {
  gst_mock: process.env.GST_ISSUER_SECRET || 'openvyapar_gstn_secret_key_2024',
  bank_mock: process.env.BANK_ISSUER_SECRET || 'openvyapar_bank_secret_key_2024',
  marketplace_mock: process.env.MARKETPLACE_ISSUER_SECRET || 'openvyapar_mkt_secret_key_2024',
  agent_witnessed: process.env.AGENT_ISSUER_SECRET || 'openvyapar_csc_agent_secret_key_2024',
};

/**
 * Deterministically canonicalize claim object for hashing
 */
export function canonicalizeClaim(claim: CredentialClaim): string {
  if (claim === null || typeof claim !== 'object') {
    return JSON.stringify(claim);
  }
  const keys = Object.keys(claim).sort();
  const orderedObj: Record<string, unknown> = {};
  for (const key of keys) {
    orderedObj[key] = (claim as Record<string, unknown>)[key];
  }
  return JSON.stringify(orderedObj);
}

/**
 * Sign a credential using HMAC-SHA256
 */
export function signCredential(
  businessId: string,
  issuer: string,
  type: string,
  claim: CredentialClaim,
  issuedAt: string
): string {
  const secret = ISSUER_SECRETS[issuer] || 'default_fallback_issuer_secret';
  const canonicalClaim = canonicalizeClaim(claim);
  const payload = `${businessId}|${issuer}|${type}|${canonicalClaim}|${issuedAt}`;

  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify HMAC-SHA256 signature of a credential
 */
export function verifyCredentialSignature(credential: Credential): {
  isValid: boolean;
  reason?: string;
} {
  const expectedSig = signCredential(
    credential.business_id,
    credential.issuer,
    credential.type,
    credential.claim,
    credential.issued_at
  );

  if (credential.signature !== expectedSig) {
    return {
      isValid: false,
      reason: 'Signature mismatch. The credential payload or claim has been tampered with.',
    };
  }

  if (credential.expires_at && new Date(credential.expires_at) < new Date()) {
    return {
      isValid: false,
      reason: `Credential expired on ${credential.expires_at}`,
    };
  }

  if (credential.status === 'revoked') {
    return {
      isValid: false,
      reason: 'Credential has been revoked by the issuer.',
    };
  }

  return { isValid: true };
}
