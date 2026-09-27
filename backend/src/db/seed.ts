import {
  mockPersonas,
  mockBusinesses,
  mockCredentials,
  mockDelegationTokens,
  mockProofShares,
  mockAuditLogs,
  type BusinessRole,
} from '@openvyapar/shared';
import { db, initDatabase } from './connection.js';
import { signCredential } from '../utils/crypto.js';

export async function seedDatabase(): Promise<void> {
  await initDatabase();
  console.log('🌱 Seeding OpenVyapar Database...');
  await db.reset();

  // Seed Personas
  for (const person of mockPersonas) {
    await db.setPerson(person);
  }

  // Seed Businesses
  for (const business of mockBusinesses) {
    await db.setBusiness(business);
  }

  // Seed Default Owner Roles
  const rameshOwnerRole: BusinessRole = {
    role_id: 'role-owner-sharma001',
    business_id: 'did:biz:sharma001',
    person_id: 'did:person:ramesh001',
    role_type: 'owner',
    status: 'active',
    granted_at: '2024-03-15T08:30:00.000Z',
    revoked_at: null,
  };
  await db.setBusinessRole(rameshOwnerRole);

  const priyaSuccessorRole: BusinessRole = {
    role_id: 'role-successor-sharma001',
    business_id: 'did:biz:sharma001',
    person_id: 'did:person:priya001',
    role_type: 'successor',
    status: 'active',
    granted_at: '2024-03-15T08:30:00.000Z',
    revoked_at: null,
  };
  await db.setBusinessRole(priyaSuccessorRole);

  const vikasDelegateRole: BusinessRole = {
    role_id: 'role-delegate-sharma001',
    business_id: 'did:biz:sharma001',
    person_id: 'did:person:ca001',
    role_type: 'delegate',
    status: 'active',
    granted_at: '2024-07-01T10:00:00.000Z',
    revoked_at: null,
  };
  await db.setBusinessRole(vikasDelegateRole);

  // Seed Credentials with authentic HMAC-SHA256 signatures
  for (const credential of mockCredentials) {
    const signature = signCredential(
      credential.business_id,
      credential.issuer,
      credential.type,
      credential.claim,
      credential.issued_at
    );
    await db.setCredential({ ...credential, signature });
  }

  // Seed Delegation Tokens
  for (const token of mockDelegationTokens) {
    await db.setDelegationToken(token);
  }

  // Seed Proof Shares
  for (const proof of mockProofShares) {
    await db.setProofShare(proof);
  }

  // Seed Audit Logs
  for (const log of mockAuditLogs) {
    await db.addAuditLog(log);
  }

  console.log('✅ Database seeded successfully with baseline mock fixtures.');
}

// If run directly via node/tsx
if (process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(async () => {
      await db.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
