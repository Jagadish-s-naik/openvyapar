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
import { config } from '../config.js';
import { connectMongo, disconnectMongo } from './mongo.js';
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
import type { DatabaseState } from './adapter.js';
import type { StoredMongoSnapshot } from './models/snapshot.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function migrateJsonToMongo(customDataDir?: string, customMongoUri?: string): Promise<{
  success: boolean;
  migratedCounts: Record<string, number>;
  snapshotCount: number;
}> {
  const dataDir = customDataDir || path.resolve(__dirname, '../../data');
  const dbJsonPath = path.join(dataDir, 'openvyapar_db.json');
  const snapshotsDir = path.join(dataDir, 'snapshots');

  console.log('🔄 [Migration] Starting JSON -> MongoDB Data Migration...');
  console.log(`📁 Source JSON path: ${dbJsonPath}`);
  console.log(`🍃 Target MongoDB URI: ${customMongoUri || config.mongodb.uri}`);

  await connectMongo(customMongoUri);

  const migratedCounts: Record<string, number> = {
    businesses: 0,
    persons: 0,
    business_roles: 0,
    credentials: 0,
    delegation_tokens: 0,
    proof_shares: 0,
    audit_logs: 0,
    agent_actions: 0,
  };

  let snapshotCount = 0;

  // 1. Migrate Core Database State
  if (fs.existsSync(dbJsonPath)) {
    try {
      const raw = fs.readFileSync(dbJsonPath, 'utf8');
      const state: DatabaseState = JSON.parse(raw);

      const businesses: Business[] = Object.values(state.businesses || {});
      const persons: Person[] = Object.values(state.persons || {});
      const roles: BusinessRole[] = Object.values(state.business_roles || {});
      const credentials: Credential[] = Object.values(state.credentials || {});
      const delegations: DelegationToken[] = Object.values(state.delegation_tokens || {});
      const proofs: ProofShare[] = Object.values(state.proof_shares || {});
      const auditLogs: AuditLog[] = Object.values(state.audit_logs || {});
      const actions: AgentAction[] = Object.values(state.agent_actions || {});

      // Use upsert bulk writes for idempotency
      if (businesses.length > 0) {
        await Promise.all(
          businesses.map((b) =>
            BusinessModel.findOneAndUpdate({ business_id: b.business_id }, b, { upsert: true, new: true })
          )
        );
        migratedCounts.businesses = businesses.length;
      }

      if (persons.length > 0) {
        await Promise.all(
          persons.map((p) =>
            PersonModel.findOneAndUpdate({ person_id: p.person_id }, p, { upsert: true, new: true })
          )
        );
        migratedCounts.persons = persons.length;
      }

      if (roles.length > 0) {
        await Promise.all(
          roles.map((r) =>
            BusinessRoleModel.findOneAndUpdate({ role_id: r.role_id }, r, { upsert: true, new: true })
          )
        );
        migratedCounts.business_roles = roles.length;
      }

      if (credentials.length > 0) {
        await Promise.all(
          credentials.map((c) =>
            CredentialModel.findOneAndUpdate({ credential_id: c.credential_id }, c, { upsert: true, new: true })
          )
        );
        migratedCounts.credentials = credentials.length;
      }

      if (delegations.length > 0) {
        await Promise.all(
          delegations.map((d) =>
            DelegationTokenModel.findOneAndUpdate({ token_id: d.token_id }, d, { upsert: true, new: true })
          )
        );
        migratedCounts.delegation_tokens = delegations.length;
      }

      if (proofs.length > 0) {
        await Promise.all(
          proofs.map((pr) =>
            ProofShareModel.findOneAndUpdate({ proof_id: pr.proof_id }, pr, { upsert: true, new: true })
          )
        );
        migratedCounts.proof_shares = proofs.length;
      }

      if (auditLogs.length > 0) {
        await Promise.all(
          auditLogs.map((a) =>
            AuditLogModel.findOneAndUpdate({ log_id: a.log_id }, a, { upsert: true, new: true })
          )
        );
        migratedCounts.audit_logs = auditLogs.length;
      }

      if (actions.length > 0) {
        await Promise.all(
          actions.map((act) =>
            AgentActionModel.findOneAndUpdate({ agent_action_id: act.agent_action_id }, act, { upsert: true, new: true })
          )
        );
        migratedCounts.agent_actions = actions.length;
      }

      console.log('✅ Core database records successfully loaded into MongoDB.');
    } catch (err) {
      console.error('❌ Error reading source DB JSON file:', err);
      throw err;
    }
  } else {
    console.warn(`⚠️ Source JSON file not found at ${dbJsonPath}, skipping core state.`);
  }

  // 2. Migrate Snapshot Archives
  if (fs.existsSync(snapshotsDir)) {
    try {
      const files = fs.readdirSync(snapshotsDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        const raw = fs.readFileSync(path.join(snapshotsDir, file), 'utf8');
        const snapData: StoredMongoSnapshot = JSON.parse(raw);
        await SnapshotModel.findOneAndUpdate(
          { snapshot_id: snapData.snapshot_id },
          snapData,
          { upsert: true, new: true }
        );
        snapshotCount++;
      }
      console.log(`✅ Migrated ${snapshotCount} legacy snapshot archives into MongoDB.`);
    } catch (err) {
      console.warn('⚠️ Error migrating snapshot archives:', err);
    }
  }

  console.log('\n📊 === MIGRATION SUMMARY REPORT ===');
  console.log(`🏢 Businesses:        ${migratedCounts.businesses}`);
  console.log(`👤 Persons:           ${migratedCounts.persons}`);
  console.log(`🏷️  Business Roles:    ${migratedCounts.business_roles}`);
  console.log(`📜 Credentials:       ${migratedCounts.credentials}`);
  console.log(`🔑 Delegation Tokens: ${migratedCounts.delegation_tokens}`);
  console.log(`🛡️  Proof Shares:      ${migratedCounts.proof_shares}`);
  console.log(`📋 Audit Logs:        ${migratedCounts.audit_logs}`);
  console.log(`🤖 Agent Actions:     ${migratedCounts.agent_actions}`);
  console.log(`💾 Snapshots:         ${snapshotCount}`);
  console.log('====================================\n');

  return {
    success: true,
    migratedCounts,
    snapshotCount,
  };
}

// CLI execution handler
if (process.argv[1]?.includes('migrate-to-mongo')) {
  migrateJsonToMongo()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      return disconnectMongo();
    })
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}
