import type {
  MockBatchTemplate,
  GstClaimPayload,
  BankIncomeClaimPayload,
  MarketplaceClaimPayload,
} from '@openvyapar/shared';

export interface BatchTemplateConfig {
  name: MockBatchTemplate;
  description: string;
  gst: Partial<GstClaimPayload>;
  bank: Partial<BankIncomeClaimPayload>;
  marketplace: Partial<MarketplaceClaimPayload>;
}

export const MOCK_BATCH_TEMPLATES: Record<MockBatchTemplate, BatchTemplateConfig> = {
  standard_healthy: {
    name: 'standard_healthy',
    description: '100% compliance on-time returns, active compliance score 98, tier 1 balance, 1,420 ONDC orders with 4.8 rating.',
    gst: {
      filing_status_last_6_months: 'all_on_time',
      active_compliance_score: 98,
      registration_date: '2021-04-10',
    },
    bank: {
      bank_name: 'State Bank of India (Godowlia Branch)',
      account_category: 'current',
      turnover_bracket: '25L_to_50L',
      average_monthly_balance_tier: 'tier_1',
      active_loan_default: false,
      relationship_tenure_months: 36,
    },
    marketplace: {
      platform_name: 'BharatMart ONDC Network Seller',
      total_completed_orders: 1420,
      customer_satisfaction_rating: 4.8,
      fulfillment_rate_pct: 99.2,
      active_months: 18,
      dispute_rate_pct: 0.3,
    },
  },

  gst_defaulter: {
    name: 'gst_defaulter',
    description: 'Missed GST returns, active compliance score 42, tier 3 bank balance, lower marketplace rating.',
    gst: {
      filing_status_last_6_months: 'defaulter',
      active_compliance_score: 42,
      registration_date: '2021-04-10',
      last_return_filed: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    },
    bank: {
      bank_name: 'State Bank of India (Godowlia Branch)',
      account_category: 'current',
      turnover_bracket: '10L_to_25L',
      average_monthly_balance_tier: 'tier_3',
      active_loan_default: false,
      relationship_tenure_months: 12,
    },
    marketplace: {
      platform_name: 'BharatMart ONDC Network Seller',
      total_completed_orders: 310,
      customer_satisfaction_rating: 3.9,
      fulfillment_rate_pct: 85.0,
      active_months: 6,
      dispute_rate_pct: 4.5,
    },
  },

  high_growth_merchant: {
    name: 'high_growth_merchant',
    description: 'High-growth merchant with >5,000 ONDC orders, 4.9 rating, 100% GST compliance, and high turnover.',
    gst: {
      filing_status_last_6_months: 'all_on_time',
      active_compliance_score: 100,
      registration_date: '2020-01-15',
    },
    bank: {
      bank_name: 'State Bank of India (Godowlia Branch)',
      account_category: 'current',
      turnover_bracket: '50L_to_1Cr',
      average_monthly_balance_tier: 'tier_1',
      active_loan_default: false,
      relationship_tenure_months: 48,
    },
    marketplace: {
      platform_name: 'BharatMart ONDC Network Seller',
      total_completed_orders: 5430,
      customer_satisfaction_rating: 4.9,
      fulfillment_rate_pct: 99.8,
      active_months: 24,
      dispute_rate_pct: 0.1,
    },
  },
};
