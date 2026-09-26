import crypto from 'node:crypto';
import type { Credential, MarketplaceClaimPayload } from '@openvyapar/shared';
import { signCredential } from '../utils/crypto.js';

export function issueMockMarketplaceCredential(
  businessId: string,
  overrides?: Partial<MarketplaceClaimPayload>
): Credential {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const claim: MarketplaceClaimPayload = {
    platform_name: 'BharatMart ONDC Network Seller',
    seller_id: `bm_seller_${crypto.randomUUID().slice(0, 8)}`,
    total_completed_orders: 1420,
    customer_satisfaction_rating: 4.8,
    fulfillment_rate_pct: 99.2,
    active_months: 18,
    dispute_rate_pct: 0.3,
    ...overrides,
  };

  const credentialId = `cred-mkt-${crypto.randomUUID().slice(0, 8)}`;
  const signature = signCredential(businessId, 'marketplace_mock', 'order_history', claim, issuedAt);

  return {
    credential_id: credentialId,
    business_id: businessId,
    issuer: 'marketplace_mock',
    type: 'order_history',
    claim,
    issued_at: issuedAt,
    expires_at: expiresAt,
    signature,
    status: 'valid',
  };
}
