import crypto from 'node:crypto';
import type { Credential, GstClaimPayload } from '@openvyapar/shared';
import { signCredential } from '../utils/crypto.js';

export function issueMockGstCredential(
  businessId: string,
  businessName: string,
  overrides?: Partial<GstClaimPayload>
): Credential {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year validity

  const claim: GstClaimPayload = {
    gstin: `09${crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 10)}1Z5`,
    legal_name: businessName,
    trade_name: businessName,
    registration_date: '2021-04-10',
    filing_status_last_6_months: 'all_on_time',
    active_compliance_score: 98,
    last_return_filed: issuedAt,
    ...overrides,
  };

  const credentialId = `cred-gst-${crypto.randomUUID().slice(0, 8)}`;
  const signature = signCredential(businessId, 'gst_mock', 'gst_compliant', claim, issuedAt);

  return {
    credential_id: credentialId,
    business_id: businessId,
    issuer: 'gst_mock',
    type: 'gst_compliant',
    claim,
    issued_at: issuedAt,
    expires_at: expiresAt,
    signature,
    status: 'valid',
  };
}
