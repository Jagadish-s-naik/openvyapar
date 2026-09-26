export type Credential = {
  id: string;
  type: string;
  issuer: string;
  issuedOn: string;
  expiresOn: string;
  status: 'active' | 'revoked' | 'expired';
  docNumber?: string;
  claim?: Record<string, unknown>;
  signature?: string;
  rawType?: string;
};

export type Consent = {
  id: string;
  requestedBy: string;
  purpose: string;
  dataItems: string[];
  status: 'pending' | 'approved' | 'denied' | 'revoked';
  grantedAt?: string;
  expiresAt?: string;
  scope?: string[];
  delegatePersonId?: string;
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  consentId: string;
  timestamp: string;
};

export type ConnectedService = {
  id: string;
  name: string;
  category?: string;
  accentColor: string;
  connectedSince?: string;
  accessScope: string[];
  status?: 'active' | 'disconnected';
};

export type Language = 'EN' | 'HI' | 'KN';

export type AppState = {
  businessId: string;
  businessName: string;
  tradeName?: string;
  legalEntity?: string;
  language: Language;
  isSyncing: boolean;
  lastSyncTime?: string;
  setLanguage: (lang: Language) => void;
  credentials: Credential[];
  consents: Consent[];
  auditLog: AuditEvent[];
  connectedServices: ConnectedService[];
  approveConsent: (id: string) => void;
  denyConsent: (id: string) => void;
  revokeConsent: (id: string) => void;
  connectService: (service: { name: string; category?: string; accessScope: string[]; accentColor?: string }) => void;
  syncLiveBackend: () => Promise<void>;
  triggerTimeSkip: () => Promise<{ success: boolean; message: string }>;
};
