import { create } from 'zustand';
import type { AppState, ConnectedService, Language } from '../types';
import * as api from '../api/client';
import type { Business, Credential, DelegationToken, TimelineEvent, Person } from '@openvyapar/shared';

const INITIAL_SERVICES: ConnectedService[] = [
  {
    id: 'srv-sbi',
    name: 'State Bank of India — MSME Sahay',
    category: 'Institutional Credit',
    accentColor: '#1d4ed8',
    connectedSince: 'Active Session',
    accessScope: ['GST Compliance Credential', 'Turnover Bracket Credential'],
    status: 'active',
  },
  {
    id: 'srv-ondc',
    name: 'ONDC Open Marketplace (BharatMart)',
    category: 'Digital Commerce Network',
    accentColor: '#059669',
    connectedSince: 'Active Session',
    accessScope: ['Verified Business ID & QR', 'Order History & Fulfilment Score'],
    status: 'active',
  },
  {
    id: 'srv-gstn',
    name: 'Goods and Services Tax Network (GSTN)',
    category: 'Sovereign Tax Authority',
    accentColor: '#b45309',
    connectedSince: 'Active Session',
    accessScope: ['Tax Compliance Attestation', 'Filing Records'],
    status: 'active',
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  businessId: 'did:biz:sharma001',
  business: null,
  businessName: 'Sharma General Store',
  tradeName: 'Sharma General Store',
  legalEntity: 'Proprietorship / Micro Enterprise',
  ownerPersonId: 'did:person:ramesh001',

  personas: [],
  currentPersona: null,

  credentials: [],
  delegations: [],
  timeline: [],
  connectedServices: INITIAL_SERVICES,
  activeProofShares: [],

  language: 'EN',
  isLoading: false,
  isSyncing: false,
  error: null,

  setLanguage: (lang: Language) => set({ language: lang }),

  setBusinessId: async (id: string) => {
    set({ businessId: id });
    await get().loadAllData(id);
  },

  loadAllData: async (targetBizId?: string) => {
    const bizId = targetBizId || get().businessId || 'did:biz:sharma001';
    set({ isSyncing: true, error: null });

    try {
      const [bizRes, credsRes, delegRes, timeRes, personasRes] = await Promise.allSettled([
        api.getBusiness(bizId),
        api.getCredentials(bizId),
        api.getDelegations(bizId),
        api.getAuditTimeline(bizId),
        api.getPersonas(),
      ]);

      let businessData: Business | null = null;
      let credentialsData: Credential[] = [];
      let delegationsData: DelegationToken[] = [];
      let timelineData: TimelineEvent[] = [];
      let personasData: Person[] = [];

      if (bizRes.status === 'fulfilled' && bizRes.value.success) {
        businessData = bizRes.value.business;
      }
      if (credsRes.status === 'fulfilled' && credsRes.value.success) {
        credentialsData = credsRes.value.credentials;
      }
      if (delegRes.status === 'fulfilled' && delegRes.value.success) {
        delegationsData = delegRes.value.tokens;
      }
      if (timeRes.status === 'fulfilled' && timeRes.value.success) {
        timelineData = timeRes.value.timeline;
      }
      if (personasRes.status === 'fulfilled' && personasRes.value.success) {
        personasData = personasRes.value.personas;
      }

      const currentPersona = personasData.find((p) => p.person_id === 'did:person:ramesh001') || personasData[0] || null;

      set({
        business: businessData,
        businessName: businessData?.name || 'Sharma General Store',
        tradeName: businessData?.name || 'Sharma General Store',
        legalEntity: (businessData?.metadata?.sector as string) || 'Retail Grocery & Essentials',
        ownerPersonId: 'did:person:ramesh001',
        credentials: credentialsData,
        delegations: delegationsData,
        timeline: timelineData,
        personas: personasData,
        currentPersona,
        isSyncing: false,
      });
    } catch (err: unknown) {
      set({
        error: (err as Error)?.message || 'Failed to sync with OpenVyapar backend on port 3000',
        isSyncing: false,
      });
    }
  },

  issueBatchCredentials: async (templateProfile?: string) => {
    const bizId = get().businessId;
    set({ isSyncing: true });
    try {
      const res = await api.triggerBatchIssuance(bizId, templateProfile);
      if (res.success) {
        await get().loadAllData(bizId);
        return res.credentials;
      }
      return [];
    } finally {
      set({ isSyncing: false });
    }
  },

  uploadAndIssueCredential: async (params: {
    issuer: string;
    type: string;
    claim: Record<string, unknown>;
  }) => {
    const bizId = get().businessId;
    set({ isSyncing: true });
    try {
      const res = await api.issueCredential({
        business_id: bizId,
        issuer: params.issuer,
        type: params.type,
        claim: params.claim,
      });
      if (res.success) {
        await get().loadAllData(bizId);
        return res.credential;
      }
      throw new Error('Failed to issue credential from document');
    } finally {
      set({ isSyncing: false });
    }
  },

  createSelectiveProof: async (params) => {
    const bizId = get().businessId;
    const res = await api.generateProof({
      business_id: bizId,
      purpose: params.purpose,
      disclosed_credential_ids: params.disclosedCredentialIds,
      shared_with: params.sharedWith,
      agent_action_id: params.agentActionId,
      generated_by: get().ownerPersonId || 'did:person:ramesh001',
    });

    if (res.success) {
      await get().loadAllData(bizId);
      set((state) => ({
        activeProofShares: [res.proof, ...state.activeProofShares],
      }));
      return { proof: res.proof, verificationUrl: res.verification_url };
    }
    throw new Error('Failed to generate selective disclosure proof');
  },

  grantScopedDelegation: async (params) => {
    const bizId = get().businessId;
    const res = await api.grantDelegation({
      business_id: bizId,
      delegate_person_id: params.delegatePersonId,
      scopes: params.scopes,
      agent_action_id: params.agentActionId,
      granted_by: get().ownerPersonId || 'did:person:ramesh001',
    });

    if (res.success) {
      await get().loadAllData(bizId);
      return res.token;
    }
    throw new Error('Failed to grant scoped delegation');
  },

  revokeDelegationToken: async (tokenId: string) => {
    const bizId = get().businessId;
    const res = await api.revokeDelegation({
      business_id: bizId,
      token_id: tokenId,
      revoked_by: get().ownerPersonId || 'did:person:ramesh001',
    });

    if (res.success) {
      await get().loadAllData(bizId);
      return res.token;
    }
    throw new Error('Failed to revoke delegation token');
  },

  transferRole: async (params) => {
    const bizId = get().businessId;
    const res = await api.transferOwnership({
      business_id: bizId,
      person_id: params.personId,
      role_type: params.roleType,
      granted_by: get().ownerPersonId || 'did:person:ramesh001',
    });

    if (res.success) {
      await get().loadAllData(bizId);
      return res.role;
    }
    throw new Error('Failed to transfer business ownership role');
  },

  connectService: ({ name, category = 'DPI Network Participant', accessScope, accentColor = '#4f46e5' }) => {
    const id = `srv-${Date.now().toString().slice(-4)}`;
    const newService: ConnectedService = {
      id,
      name,
      category,
      accentColor,
      connectedSince: 'Today',
      accessScope,
      status: 'active',
    };

    set((state) => ({
      connectedServices: [newService, ...state.connectedServices],
    }));
  },
}));
