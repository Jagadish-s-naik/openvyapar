/**
 * Mock Credential Issuers & Trust Metadata
 */

import type { IssuerType } from '../types/credential.js';

export interface IssuerInfo {
  id: IssuerType;
  name_en: string;
  name_hi: string;
  name_kn: string;
  authority_type: 'government' | 'banking_partner' | 'e_commerce' | 'field_agent';
  badge_color: string;
  icon_name: string;
  verification_endpoint: string;
  signing_algorithm: 'HMAC-SHA256';
}

export const ISSUER_REGISTRY: Record<IssuerType, IssuerInfo> = {
  gst_mock: {
    id: 'gst_mock',
    name_en: 'Goods & Services Tax Network (Mock GSTN)',
    name_hi: 'वस्तु एवं सेवा कर नेटवर्क (जीएसटीएन)',
    name_kn: 'ಸರಕು ಮತ್ತು ಸೇವಾ ತೆರಿಗೆ ಜಾಲ (ಜಿಎಸ್‌ಟಿ)',
    authority_type: 'government',
    badge_color: '#0284c7', // Sky blue
    icon_name: 'building-library',
    verification_endpoint: '/backend/mocks/gst',
    signing_algorithm: 'HMAC-SHA256',
  },
  bank_mock: {
    id: 'bank_mock',
    name_en: 'State Lead Banking Mock (SBI/Union)',
    name_hi: 'राज्य प्रमुख बैंकिंग नेटवर्क',
    name_kn: 'ರಾಜ್ಯ ಪ್ರಮುಖ ಬ್ಯಾಂಕಿಂಗ್ ಜಾಲ',
    authority_type: 'banking_partner',
    badge_color: '#059669', // Emerald green
    icon_name: 'banknotes',
    verification_endpoint: '/backend/mocks/bank',
    signing_algorithm: 'HMAC-SHA256',
  },
  marketplace_mock: {
    id: 'marketplace_mock',
    name_en: 'Open E-Commerce / ONDC Mock (BharatMart)',
    name_hi: 'भारत ई-कॉमर्स / ओएनडीसी नेटवर्क',
    name_kn: 'ಭಾರತ ಇ-ಕಾಮರ್ಸ್ / ಒಎನ್‌ಡಿಸಿ ಜಾಲ',
    authority_type: 'e_commerce',
    badge_color: '#d97706', // Amber
    icon_name: 'shopping-bag',
    verification_endpoint: '/backend/mocks/marketplace',
    signing_algorithm: 'HMAC-SHA256',
  },
  agent_witnessed: {
    id: 'agent_witnessed',
    name_en: 'CSC Field Agent Attestation (Common Service Center)',
    name_hi: 'सीएससी फील्ड एजेंट सत्यापन',
    name_kn: 'ಸಿಎಸ್‌ಸಿ ಕ್ಷೇತ್ರ ಏಜೆಂಟ್ ದೃಢೀಕರಣ',
    authority_type: 'field_agent',
    badge_color: '#7c3aed', // Purple
    icon_name: 'user-group',
    verification_endpoint: '/backend/mocks/csc',
    signing_algorithm: 'HMAC-SHA256',
  },
};
