import type {
  Business,
  Person,
  BusinessRole,
  Credential,
  DelegationToken,
  ProofShare,
  AuditLog,
  AgentAction,
} from '@openvyapar/shared';

export interface DatabaseState {
  businesses: Record<string, Business>;
  persons: Record<string, Person>;
  business_roles: Record<string, BusinessRole>;
  credentials: Record<string, Credential>;
  delegation_tokens: Record<string, DelegationToken>;
  proof_shares: Record<string, ProofShare>;
  audit_logs: Record<string, AuditLog>;
  agent_actions: Record<string, AgentAction>;
}

export interface SnapshotMetadata {
  snapshot_id: string;
  name: string;
  description?: string;
  created_at: string;
  record_counts: Record<string, number>;
}

export interface IDatabaseAdapter {
  // Lifecycle & Diagnostics
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  reset(): Promise<void> | void;
  getStats(): Promise<Record<string, number>> | Record<string, number>;
  getState(): Promise<DatabaseState> | DatabaseState;
  setState(state: DatabaseState): Promise<void> | void;

  // Snapshots
  createSnapshot(name?: string, description?: string): Promise<SnapshotMetadata> | SnapshotMetadata;
  listSnapshots(): Promise<SnapshotMetadata[]> | SnapshotMetadata[];
  restoreSnapshot(
    snapshotIdOrName: string
  ): Promise<{ success: boolean; snapshot?: SnapshotMetadata; error?: string }> | { success: boolean; snapshot?: SnapshotMetadata; error?: string };
  deleteSnapshot(snapshotIdOrName: string): Promise<boolean> | boolean;

  // Businesses
  getBusiness(businessId: string): Promise<Business | null> | Business | null;
  getAllBusinesses(): Promise<Business[]> | Business[];
  setBusiness(business: Business): Promise<Business> | Business;

  // Persons
  getPerson(personId: string): Promise<Person | null> | Person | null;
  getAllPersons(): Promise<Person[]> | Person[];
  setPerson(person: Person): Promise<Person> | Person;

  // Business Roles
  getRolesForBusiness(businessId: string): Promise<BusinessRole[]> | BusinessRole[];
  getAllRolesForBusiness(businessId: string): Promise<BusinessRole[]> | BusinessRole[];
  getRolesForPerson(personId: string): Promise<BusinessRole[]> | BusinessRole[];
  setBusinessRole(role: BusinessRole): Promise<BusinessRole> | BusinessRole;

  // Credentials
  getCredentialsForBusiness(businessId: string): Promise<Credential[]> | Credential[];
  getCredentialById(credentialId: string): Promise<Credential | null> | Credential | null;
  setCredential(credential: Credential): Promise<Credential> | Credential;

  // Delegation Tokens
  getDelegationsForBusiness(businessId: string): Promise<DelegationToken[]> | DelegationToken[];
  getActiveDelegation(
    businessId: string,
    delegatePersonId: string
  ): Promise<DelegationToken | null> | DelegationToken | null;
  getDelegationById(tokenId: string): Promise<DelegationToken | null> | DelegationToken | null;
  setDelegationToken(token: DelegationToken): Promise<DelegationToken> | DelegationToken;

  // Proof Shares
  getProofShare(proofId: string): Promise<ProofShare | null> | ProofShare | null;
  setProofShare(proof: ProofShare): Promise<ProofShare> | ProofShare;

  // Audit Logs
  getAuditLogsForBusiness(businessId: string): Promise<AuditLog[]> | AuditLog[];
  addAuditLog(log: AuditLog): Promise<AuditLog> | AuditLog;

  // Agent Actions
  getAgentAction(actionId: string): Promise<AgentAction | null> | AgentAction | null;
  getAgentActionsForBusiness(businessId: string): Promise<AgentAction[]> | AgentAction[];
  setAgentAction(action: AgentAction): Promise<AgentAction> | AgentAction;
}
