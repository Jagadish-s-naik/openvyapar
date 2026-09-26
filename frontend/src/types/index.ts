import type {
  Business,
  Credential,
  DelegationToken,
  TimelineEvent,
  Person,
  ProofShare,
} from '@openvyapar/shared';

export type Language = 'EN' | 'HI' | 'KN';

export type ConnectedService = {
  id: string;
  name: string;
  category?: string;
  accentColor: string;
  connectedSince?: string;
  accessScope: string[];
  status?: 'active' | 'disconnected';
};

export type Consent = {
  id: string;
  requestedBy: string;
  purpose: string;
  dataItems: string[];
  status: 'pending' | 'approved' | 'denied' | 'revoked';
  grantedAt?: string;
  expiresAt?: string;
};

export type AppState = {
  // Business Context
  businessId: string;
  business: Business | null;
  businessName: string;
  tradeName?: string;
  legalEntity?: string;
  ownerPersonId?: string;

  // Active Personas & Current Session
  personas: Person[];
  currentPersona: Person | null;

  // Core Data Collections
  credentials: Credential[];
  delegations: DelegationToken[];
  timeline: TimelineEvent[];
  connectedServices: ConnectedService[];
  activeProofShares: ProofShare[];

  // App UI State
  language: Language;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  isMobileSimulator: boolean;

  // Actions
  setLanguage: (lang: Language) => void;
  toggleMobileSimulator: () => void;
  setBusinessId: (id: string) => Promise<void>;
  loadAllData: (businessId?: string) => Promise<void>;
  
  // Beat 2: Fast-forward time / Issue Batch & Upload
  issueBatchCredentials: (templateProfile?: string) => Promise<Credential[]>;
  uploadAndIssueCredential: (params: {
    issuer: string;
    type: string;
    claim: Record<string, any>;
  }) => Promise<Credential>;

  // Beat 3: Selective Disclosure & Proof Generation
  createSelectiveProof: (params: {
    purpose: string;
    disclosedCredentialIds: string[];
    sharedWith: string;
    agentActionId?: string;
  }) => Promise<{ proof: ProofShare; verificationUrl: string }>;

  // Beat 4: Scoped CA Delegation
  grantScopedDelegation: (params: {
    delegatePersonId: string;
    scopes: string[];
    agentActionId?: string;
  }) => Promise<DelegationToken>;
  revokeDelegationToken: (tokenId: string) => Promise<DelegationToken>;

  // Beat 5: Succession Role Transfer
  transferRole: (params: {
    personId: string;
    roleType: 'owner' | 'manager' | 'ca_accountant' | 'csc_agent' | 'staff';
  }) => Promise<any>;

  // External Connected Services UI simulation
  connectService: (service: { name: string; category?: string; accessScope: string[]; accentColor?: string }) => void;
};
