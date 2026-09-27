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
 * Provides unified interface delegating to the active adapter.
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

  public getStats(): Record<string, number> {
    return memoryInstance.getStats();
  }

  public getState(): Promise<DatabaseState> | DatabaseState {
    return this.activeAdapter.getState();
  }

  public setState(state: DatabaseState): Promise<void> | void {
    return this.activeAdapter.setState(state);
  }

  // Snapshots
  public createSnapshot(name?: string, description?: string): SnapshotMetadata {
    return (memoryInstance as any).createSnapshot(name, description);
  }

  public listSnapshots(): SnapshotMetadata[] {
    return memoryInstance.listSnapshots();
  }

  public restoreSnapshot(
    snapshotIdOrName: string
  ): { success: boolean; snapshot?: SnapshotMetadata; error?: string } {
    return (memoryInstance as any).restoreSnapshot(snapshotIdOrName);
  }

  public deleteSnapshot(snapshotIdOrName: string): boolean {
    return (memoryInstance as any).deleteSnapshot(snapshotIdOrName);
  }

  // Businesses
  public getBusiness(businessId: string): Business | null {
    return (memoryInstance as any).getBusiness(businessId);
  }

  public getAllBusinesses(): Business[] {
    return (memoryInstance as any).getAllBusinesses();
  }

  public setBusiness(business: Business): Business {
    return (memoryInstance as any).setBusiness(business);
  }

  // Persons
  public getPerson(personId: string): Person | null {
    return (memoryInstance as any).getPerson(personId);
  }

  public getAllPersons(): Person[] {
    return (memoryInstance as any).getAllPersons();
  }

  public setPerson(person: Person): Person {
    return (memoryInstance as any).setPerson(person);
  }

  // Business Roles
  public getRolesForBusiness(businessId: string): BusinessRole[] {
    return (memoryInstance as any).getRolesForBusiness(businessId);
  }

  public getAllRolesForBusiness(businessId: string): BusinessRole[] {
    return (memoryInstance as any).getAllRolesForBusiness(businessId);
  }

  public getRolesForPerson(personId: string): BusinessRole[] {
    return (memoryInstance as any).getRolesForPerson(personId);
  }

  public setBusinessRole(role: BusinessRole): BusinessRole {
    return (memoryInstance as any).setBusinessRole(role);
  }

  // Credentials
  public getCredentialsForBusiness(businessId: string): Credential[] {
    return (memoryInstance as any).getCredentialsForBusiness(businessId);
  }

  public getCredentialById(credentialId: string): Credential | null {
    return (memoryInstance as any).getCredentialById(credentialId);
  }

  public setCredential(credential: Credential): Credential {
    return (memoryInstance as any).setCredential(credential);
  }

  // Delegation Tokens
  public getDelegationsForBusiness(businessId: string): DelegationToken[] {
    return (memoryInstance as any).getDelegationsForBusiness(businessId);
  }

  public getActiveDelegation(businessId: string, delegatePersonId: string): DelegationToken | null {
    return (memoryInstance as any).getActiveDelegation(businessId, delegatePersonId);
  }

  public getDelegationById(tokenId: string): DelegationToken | null {
    return (memoryInstance as any).getDelegationById(tokenId);
  }

  public setDelegationToken(token: DelegationToken): DelegationToken {
    return (memoryInstance as any).setDelegationToken(token);
  }

  // Proof Shares
  public getProofShare(proofId: string): ProofShare | null {
    return (memoryInstance as any).getProofShare(proofId);
  }

  public setProofShare(proof: ProofShare): ProofShare {
    return (memoryInstance as any).setProofShare(proof);
  }

  // Audit Logs
  public getAuditLogsForBusiness(businessId: string): AuditLog[] {
    return (memoryInstance as any).getAuditLogsForBusiness(businessId);
  }

  public addAuditLog(log: AuditLog): AuditLog {
    return (memoryInstance as any).addAuditLog(log);
  }

  // Agent Actions
  public getAgentAction(actionId: string): AgentAction | null {
    return (memoryInstance as any).getAgentAction(actionId);
  }

  public getAgentActionsForBusiness(businessId: string): AgentAction[] {
    return (memoryInstance as any).getAgentActionsForBusiness(businessId);
  }

  public setAgentAction(action: AgentAction): AgentAction {
    return (memoryInstance as any).setAgentAction(action);
  }
}

export const db = new UniversalDatabaseProxy();
