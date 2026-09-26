import personasData from './personas.json';
import businessesData from './businesses.json';
import credentialsData from './credentials.json';
import delegationTokensData from './delegation-tokens.json';
import proofSharesData from './proof-shares.json';
import auditLogsData from './audit-logs.json';

import type { Business, Person } from '../types/business.js';
import type { Credential } from '../types/credential.js';
import type { DelegationToken } from '../types/delegation.js';
import type { ProofShare } from '../types/proof.js';
import type { AuditLog } from '../types/audit.js';

export const mockPersonas: Person[] = personasData as Person[];
export const mockBusinesses: Business[] = businessesData as Business[];
export const mockCredentials: Credential[] = credentialsData as Credential[];
export const mockDelegationTokens: DelegationToken[] = delegationTokensData as DelegationToken[];
export const mockProofShares: ProofShare[] = proofSharesData as ProofShare[];
export const mockAuditLogs: AuditLog[] = auditLogsData as AuditLog[];

export {
  personasData,
  businessesData,
  credentialsData,
  delegationTokensData,
  proofSharesData,
  auditLogsData,
};
