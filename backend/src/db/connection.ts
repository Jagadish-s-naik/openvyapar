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
  private state: DatabaseState = JSON.parse(JSON.stringify(defaultState));
  private isLoaded = false;

  constructor(customPath?: string) {
    const dataDir = customPath || path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'openvyapar_db.json');
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

  public reset(): void {
    this.state = JSON.parse(JSON.stringify(defaultState));
    this.save();
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
