import { config } from '../config.js';
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
import type { IDatabaseAdapter, DatabaseState, SnapshotMetadata } from './adapter.js';
import { MemoryDatabaseManager } from './memory-adapter.js';
import { MongoDatabaseManager } from './mongo-adapter.js';
import { getMongoStatus } from './mongo.js';

export * from './adapter.js';
export { MemoryDatabaseManager } from './memory-adapter.js';
export { MongoDatabaseManager } from './mongo-adapter.js';

const memoryInstance = new MemoryDatabaseManager();
const mongoInstance = new MongoDatabaseManager();

let currentEngine: 'mongo' | 'memory' = 'memory';

/**
 * Initialize and select active database adapter.
 */
export async function initDatabase(engine?: 'mongo' | 'memory'): Promise<IDatabaseAdapter> {
  const targetEngine = engine || (config.mongodb.isEnabled ? 'mongo' : 'memory');

  if (targetEngine === 'mongo') {
    try {
      await mongoInstance.connect();
      currentEngine = 'mongo';
      console.log('🍃 [Database] Active engine set to MongoDB.');
      return mongoInstance;
    } catch (err) {
      console.warn('⚠️ [Database] MongoDB connection failed, falling back to Memory/JSON engine:', err);
      currentEngine = 'memory';
      await memoryInstance.connect();
      return memoryInstance;
    }
  }

  currentEngine = 'memory';
  await memoryInstance.connect();
  console.log('💾 [Database] Active engine set to In-Memory/JSON.');
  return memoryInstance;
}

export function getActiveEngine(): 'mongo' | 'memory' {
  return currentEngine;
}

/**
 * Universal Database Proxy.
 * Delegates cleanly to the active adapter instance (MongoDB or Memory/JSON).
 */
class UniversalDatabaseProxy implements IDatabaseAdapter {
  private get activeAdapter(): IDatabaseAdapter {
    return currentEngine === 'mongo' && getMongoStatus().connected ? mongoInstance : memoryInstance;
  }

  public async connect(): Promise<void> {
    return this.activeAdapter.connect();
  }

  public async disconnect(): Promise<void> {
    return this.activeAdapter.disconnect();
  }

  public reset(): Promise<void> | void {
    return this.activeAdapter.reset();
  }

  public getStats(): Record<string, number> | Promise<Record<string, number>> {
    return this.activeAdapter.getStats();
  }

  public getState(): Promise<DatabaseState> | DatabaseState {
    return this.activeAdapter.getState();
  }

  public setState(state: DatabaseState): Promise<void> | void {
    return this.activeAdapter.setState(state);
  }

  // Snapshots
  public createSnapshot(name?: string, description?: string): Promise<SnapshotMetadata> | SnapshotMetadata {
    return this.activeAdapter.createSnapshot(name, description);
  }

  public listSnapshots(): SnapshotMetadata[] | Promise<SnapshotMetadata[]> {
    return this.activeAdapter.listSnapshots();
  }

  public restoreSnapshot(
    snapshotIdOrName: string
  ): Promise<{ success: boolean; snapshot?: SnapshotMetadata; error?: string }> | { success: boolean; snapshot?: SnapshotMetadata; error?: string } {
    return this.activeAdapter.restoreSnapshot(snapshotIdOrName);
  }

  public deleteSnapshot(snapshotIdOrName: string): Promise<boolean> | boolean {
    return this.activeAdapter.deleteSnapshot(snapshotIdOrName);
  }

  // Businesses
  public getBusiness(businessId: string): Promise<Business | null> | Business | null {
    return this.activeAdapter.getBusiness(businessId);
  }

  public getAllBusinesses(): Promise<Business[]> | Business[] {
    return this.activeAdapter.getAllBusinesses();
  }

  public setBusiness(business: Business): Promise<Business> | Business {
    return this.activeAdapter.setBusiness(business);
  }

  // Persons
  public getPerson(personId: string): Promise<Person | null> | Person | null {
    return this.activeAdapter.getPerson(personId);
  }

  public getAllPersons(): Promise<Person[]> | Person[] {
    return this.activeAdapter.getAllPersons();
  }

  public setPerson(person: Person): Promise<Person> | Person {
    return this.activeAdapter.setPerson(person);
  }

  // Business Roles
  public getRolesForBusiness(businessId: string): Promise<BusinessRole[]> | BusinessRole[] {
    return this.activeAdapter.getRolesForBusiness(businessId);
  }

  public getAllRolesForBusiness(businessId: string): Promise<BusinessRole[]> | BusinessRole[] {
    return this.activeAdapter.getAllRolesForBusiness(businessId);
  }

  public getRolesForPerson(personId: string): Promise<BusinessRole[]> | BusinessRole[] {
    return this.activeAdapter.getRolesForPerson(personId);
  }

  public setBusinessRole(role: BusinessRole): Promise<BusinessRole> | BusinessRole {
    return this.activeAdapter.setBusinessRole(role);
  }

  // Credentials
  public getCredentialsForBusiness(businessId: string): Promise<Credential[]> | Credential[] {
    return this.activeAdapter.getCredentialsForBusiness(businessId);
  }

  public getCredentialById(credentialId: string): Promise<Credential | null> | Credential | null {
    return this.activeAdapter.getCredentialById(credentialId);
  }

  public setCredential(credential: Credential): Promise<Credential> | Credential {
    return this.activeAdapter.setCredential(credential);
  }

  // Delegation Tokens
  public getDelegationsForBusiness(businessId: string): Promise<DelegationToken[]> | DelegationToken[] {
    return this.activeAdapter.getDelegationsForBusiness(businessId);
  }

  public getActiveDelegation(businessId: string, delegatePersonId: string): Promise<DelegationToken | null> | DelegationToken | null {
    return this.activeAdapter.getActiveDelegation(businessId, delegatePersonId);
  }

  public getDelegationById(tokenId: string): Promise<DelegationToken | null> | DelegationToken | null {
    return this.activeAdapter.getDelegationById(tokenId);
  }

  public setDelegationToken(token: DelegationToken): Promise<DelegationToken> | DelegationToken {
    return this.activeAdapter.setDelegationToken(token);
  }

  // Proof Shares
  public getProofShare(proofId: string): Promise<ProofShare | null> | ProofShare | null {
    return this.activeAdapter.getProofShare(proofId);
  }

  public setProofShare(proof: ProofShare): Promise<ProofShare> | ProofShare {
    return this.activeAdapter.setProofShare(proof);
  }

  // Audit Logs
  public getAuditLogsForBusiness(businessId: string): Promise<AuditLog[]> | AuditLog[] {
    return this.activeAdapter.getAuditLogsForBusiness(businessId);
  }

  public addAuditLog(log: AuditLog): Promise<AuditLog> | AuditLog {
    return this.activeAdapter.addAuditLog(log);
  }

  // Agent Actions
  public getAgentAction(actionId: string): Promise<AgentAction | null> | AgentAction | null {
    return this.activeAdapter.getAgentAction(actionId);
  }

  public getAgentActionsForBusiness(businessId: string): Promise<AgentAction[]> | AgentAction[] {
    return this.activeAdapter.getAgentActionsForBusiness(businessId);
  }

  public setAgentAction(action: AgentAction): Promise<AgentAction> | AgentAction {
    return this.activeAdapter.setAgentAction(action);
  }
}

export const db = new UniversalDatabaseProxy();
