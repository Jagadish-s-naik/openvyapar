import { create } from 'zustand';
import type { AppState, AuditEvent, Consent, Credential, ConnectedService, Language } from '../types';

const BACKEND_URL = 'http://localhost:3001';

const INITIAL_CREDENTIALS: Credential[] = [
  {
    id: 'cred-udyam-01',
    type: 'Udyam MSME Registration',
    issuer: 'Ministry of MSME, Govt of India',
    issuedOn: '14 May 2023',
    expiresOn: 'Perpetual',
    status: 'active',
    docNumber: 'UDYAM-KR-03-0094812',
    rawType: 'self_attested',
    claim: {
      business_nature: 'Retail Garments & Textiles',
      established_year: 2018,
      approx_monthly_revenue: '₹2,50,000',
    },
  },
  {
    id: 'cred-gstin-02',
    type: 'GST Compliance Certificate',
    issuer: 'Goods and Services Tax Network (GSTN)',
    issuedOn: '01 Jan 2024',
    expiresOn: '31 Dec 2025',
    status: 'active',
    docNumber: '29AABCU9603R1ZM',
    rawType: 'gst_compliant',
    claim: {
      gstin: '29AABCU9603R1ZM',
      legal_name: 'Sri Lakshmi Textiles',
      active_compliance_score: 98,
      filing_status_last_6_months: 'all_on_time',
    },
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
    scope: ['view_compliance', 'view_banking'],
  },
  {
    id: 'cst-ondc-104',
    requestedBy: 'ONDC Seller Node (Mystore)',
    purpose: 'Merchant Onboarding & GST Verified Badge',
    dataItems: ['GST Compliance Certificate', 'Trade Name & Registered Address'],
    status: 'pending',
    grantedAt: undefined,
    expiresAt: '30 days after grant',
    scope: ['view_compliance'],
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
    accentColor: '#1d4ed8',
    connectedSince: 'Sep 18, 2024',
    accessScope: ['GST Compliance Credential', 'Udyam Registration Certificate'],
    status: 'active',
  },
  {
    id: 'srv-ondc',
    name: 'ONDC Open Marketplace',
    category: 'Digital Commerce Network',
    accentColor: '#059669',
    connectedSince: 'Aug 10, 2024',
    accessScope: ['Verified Business ID & QR', 'GST Registered Trade Name'],
    status: 'active',
  },
  {
    id: 'srv-gem',
    name: 'GeM Public Procurement Portal',
    category: 'Government Vendor Scheme',
    accentColor: '#b45309',
    connectedSince: 'Jul 28, 2024',
    accessScope: ['Udyam MSME Category', 'Taxpayer Entity Attestation'],
    status: 'active',
  },
];

function formatIssuerName(issuer: string): string {
  switch (issuer) {
    case 'gst_mock': return 'Goods and Services Tax Network (GSTN)';
    case 'bank_mock': return 'State Bank of India (MSME Desk)';
    case 'marketplace_mock': return 'ONDC Open Commerce Protocol';
    case 'agent_witnessed': return 'CSC Digital Seva (Field Witnessed)';
    default: return issuer || 'Sovereign DPI Authority';
  }
}

function formatCredentialTitle(type: string): string {
  switch (type) {
    case 'gst_compliant': return 'GST Compliance Certificate';
    case 'filing_history': return 'GST 24-Month Filing Ledger';
    case 'income_bracket': return 'Banking & Turnover Attestation';
    case 'order_history': return 'ONDC Merchant Performance Pass';
    case 'self_attested': return 'Sovereign Business Attestation';
    default: return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  businessId: 'OV-4471',
  businessName: 'Sri Lakshmi Textiles & Apparels',
  tradeName: 'Sri Lakshmi Textiles',
  legalEntity: 'Proprietorship / Micro Enterprise',
  language: 'EN',
  isSyncing: false,
  lastSyncTime: undefined,
  setLanguage: (lang: Language) => set({ language: lang }),
  credentials: INITIAL_CREDENTIALS,
  consents: INITIAL_CONSENTS,
  auditLog: INITIAL_AUDIT_LOG,
  connectedServices: INITIAL_SERVICES,

  syncLiveBackend: async () => {
    set({ isSyncing: true });
    try {
      const bizRes = await fetch(`${BACKEND_URL}/business/did:biz:sharma001`).catch(() => null);
      if (bizRes && bizRes.ok) {
        const bizData = await bizRes.json();
        if (bizData.success && bizData.business) {
          set({
            businessId: bizData.business.business_id,
            businessName: bizData.business.name,
            tradeName: (bizData.business.metadata?.trade_name as string) || bizData.business.name,
            legalEntity: `${bizData.business.metadata?.sector || 'MSME'} · ${bizData.business.metadata?.location || 'India'}`,
          });
        }
      }

      // 1. Fetch live credentials
      const credsRes = await fetch(`${BACKEND_URL}/credentials/did:biz:sharma001`).catch(() => null);
      if (credsRes && credsRes.ok) {
        const credsData = await credsRes.json();
        if (credsData.success && Array.isArray(credsData.credentials) && credsData.credentials.length > 0) {
          interface RawBackendCred {
            credential_id: string;
            type: string;
            issuer: string;
            issued_at?: string;
            expires_at?: string;
            status?: string;
            claim?: Record<string, unknown>;
            signature?: string;
          }
          const mapped: Credential[] = credsData.credentials.map((c: RawBackendCred) => ({
            id: c.credential_id,
            type: formatCredentialTitle(c.type),
            rawType: c.type,
            issuer: formatIssuerName(c.issuer),
            issuedOn: c.issued_at ? new Date(c.issued_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 Jan 2024',
            expiresOn: c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Perpetual',
            status: (c.status === 'revoked' ? 'revoked' : 'active') as 'active' | 'revoked',
            docNumber: (c.claim?.gstin as string) || (c.claim?.seller_id as string) || (c.claim?.udyam_reg_no as string) || `OV-${c.credential_id.slice(0, 8)}`,
            claim: c.claim || {},
            signature: c.signature,
          }));
          set({ credentials: mapped });
        }
      }

      // 2. Fetch live timeline / audit log
      const auditRes = await fetch(`${BACKEND_URL}/audit/did:biz:sharma001/timeline`).catch(() => null);
      if (auditRes && auditRes.ok) {
        const auditData = await auditRes.json();
        if (auditData.success && Array.isArray(auditData.timeline) && auditData.timeline.length > 0) {
          interface RawAuditItem {
            event_id: string;
            actor: string;
            action: string;
            timestamp?: string;
            metadata?: { consent_id?: string };
          }
          const mappedAudit: AuditEvent[] = auditData.timeline.map((a: RawAuditItem) => ({
            id: a.event_id,
            actor: a.actor || 'OpenVyapar Protocol Node',
            action: a.action,
            consentId: a.metadata?.consent_id || 'system-attest',
            timestamp: a.timestamp ? a.timestamp.replace('T', ' ').slice(0, 19) : new Date().toISOString().slice(0, 19),
          }));
          set({ auditLog: mappedAudit });
        }
      }

      set({ lastSyncTime: new Date().toLocaleTimeString() });
    } catch (err) {
      console.warn('Backend sync note: operating with resilient cached baseline state', err);
    } finally {
      set({ isSyncing: false });
    }
  },

  triggerTimeSkip: async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/mocks/time-skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: get().businessId || 'did:biz:sharma001' }),
      });
      const data = await res.json();
      if (data.success) {
        await get().syncLiveBackend();
        return { success: true, message: `Batch issued ${data.issued_credentials?.length || 3} fresh credentials across GST, Bank, and ONDC registries!` };
      }
      return { success: false, message: data.error || 'Failed to trigger batch issuance' };
    } catch {
      // Local fallback simulation
      const newCred: Credential = {
        id: `cred-batch-${Date.now().toString().slice(-6)}`,
        type: 'GST Quarterly Return (Q3)',
        issuer: 'Goods and Services Tax Network (GSTN)',
        issuedOn: 'Just now',
        expiresOn: '31 Dec 2026',
        status: 'active',
        docNumber: `29AABCU9603R${Math.floor(100 + Math.random() * 900)}`,
        claim: { turnover: '₹4,80,000', score: 99 },
      };
      set((state) => ({
        credentials: [newCred, ...state.credentials],
        auditLog: [
          {
            id: `aud-${Date.now().toString().slice(-4)}`,
            actor: 'GSTN Gateway Protocol',
            action: 'Cryptographic Credential Attestation Refreshed via Batch Time-Skip',
            consentId: 'system-batch',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          },
          ...state.auditLog,
        ],
      }));
      return { success: true, message: 'Time-skip executed locally with new quarterly credential attestation.' };
    }
  },

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
