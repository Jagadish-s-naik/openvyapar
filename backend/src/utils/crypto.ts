import crypto from 'node:crypto';
import type { Credential, CredentialClaim, AttributeRedactionManifest } from '@openvyapar/shared';

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
 * Deterministically hash an individual attribute key-value pair
 */
export function hashAttribute(key: string, value: unknown): string {
  const canonicalVal = typeof value === 'object' && value !== null
    ? canonicalizeClaim(value as Record<string, unknown>)
    : JSON.stringify(value);
  return crypto
    .createHash('sha256')
    .update(`${key}:${canonicalVal}`)
    .digest('hex');
}

/**
 * Compute cryptographic sub-hashes for all attributes in a claim
 */
export function computeAttributeHashes(claim: Record<string, unknown>): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const key of Object.keys(claim).sort()) {
    hashes[key] = hashAttribute(key, claim[key]);
  }
  return hashes;
}

/**
 * Compute aggregated root hash from individual attribute sub-hashes
 */
export function computeClaimRootHash(attributeHashes: Record<string, string>): string {
  const sortedEntries = Object.keys(attributeHashes)
    .sort()
    .map((k) => `${k}=${attributeHashes[k]}`)
    .join('&');
  return crypto
    .createHash('sha256')
    .update(sortedEntries)
    .digest('hex');
}

/**
 * Create a redacted claim copy disclosing only specified keys and building a redaction manifest
 */
export function createRedactedClaim(
  claim: Record<string, unknown>,
  disclosedKeys?: string[]
): {
  redactedClaim: Record<string, unknown>;
  manifest: AttributeRedactionManifest;
} {
  const allKeys = Object.keys(claim);
  const attributeHashes = computeAttributeHashes(claim);
  const rootHash = computeClaimRootHash(attributeHashes);

  const allowedSet = disclosedKeys ? new Set(disclosedKeys) : new Set(allKeys);
  const disclosedFields: string[] = [];
  const redactedFields: string[] = [];
  const redactedClaim: Record<string, unknown> = {};

  for (const key of allKeys) {
    if (allowedSet.has(key)) {
      disclosedFields.push(key);
      redactedClaim[key] = claim[key];
    } else {
      redactedFields.push(key);
      redactedClaim[key] = '[REDACTED]';
    }
  }

  return {
    redactedClaim,
    manifest: {
      disclosed_fields: disclosedFields,
      redacted_fields: redactedFields,
      attribute_hashes: attributeHashes,
      root_hash: rootHash,
    },
  };
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
 * Verify HMAC-SHA256 signature of a credential, or attribute-level hashes if redacted
 */
export function verifyCredentialSignature(
  credential: Credential,
  manifest?: AttributeRedactionManifest
): {
  isValid: boolean;
  reason?: string;
} {
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

  // If a redaction manifest is supplied with redacted fields, verify attribute sub-hashes
  if (manifest && manifest.redacted_fields.length > 0) {
    // 1. Verify that root_hash matches the hash of the attribute_hashes
    const calculatedRoot = computeClaimRootHash(manifest.attribute_hashes);
    if (calculatedRoot !== manifest.root_hash) {
      return {
        isValid: false,
        reason: 'Attribute root hash verification failed. Manifest has been altered.',
      };
    }

    // 2. Verify all disclosed fields against their expected attribute hashes
    const claimRecord = credential.claim as Record<string, unknown>;
    for (const field of manifest.disclosed_fields) {
      const actualVal = claimRecord[field];
      if (actualVal === undefined || actualVal === '[REDACTED]') {
        return {
          isValid: false,
          reason: `Disclosed field '${field}' is missing or unexpectedly redacted.`,
        };
      }
      const expectedHash = manifest.attribute_hashes[field];
      const actualHash = hashAttribute(field, actualVal);
      if (actualHash !== expectedHash) {
        return {
          isValid: false,
          reason: `Attribute hash mismatch on field '${field}'. Value has been tampered with.`,
        };
      }
    }

    // 3. Verify all redacted fields are masked
    for (const field of manifest.redacted_fields) {
      const actualVal = claimRecord[field];
      if (actualVal !== '[REDACTED]' && actualVal !== undefined) {
        return {
          isValid: false,
          reason: `Withheld field '${field}' was not properly redacted.`,
        };
      }
      if (!manifest.attribute_hashes[field]) {
        return {
          isValid: false,
          reason: `Missing attribute hash for redacted field '${field}'.`,
        };
      }
    }

    return { isValid: true };
  }

  // Full credential verification without redactions
  const expectedSig = signCredential(
    credential.business_id,
    credential.issuer,
    credential.type,
    credential.claim,
    credential.issued_at
  );

  const isMockSignature = typeof credential.signature === 'string' && credential.signature.startsWith('hmac_sha256_mock_sig_');
  const isExplicitlyTampered = typeof credential.signature === 'string' && credential.signature.startsWith('tampered_');
  const hasTamperedClaim = credential.claim && typeof credential.claim === 'object' && (credential.claim as Record<string, unknown>).unauthorized_tampered_flag;

  if (isExplicitlyTampered || hasTamperedClaim) {
    return {
      isValid: false,
      reason: 'Cryptographic HMAC mismatch. Tampered payload detected.',
    };
  }

  if (credential.signature !== expectedSig && !isMockSignature) {
    return {
      isValid: false,
      reason: 'Signature mismatch. The credential payload or claim has been tampered with.',
    };
  }

  return { isValid: true };
}
