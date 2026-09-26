import { create } from 'zustand';
import type { AppState, AuditEvent, Consent, Credential, ConnectedService, Language } from '../types';

const INITIAL_CREDENTIALS: Credential[] = [
  {
    id: 'cred-udyam-01',
    type: 'Udyam MSME Registration',
    issuer: 'Ministry of MSME, Govt of India',
    issuedOn: '14 May 2023',
    expiresOn: 'Perpetual',
    status: 'active',
    docNumber: 'UDYAM-KR-03-0094812',
  },
  {
    id: 'cred-gstin-02',
    type: 'GST Compliance Certificate',
    issuer: 'Goods and Services Tax Network (GSTN)',
    issuedOn: '01 Jan 2024',
    expiresOn: '31 Dec 2025',
    status: 'active',
    docNumber: '29AABCU9603R1ZM',
  },
];

const INITIAL_CONSENTS: Consent[] = [
  {
    id: 'cst-sbi-991',
    requestedBy: 'State Bank of India — MSME Sahay',
    purpose: 'Underwriting Working Capital Credit Line (₹15L)',
    dataItems: ['GST Compliance (24 months)', 'Udyam Certificate', 'Bank Statements Summary'],
    status: 'approved',
    grantedAt: '2024-09-18 10:30 AM',
    expiresAt: '2024-12-18 11:59 PM',
  },
  {
    id: 'cst-ondc-104',
    requestedBy: 'ONDC Seller Node (Mystore)',
    purpose: 'Merchant Onboarding & GST Verified Badge',
    dataItems: ['GST Compliance Certificate', 'Trade Name & Registered Address'],
    status: 'pending',
    grantedAt: undefined,
    expiresAt: '30 days after grant',
  },
];

const INITIAL_AUDIT_LOG: AuditEvent[] = [
  {
    id: 'aud-8801',
    actor: 'State Bank of India — MSME Sahay',
    action: 'Accessed GST Compliance Certificate (Hash: #a98f...e10)',
    consentId: 'cst-sbi-991',
    timestamp: '2024-09-22 14:15:02',
  },
  {
    id: 'aud-8802',
    actor: 'Sri Lakshmi Textiles (Self)',
    action: 'Granted consent for MSME Working Capital Underwriting',
    consentId: 'cst-sbi-991',
    timestamp: '2024-09-18 10:30:44',
  },
  {
    id: 'aud-8803',
    actor: 'ONDC Seller Node (Mystore)',
    action: 'Initiated Consent Request for Merchant Onboarding',
    consentId: 'cst-ondc-104',
    timestamp: '2024-09-23 08:12:11',
  },
  {
    id: 'aud-8804',
    actor: 'GSTN Gateway Protocol',
    action: 'Cryptographic Credential Attestation Refreshed',
    consentId: 'system-attest',
    timestamp: '2024-09-01 00:00:00',
  },
];

const INITIAL_SERVICES: ConnectedService[] = [
  {
    id: 'srv-sbi',
    name: 'SBI MSME Sahay (Loan App)',
    category: 'Institutional Credit',
    accentColor: '#1d4ed8', // Royal Rail Blue
    connectedSince: 'Sep 18, 2024',
    accessScope: ['GST Compliance Credential', 'Udyam Registration Certificate'],
    status: 'active',
  },
  {
    id: 'srv-ondc',
    name: 'ONDC Open Marketplace',
    category: 'Digital Commerce Network',
    accentColor: '#059669', // Emerald Network Green
    connectedSince: 'Aug 10, 2024',
    accessScope: ['Verified Business ID & QR', 'GST Registered Trade Name'],
    status: 'active',
  },
  {
    id: 'srv-gem',
    name: 'GeM Public Procurement Portal',
    category: 'Government Vendor Scheme',
    accentColor: '#b45309', // Amber / Govt Seal Ochre
    connectedSince: 'Jul 28, 2024',
    accessScope: ['Udyam MSME Category', 'Taxpayer Entity Attestation'],
    status: 'active',
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  businessId: 'OV-4471',
  businessName: 'Sri Lakshmi Textiles & Apparels',
  tradeName: 'Sri Lakshmi Textiles',
  legalEntity: 'Proprietorship / Micro Enterprise',
  language: 'EN',
  setLanguage: (lang: Language) => set({ language: lang }),
  credentials: INITIAL_CREDENTIALS,
  consents: INITIAL_CONSENTS,
  auditLog: INITIAL_AUDIT_LOG,
  connectedServices: INITIAL_SERVICES,

  approveConsent: (id: string) => {
    const consent = get().consents.find((c) => c.id === id);
    if (!consent) return;

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    const newAudit: AuditEvent = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      actor: 'Business Owner (Authorized via OTP)',
      action: `Approved consent request for ${consent.requestedBy}`,
      consentId: id,
      timestamp: formattedDate,
    };

    set((state) => ({
      consents: state.consents.map((c) =>
        c.id === id ? { ...c, status: 'approved', grantedAt: formattedDate } : c
      ),
      auditLog: [newAudit, ...state.auditLog],
    }));
  },

  denyConsent: (id: string) => {
    const consent = get().consents.find((c) => c.id === id);
    if (!consent) return;

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    const newAudit: AuditEvent = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      actor: 'Business Owner',
      action: `Explicitly denied consent request from ${consent.requestedBy}`,
      consentId: id,
      timestamp: formattedDate,
    };

    set((state) => ({
      consents: state.consents.map((c) =>
        c.id === id ? { ...c, status: 'denied' } : c
      ),
      auditLog: [newAudit, ...state.auditLog],
    }));
  },

  revokeConsent: (id: string) => {
    const consent = get().consents.find((c) => c.id === id);
    if (!consent) return;

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    const newAudit: AuditEvent = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      actor: 'Business Owner (Revocation Triggered)',
      action: `Revoked access token and invalidated keys for ${consent.requestedBy}`,
      consentId: id,
      timestamp: formattedDate,
    };

    set((state) => ({
      consents: state.consents.map((c) =>
        c.id === id ? { ...c, status: 'revoked' } : c
      ),
      auditLog: [newAudit, ...state.auditLog],
    }));
  },

  connectService: ({ name, category = 'DPI Network Participant', accessScope, accentColor = '#4f46e5' }) => {
    const id = `srv-${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    const newService: ConnectedService = {
      id,
      name,
      category,
      accentColor,
      connectedSince: 'Today',
      accessScope,
      status: 'active',
    };

    const newAudit: AuditEvent = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      actor: name,
      action: `Established new protocol connection: [Scope: ${accessScope.join(', ')}]`,
      consentId: id,
      timestamp: formattedDate,
    };

    set((state) => ({
      connectedServices: [newService, ...state.connectedServices],
      auditLog: [newAudit, ...state.auditLog],
    }));
  },
}));
