import crypto from 'node:crypto';
import type { Credential, SelfAttestedClaimPayload, IssueCscWitnessRequest } from '@openvyapar/shared';
import { signCredential } from '../utils/crypto.js';

export function issueMockCscWitnessCredential(
  businessId: string,
  options?: Partial<IssueCscWitnessRequest>
): Credential {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 2-year validity

  const cscAgentId = options?.csc_agent_id || 'did:person:csc001';
  const agentName = options?.agent_name || 'Aarav Patel (VLE #UP-VAR-8821)';
  const cscCenterId = options?.csc_center_id || 'CSC-VAR-0912';
  const coordinates = options?.coordinates || { lat: 25.3176, lng: 82.9739 };

  const photoHash = crypto
    .createHash('sha256')
    .update(`csc_witness_photo_${businessId}_${issuedAt}_${cscCenterId}`)
    .digest('hex');

  const claim: SelfAttestedClaimPayload = {
    business_nature: 'Retail Grocery & Essentials',
    established_year: 2018,
    approx_monthly_revenue: 'INR 2,00,000',
    witnessed_by_csc_agent_id: cscAgentId,
    witness_agent_name: agentName,
    csc_center_id: cscCenterId,
    location_coordinates: coordinates,
    photo_verification_hash: photoHash,
    witness_notes: 'Physical shop verified at Godowlia Chowk. Biometric & geo-photo witness recorded by authorized CSC VLE.',
    physical_verification_timestamp: issuedAt,
    ...(options?.claim_overrides || {}),
  };

  const credentialId = `cred-csc-${crypto.randomUUID().slice(0, 8)}`;
  const signature = signCredential(businessId, 'agent_witnessed', 'self_attested', claim, issuedAt);

  return {
    credential_id: credentialId,
    business_id: businessId,
    issuer: 'agent_witnessed',
    type: 'self_attested',
    claim,
    issued_at: issuedAt,
    expires_at: expiresAt,
    signature,
    status: 'valid',
  };
}
