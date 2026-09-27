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
import type {
  IDatabaseAdapter,
  DatabaseState,
  SnapshotMetadata,
} from './adapter.js';
import {
  BusinessModel,
  PersonModel,
  BusinessRoleModel,
  CredentialModel,
  DelegationTokenModel,
  ProofShareModel,
  AuditLogModel,
  AgentActionModel,
  SnapshotModel,
} from './models/index.js';
import { connectMongo, disconnectMongo } from './mongo.js';

export class MongoDatabaseManager implements IDatabaseAdapter {
  public async connect(): Promise<void> {
    await connectMongo();
  }

  public async disconnect(): Promise<void> {
    await disconnectMongo();
  }

  public async reset(): Promise<void> {
    await Promise.all([
      BusinessModel.deleteMany({}),
      PersonModel.deleteMany({}),
      BusinessRoleModel.deleteMany({}),
      CredentialModel.deleteMany({}),
      DelegationTokenModel.deleteMany({}),
      ProofShareModel.deleteMany({}),
      AuditLogModel.deleteMany({}),
      AgentActionModel.deleteMany({}),
    ]);
  }

  public async getStats(): Promise<Record<string, number>> {
    const [
      businesses,
      persons,
      business_roles,
      credentials,
      delegation_tokens,
      proof_shares,
      audit_logs,
      agent_actions,
    ] = await Promise.all([
      BusinessModel.countDocuments(),
      PersonModel.countDocuments(),
      BusinessRoleModel.countDocuments(),
      CredentialModel.countDocuments(),
      DelegationTokenModel.countDocuments(),
      ProofShareModel.countDocuments(),
      AuditLogModel.countDocuments(),
      AgentActionModel.countDocuments(),
    ]);

    return {
      businesses,
      persons,
      business_roles,
      credentials,
      delegation_tokens,
      proof_shares,
      audit_logs,
      agent_actions,
    };
  }

  public async getState(): Promise<DatabaseState> {
    const [
      businessesList,
      personsList,
      rolesList,
      credentialsList,
      delegationsList,
      proofsList,
      auditList,
      actionsList,
    ] = await Promise.all([
      BusinessModel.find({}).lean<Business[]>(),
      PersonModel.find({}).lean<Person[]>(),
      BusinessRoleModel.find({}).lean<BusinessRole[]>(),
      CredentialModel.find({}).lean<Credential[]>(),
      DelegationTokenModel.find({}).lean<DelegationToken[]>(),
      ProofShareModel.find({}).lean<ProofShare[]>(),
      AuditLogModel.find({}).lean<AuditLog[]>(),
      AgentActionModel.find({}).lean<AgentAction[]>(),
    ]);

    const state: DatabaseState = {
      businesses: {},
      persons: {},
      business_roles: {},
      credentials: {},
      delegation_tokens: {},
      proof_shares: {},
      audit_logs: {},
      agent_actions: {},
    };

    for (const b of businessesList) state.businesses[b.business_id] = b;
    for (const p of personsList) state.persons[p.person_id] = p;
    for (const r of rolesList) state.business_roles[r.role_id] = r;
    for (const c of credentialsList) state.credentials[c.credential_id] = c;
    for (const d of delegationsList) state.delegation_tokens[d.token_id] = d;
    for (const pr of proofsList) state.proof_shares[pr.proof_id] = pr;
    for (const a of auditList) state.audit_logs[a.log_id] = a;
    for (const act of actionsList) state.agent_actions[act.agent_action_id] = act;

    return state;
  }

  public async setState(state: DatabaseState): Promise<void> {
    await this.reset();

    const businesses = Object.values(state.businesses || {});
    const persons = Object.values(state.persons || {});
    const roles = Object.values(state.business_roles || {});
    const credentials = Object.values(state.credentials || {});
    const delegations = Object.values(state.delegation_tokens || {});
    const proofs = Object.values(state.proof_shares || {});
    const auditLogs = Object.values(state.audit_logs || {});
    const actions = Object.values(state.agent_actions || {});

    await Promise.all([
      businesses.length > 0 ? BusinessModel.insertMany(businesses) : Promise.resolve(),
      persons.length > 0 ? PersonModel.insertMany(persons) : Promise.resolve(),
      roles.length > 0 ? BusinessRoleModel.insertMany(roles) : Promise.resolve(),
      credentials.length > 0 ? CredentialModel.insertMany(credentials) : Promise.resolve(),
      delegations.length > 0 ? DelegationTokenModel.insertMany(delegations) : Promise.resolve(),
      proofs.length > 0 ? ProofShareModel.insertMany(proofs) : Promise.resolve(),
      auditLogs.length > 0 ? AuditLogModel.insertMany(auditLogs) : Promise.resolve(),
      actions.length > 0 ? AgentActionModel.insertMany(actions) : Promise.resolve(),
    ]);
  }

  // Snapshots
  public async createSnapshot(name?: string, description?: string): Promise<SnapshotMetadata> {
    const timestamp = new Date().toISOString();
    const idSuffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const snapshot_id = `snap_${idSuffix}`;
    const snapshotName = name && name.trim().length > 0 ? name.trim() : snapshot_id;

    const stats = await this.getStats();
    const state = await this.getState();

    const metadata: SnapshotMetadata = {
      snapshot_id,
      name: snapshotName,
      description: description || `Snapshot created at ${timestamp}`,
      created_at: timestamp,
      record_counts: stats,
    };

    await SnapshotModel.create({
      ...metadata,
      state,
    });

    return metadata;
  }

  public async listSnapshots(): Promise<SnapshotMetadata[]> {
    const docs = await SnapshotModel.find({})
      .sort({ created_at: -1 })
      .select('snapshot_id name description created_at record_counts')
      .lean<SnapshotMetadata[]>();

    return docs.map((d) => ({
      snapshot_id: d.snapshot_id,
      name: d.name,
      description: d.description,
      created_at: d.created_at,
      record_counts: d.record_counts,
    }));
  }

  public async restoreSnapshot(
    snapshotIdOrName: string
  ): Promise<{ success: boolean; snapshot?: SnapshotMetadata; error?: string }> {
    try {
      const snapshot = await SnapshotModel.findOne({
        $or: [{ snapshot_id: snapshotIdOrName }, { name: snapshotIdOrName }],
      }).lean();

      if (!snapshot) {
        return { success: false, error: `Snapshot '${snapshotIdOrName}' not found` };
      }

      await this.setState(snapshot.state as DatabaseState);

      return {
        success: true,
        snapshot: {
          snapshot_id: snapshot.snapshot_id,
          name: snapshot.name,
          description: snapshot.description,
          created_at: snapshot.created_at,
          record_counts: await this.getStats(),
        },
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  public async deleteSnapshot(snapshotIdOrName: string): Promise<boolean> {
    const result = await SnapshotModel.deleteOne({
      $or: [{ snapshot_id: snapshotIdOrName }, { name: snapshotIdOrName }],
    });
    return (result.deletedCount ?? 0) > 0;
  }

  // Businesses
  public async getBusiness(businessId: string): Promise<Business | null> {
    const doc = await BusinessModel.findOne({ business_id: businessId }).lean<Business | null>();
    return doc;
  }

  public async getAllBusinesses(): Promise<Business[]> {
    return await BusinessModel.find({}).lean<Business[]>();
  }

  public async setBusiness(business: Business): Promise<Business> {
    const updated = await BusinessModel.findOneAndUpdate(
      { business_id: business.business_id },
      business,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<Business>();
    return updated || business;
  }

  // Persons
  public async getPerson(personId: string): Promise<Person | null> {
    return await PersonModel.findOne({ person_id: personId }).lean<Person | null>();
  }

  public async getAllPersons(): Promise<Person[]> {
    return await PersonModel.find({}).lean<Person[]>();
  }

  public async setPerson(person: Person): Promise<Person> {
    const updated = await PersonModel.findOneAndUpdate(
      { person_id: person.person_id },
      person,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<Person>();
    return updated || person;
  }

  // Business Roles
  public async getRolesForBusiness(businessId: string): Promise<BusinessRole[]> {
    return await BusinessRoleModel.find({
      business_id: businessId,
      status: 'active',
    }).lean<BusinessRole[]>();
  }

  public async getAllRolesForBusiness(businessId: string): Promise<BusinessRole[]> {
    return await BusinessRoleModel.find({
      business_id: businessId,
    }).lean<BusinessRole[]>();
  }

  public async getRolesForPerson(personId: string): Promise<BusinessRole[]> {
    return await BusinessRoleModel.find({
      person_id: personId,
      status: 'active',
    }).lean<BusinessRole[]>();
  }

  public async setBusinessRole(role: BusinessRole): Promise<BusinessRole> {
    const updated = await BusinessRoleModel.findOneAndUpdate(
      { role_id: role.role_id },
      role,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<BusinessRole>();
    return updated || role;
  }

  // Credentials
  public async getCredentialsForBusiness(businessId: string): Promise<Credential[]> {
    return await CredentialModel.find({
      business_id: businessId,
      status: 'valid',
    }).lean<Credential[]>();
  }

  public async getCredentialById(credentialId: string): Promise<Credential | null> {
    return await CredentialModel.findOne({
      credential_id: credentialId,
    }).lean<Credential | null>();
  }

  public async setCredential(credential: Credential): Promise<Credential> {
    const updated = await CredentialModel.findOneAndUpdate(
      { credential_id: credential.credential_id },
      credential,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<Credential>();
    return updated || credential;
  }

  // Delegation Tokens
  public async getDelegationsForBusiness(businessId: string): Promise<DelegationToken[]> {
    return await DelegationTokenModel.find({
      business_id: businessId,
    }).lean<DelegationToken[]>();
  }

  public async getActiveDelegation(
    businessId: string,
    delegatePersonId: string
  ): Promise<DelegationToken | null> {
    return await DelegationTokenModel.findOne({
      business_id: businessId,
      delegate_person_id: delegatePersonId,
      status: 'active',
    }).lean<DelegationToken | null>();
  }

  public async getDelegationById(tokenId: string): Promise<DelegationToken | null> {
    return await DelegationTokenModel.findOne({
      token_id: tokenId,
    }).lean<DelegationToken | null>();
  }

  public async setDelegationToken(token: DelegationToken): Promise<DelegationToken> {
    const updated = await DelegationTokenModel.findOneAndUpdate(
      { token_id: token.token_id },
      token,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<DelegationToken>();
    return updated || token;
  }

  // Proof Shares
  public async getProofShare(proofId: string): Promise<ProofShare | null> {
    return await ProofShareModel.findOne({
      proof_id: proofId,
    }).lean<ProofShare | null>();
  }

  public async setProofShare(proof: ProofShare): Promise<ProofShare> {
    const updated = await ProofShareModel.findOneAndUpdate(
      { proof_id: proof.proof_id },
      proof,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<ProofShare>();
    return updated || proof;
  }

  // Audit Logs
  public async getAuditLogsForBusiness(businessId: string): Promise<AuditLog[]> {
    return await AuditLogModel.find({
      business_id: businessId,
    })
      .sort({ timestamp: -1 })
      .lean<AuditLog[]>();
  }

  public async addAuditLog(log: AuditLog): Promise<AuditLog> {
    const updated = await AuditLogModel.findOneAndUpdate(
      { log_id: log.log_id },
      log,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<AuditLog>();
    return updated || log;
  }

  // Agent Actions
  public async getAgentAction(actionId: string): Promise<AgentAction | null> {
    return await AgentActionModel.findOne({
      agent_action_id: actionId,
    }).lean<AgentAction | null>();
  }

  public async getAgentActionsForBusiness(businessId: string): Promise<AgentAction[]> {
    return await AgentActionModel.find({
      business_id: businessId,
    })
      .sort({ created_at: -1 })
      .lean<AgentAction[]>();
  }

  public async setAgentAction(action: AgentAction): Promise<AgentAction> {
    const updated = await AgentActionModel.findOneAndUpdate(
      { agent_action_id: action.agent_action_id },
      action,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<AgentAction>();
    return updated || action;
  }
}
