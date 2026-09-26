import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

interface StoredSnapshot extends SnapshotMetadata {
  state: DatabaseState;
}

const defaultState: DatabaseState = {
  businesses: {},
  persons: {},
  business_roles: {},
  credentials: {},
  delegation_tokens: {},
  proof_shares: {},
  audit_logs: {},
  agent_actions: {},
};

class DatabaseManager {
  private dbPath: string;
  private snapshotsDir: string;
  private state: DatabaseState = JSON.parse(JSON.stringify(defaultState));
  private isLoaded = false;

  constructor(customPath?: string) {
    const dataDir = customPath || path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'openvyapar_db.json');
    this.snapshotsDir = path.join(dataDir, 'snapshots');
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        this.state = { ...defaultState, ...JSON.parse(raw) };
      } catch (err) {
        console.warn('⚠️ Warning: Could not read existing DB file, initializing fresh state.', err);
        this.state = JSON.parse(JSON.stringify(defaultState));
      }
    } else {
      this.state = JSON.parse(JSON.stringify(defaultState));
      this.save();
    }
    this.isLoaded = true;
  }

  public save(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (err) {
      console.error('❌ Failed to persist database state:', err);
    }
  }

  public getState(): DatabaseState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public setState(newState: DatabaseState): void {
    this.state = JSON.parse(JSON.stringify(newState));
    this.save();
  }

  public getStats(): Record<string, number> {
    return {
      businesses: Object.keys(this.state.businesses).length,
      persons: Object.keys(this.state.persons).length,
      business_roles: Object.keys(this.state.business_roles).length,
      credentials: Object.keys(this.state.credentials).length,
      delegation_tokens: Object.keys(this.state.delegation_tokens).length,
      proof_shares: Object.keys(this.state.proof_shares).length,
      audit_logs: Object.keys(this.state.audit_logs).length,
      agent_actions: Object.keys(this.state.agent_actions).length,
    };
  }

  public reset(): void {
    this.state = JSON.parse(JSON.stringify(defaultState));
    this.save();
  }

  public createSnapshot(name?: string, description?: string): SnapshotMetadata {
    const timestamp = new Date().toISOString();
    const idSuffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const snapshot_id = `snap_${idSuffix}`;
    const snapshotName = name && name.trim().length > 0 ? name.trim() : snapshot_id;

    const metadata: SnapshotMetadata = {
      snapshot_id,
      name: snapshotName,
      description: description || `Snapshot created at ${timestamp}`,
      created_at: timestamp,
      record_counts: this.getStats(),
    };

    const snapshotData: StoredSnapshot = {
      ...metadata,
      state: this.getState(),
    };

    const filePath = path.join(this.snapshotsDir, `${snapshot_id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(snapshotData, null, 2), 'utf8');

    return metadata;
  }

  public listSnapshots(): SnapshotMetadata[] {
    if (!fs.existsSync(this.snapshotsDir)) {
      return [];
    }

    try {
      const files = fs.readdirSync(this.snapshotsDir).filter(f => f.endsWith('.json'));
      const snapshots: SnapshotMetadata[] = [];

      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(this.snapshotsDir, file), 'utf8');
          const data: StoredSnapshot = JSON.parse(raw);
          snapshots.push({
            snapshot_id: data.snapshot_id,
            name: data.name,
            description: data.description,
            created_at: data.created_at,
            record_counts: data.record_counts,
          });
        } catch (e) {
          console.warn(`Failed reading snapshot ${file}:`, e);
        }
      }

      return snapshots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      console.error('Failed to list snapshots:', err);
      return [];
    }
  }

  public restoreSnapshot(snapshotIdOrName: string): { success: boolean; snapshot?: SnapshotMetadata; error?: string } {
    if (!fs.existsSync(this.snapshotsDir)) {
      return { success: false, error: 'No snapshots directory exists' };
    }

    try {
      const files = fs.readdirSync(this.snapshotsDir).filter(f => f.endsWith('.json'));
      let targetFile: string | null = null;
      let matchedData: StoredSnapshot | null = null;

      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(this.snapshotsDir, file), 'utf8');
          const data: StoredSnapshot = JSON.parse(raw);
          if (data.snapshot_id === snapshotIdOrName || data.name.toLowerCase() === snapshotIdOrName.toLowerCase()) {
            targetFile = file;
            matchedData = data;
            break;
          }
        } catch {
          // ignore corrupted individual files
        }
      }

      if (!matchedData) {
        return { success: false, error: `Snapshot '${snapshotIdOrName}' not found` };
      }

      this.state = JSON.parse(JSON.stringify(matchedData.state));
      this.save();

      return {
        success: true,
        snapshot: {
          snapshot_id: matchedData.snapshot_id,
          name: matchedData.name,
          description: matchedData.description,
          created_at: matchedData.created_at,
          record_counts: this.getStats(),
        },
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  public deleteSnapshot(snapshotIdOrName: string): boolean {
    if (!fs.existsSync(this.snapshotsDir)) {
      return false;
    }
    try {
      const files = fs.readdirSync(this.snapshotsDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const fullPath = path.join(this.snapshotsDir, file);
        const raw = fs.readFileSync(fullPath, 'utf8');
        const data: StoredSnapshot = JSON.parse(raw);
        if (data.snapshot_id === snapshotIdOrName || data.name.toLowerCase() === snapshotIdOrName.toLowerCase()) {
          fs.unlinkSync(fullPath);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  // Businesses
  public getBusiness(businessId: string): Business | null {
    return this.state.businesses[businessId] || null;
  }

  public getAllBusinesses(): Business[] {
    return Object.values(this.state.businesses);
  }

  public setBusiness(business: Business): Business {
    this.state.businesses[business.business_id] = business;
    this.save();
    return business;
  }

  // Persons
  public getPerson(personId: string): Person | null {
    return this.state.persons[personId] || null;
  }

  public getAllPersons(): Person[] {
    return Object.values(this.state.persons);
  }

  public setPerson(person: Person): Person {
    this.state.persons[person.person_id] = person;
    this.save();
    return person;
  }

  // Business Roles
  public getRolesForBusiness(businessId: string): BusinessRole[] {
    return Object.values(this.state.business_roles).filter(
      (r) => r.business_id === businessId && r.status === 'active'
    );
  }

  public getAllRolesForBusiness(businessId: string): BusinessRole[] {
    return Object.values(this.state.business_roles).filter(
      (r) => r.business_id === businessId
    );
  }

  public getRolesForPerson(personId: string): BusinessRole[] {
    return Object.values(this.state.business_roles).filter(
      (r) => r.person_id === personId && r.status === 'active'
    );
  }

  public setBusinessRole(role: BusinessRole): BusinessRole {
    this.state.business_roles[role.role_id] = role;
    this.save();
    return role;
  }

  // Credentials
  public getCredentialsForBusiness(businessId: string): Credential[] {
    return Object.values(this.state.credentials).filter(
      (c) => c.business_id === businessId && c.status === 'valid'
    );
  }

  public getCredentialById(credentialId: string): Credential | null {
    return this.state.credentials[credentialId] || null;
  }

  public setCredential(credential: Credential): Credential {
    this.state.credentials[credential.credential_id] = credential;
    this.save();
    return credential;
  }

  // Delegation Tokens
  public getDelegationsForBusiness(businessId: string): DelegationToken[] {
    return Object.values(this.state.delegation_tokens).filter(
      (d) => d.business_id === businessId
    );
  }

  public getActiveDelegation(businessId: string, delegatePersonId: string): DelegationToken | null {
    return (
      Object.values(this.state.delegation_tokens).find(
        (d) =>
          d.business_id === businessId &&
          d.delegate_person_id === delegatePersonId &&
          d.status === 'active'
      ) || null
    );
  }

  public getDelegationById(tokenId: string): DelegationToken | null {
    return this.state.delegation_tokens[tokenId] || null;
  }

  public setDelegationToken(token: DelegationToken): DelegationToken {
    this.state.delegation_tokens[token.token_id] = token;
    this.save();
    return token;
  }

  // Proof Shares
  public getProofShare(proofId: string): ProofShare | null {
    return this.state.proof_shares[proofId] || null;
  }

  public setProofShare(proof: ProofShare): ProofShare {
    this.state.proof_shares[proof.proof_id] = proof;
    this.save();
    return proof;
  }

  // Audit Logs
  public getAuditLogsForBusiness(businessId: string): AuditLog[] {
    return Object.values(this.state.audit_logs)
      .filter((l) => l.business_id === businessId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addAuditLog(log: AuditLog): AuditLog {
    this.state.audit_logs[log.log_id] = log;
    this.save();
    return log;
  }

  // Agent Actions
  public getAgentAction(actionId: string): AgentAction | null {
    return this.state.agent_actions[actionId] || null;
  }

  public getAgentActionsForBusiness(businessId: string): AgentAction[] {
    return Object.values(this.state.agent_actions)
      .filter((a) => a.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public setAgentAction(action: AgentAction): AgentAction {
    this.state.agent_actions[action.agent_action_id] = action;
    this.save();
    return action;
  }
}

export const db = new DatabaseManager();
