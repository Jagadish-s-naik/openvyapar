import assert from 'node:assert/strict';
import { MemoryDatabaseManager } from '../src/db/memory-adapter.js';
import { db, initDatabase, getActiveEngine } from '../src/db/connection.js';
import type { Business, Person, BusinessRole, Credential, DelegationToken, ProofShare, AuditLog, AgentAction } from '@openvyapar/shared';

console.log('🧪 Testing Multi-Engine Database Adapter Architecture...');

async function runAdapterTests() {
  const memoryAdapter = new MemoryDatabaseManager();
  await memoryAdapter.connect();
  await memoryAdapter.reset();

  // 1. Business CRUD on Adapter
  const testBiz: Business = {
    business_id: 'did:biz:adapter001',
    name: 'Adapter Test Store',
    status: 'active',
    created_at: new Date().toISOString(),
    primary_language: 'hi',
    metadata: { sector: 'Retail', location: 'Delhi' },
  };

  await memoryAdapter.setBusiness(testBiz);
  const fetchedBiz = await memoryAdapter.getBusiness('did:biz:adapter001');
  assert.ok(fetchedBiz, 'Business should be retrievable');
  assert.equal(fetchedBiz.name, 'Adapter Test Store');
  const allBiz = await memoryAdapter.getAllBusinesses();
  assert.equal(allBiz.length, 1);
  console.log('✅ 1. Business CRUD operations verified on adapter.');

  // 2. Person & Role CRUD
  const testPerson: Person = {
    person_id: 'did:person:p001',
    name: 'Priya Sharma',
    contact: { phone: '+919999988888' },
    auth_ref: 'tok_p001',
  };
  await memoryAdapter.setPerson(testPerson);
  const fetchedPerson = await memoryAdapter.getPerson('did:person:p001');
  assert.equal(fetchedPerson?.name, 'Priya Sharma');

  const testRole: BusinessRole = {
    role_id: 'role-001',
    business_id: 'did:biz:adapter001',
    person_id: 'did:person:p001',
    role_type: 'owner',
    status: 'active',
    granted_at: new Date().toISOString(),
    revoked_at: null,
  };
  await memoryAdapter.setBusinessRole(testRole);
  const activeRoles = await memoryAdapter.getRolesForBusiness('did:biz:adapter001');
  assert.equal(activeRoles.length, 1);
  console.log('✅ 2. Person & Role operations verified on adapter.');

  // 3. Credential & Delegation
  const testCred: Credential = {
    credential_id: 'cred-001',
    business_id: 'did:biz:adapter001',
    issuer: 'gst_mock',
    type: 'gst_compliant',
    claim: { gstin: '07AAAAA0000A1Z5' },
    issued_at: new Date().toISOString(),
    expires_at: null,
    signature: 'sig-001',
    status: 'valid',
  };
  await memoryAdapter.setCredential(testCred);
  const creds = await memoryAdapter.getCredentialsForBusiness('did:biz:adapter001');
  assert.equal(creds.length, 1);

  const testDel: DelegationToken = {
    token_id: 'tok-001',
    business_id: 'did:biz:adapter001',
    delegate_person_id: 'did:person:ca001',
    scopes: ['file_returns'],
    granted_by: 'did:person:p001',
    status: 'active',
    created_at: new Date().toISOString(),
    expires_at: null,
  };
  await memoryAdapter.setDelegationToken(testDel);
  const activeDel = await memoryAdapter.getActiveDelegation('did:biz:adapter001', 'did:person:ca001');
  assert.ok(activeDel);
  console.log('✅ 3. Credential & Delegation operations verified.');

  // 4. Snapshot & Reset
  const snap = await memoryAdapter.createSnapshot('Adapter Test Snapshot', 'Testing state persistence');
  assert.ok(snap.snapshot_id);
  assert.equal(snap.name, 'Adapter Test Snapshot');

  const snapList = await memoryAdapter.listSnapshots();
  assert.ok(snapList.length > 0);

  await memoryAdapter.reset();
  const emptyBiz = await memoryAdapter.getAllBusinesses();
  assert.equal(emptyBiz.length, 0);

  const restoreRes = await memoryAdapter.restoreSnapshot(snap.snapshot_id);
  assert.equal(restoreRes.success, true);
  const restoredBiz = await memoryAdapter.getAllBusinesses();
  assert.equal(restoredBiz.length, 1);
  console.log('✅ 4. Snapshot creation, reset, and restoration verified.');

  // 5. Universal Proxy & Init
  await initDatabase('memory');
  assert.equal(getActiveEngine(), 'memory');
  const proxyStats = await db.getStats();
  assert.ok(typeof proxyStats === 'object');
  console.log('✅ 5. Universal Database Proxy and engine initialization verified.');

  console.log('\n🎉 ALL DATABASE ADAPTER TESTS PASSED CLEANLY!\n');
}

runAdapterTests();
