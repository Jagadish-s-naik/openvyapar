import crypto from 'node:crypto';
import type { Credential, BankIncomeClaimPayload } from '@openvyapar/shared';
import { signCredential } from '../utils/crypto.js';

export function issueMockBankCredential(
  businessId: string,
  overrides?: Partial<BankIncomeClaimPayload>
): Credential {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const claim: BankIncomeClaimPayload = {
    bank_name: 'State Bank of India (Godowlia Branch)',
    account_category: 'current',
    turnover_bracket: '25L_to_50L',
    average_monthly_balance_tier: 'tier_1',
    active_loan_default: false,
    relationship_tenure_months: 36,
    ...overrides,
  };

  const credentialId = `cred-bank-${crypto.randomUUID().slice(0, 8)}`;
  const signature = signCredential(businessId, 'bank_mock', 'income_bracket', claim, issuedAt);

  return {
    credential_id: credentialId,
    business_id: businessId,
    issuer: 'bank_mock',
    type: 'income_bracket',
    claim,
    issued_at: issuedAt,
    expires_at: expiresAt,
    signature,
    status: 'valid',
  };
}
