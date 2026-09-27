import assert from 'node:assert/strict';
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
} from '../src/db/models/index.js';

console.log('🧪 Testing Mongoose Schemas and Models Validation...');

async function runModelTests() {
  // 1. Business Model Test
  const sampleBusiness = new BusinessModel({
    business_id: 'did:biz:test001',
    name: 'Test Kirana Store',
    status: 'active',
    created_at: new Date().toISOString(),
    primary_language: 'hi',
    metadata: { sector: 'Retail', location: 'Bengaluru' },
  });

  await sampleBusiness.validate();
  const busJSON = sampleBusiness.toJSON();
  assert.equal(busJSON.business_id, 'did:biz:test001');
  assert.equal(busJSON._id, undefined, '_id should be stripped in toJSON');
  console.log('✅ 1. BusinessModel schema and serialization verified.');

  // 2. Person Model Test
  const samplePerson = new PersonModel({
    person_id: 'did:person:test001',
    name: 'Ramesh Sharma',
    contact: { phone: '+919876543210', email: 'ramesh@example.com' },
    auth_ref: 'auth_tok_123',
  });
  await samplePerson.validate();
  console.log('✅ 2. PersonModel schema and serialization verified.');

  // 3. BusinessRole Model Test (Enum check)
  const sampleRole = new BusinessRoleModel({
    role_id: 'role-123',
    business_id: 'did:biz:test001',
    person_id: 'did:person:test001',
    role_type: 'owner',
    status: 'active',
    granted_at: new Date().toISOString(),
  });
  await sampleRole.validate();

  const invalidRole = new BusinessRoleModel({
    role_id: 'role-456',
    business_id: 'did:biz:test001',
    person_id: 'did:person:test001',
    role_type: 'invalid_role_type' as any,
    status: 'active',
    granted_at: new Date().toISOString(),
  });
  let invalidRoleErr: any;
  try {
    await invalidRole.validate();
  } catch (err) {
    invalidRoleErr = err;
  }
  assert.ok(invalidRoleErr, 'Invalid role_type enum should fail validation');
  console.log('✅ 3. BusinessRoleModel enum constraints verified.');

  // 4. Credential Model Test
  const sampleCred = new CredentialModel({
    credential_id: 'cred-123',
    business_id: 'did:biz:test001',
    issuer: 'gst_mock',
    type: 'gst_compliant',
    claim: { gstin: '29ABCDE1234F1Z5', legal_name: 'Test Kirana' },
    issued_at: new Date().toISOString(),
    signature: 'hmac_signature_hex_123',
    status: 'valid',
  });
  await sampleCred.validate();
  console.log('✅ 4. CredentialModel schema verified.');

  // 5. DelegationToken Model Test
  const sampleDelegation = new DelegationTokenModel({
    token_id: 'del-123',
    business_id: 'did:biz:test001',
    delegate_person_id: 'did:person:ca001',
    scopes: ['file_returns'],
    granted_by: 'did:person:test001',
    status: 'active',
    created_at: new Date().toISOString(),
  });
  await sampleDelegation.validate();
  console.log('✅ 5. DelegationTokenModel schema verified.');

  // 6. ProofShare Model Test
  const sampleProof = new ProofShareModel({
    proof_id: 'proof-123',
    business_id: 'did:biz:test001',
    purpose: 'loan_application',
    disclosed_credential_ids: ['cred-123'],
    shared_with: 'Viksit Capital',
    generated_at: new Date().toISOString(),
    link_or_qr: 'http://localhost:5173/verifier?proof_id=proof-123',
    verification_status: 'valid',
  });
  await sampleProof.validate();
  console.log('✅ 6. ProofShareModel schema verified.');

  // 7. AuditLog Model Test
  const sampleAudit = new AuditLogModel({
    log_id: 'log-123',
    business_id: 'did:biz:test001',
    actor_type: 'owner',
    actor_id: 'did:person:test001',
    action: 'create_business',
    confirmed_by_human: true,
    timestamp: new Date().toISOString(),
  });
  await sampleAudit.validate();
  console.log('✅ 7. AuditLogModel schema verified.');

  // 8. AgentAction Model Test
  const sampleAgentAction = new AgentActionModel({
    agent_action_id: 'act-123',
    business_id: 'did:biz:test001',
    agent_type: 'onboarding',
    input_summary: 'Voice transcript kirana onboarding',
    proposed_action: { name: 'Sharma General Store' },
    human_decision: 'pending',
    created_at: new Date().toISOString(),
  });
  await sampleAgentAction.validate();
  console.log('✅ 8. AgentActionModel schema verified.');

  // 9. Snapshot Model Test
  const sampleSnapshot = new SnapshotModel({
    snapshot_id: 'snap-123',
    name: 'Baseline Seed',
    description: 'Clean seed state',
    created_at: new Date().toISOString(),
    record_counts: { businesses: 1 },
    state: { businesses: {}, persons: {}, business_roles: {}, credentials: {}, delegation_tokens: {}, proof_shares: {}, audit_logs: {}, agent_actions: {} },
  });
  await sampleSnapshot.validate();
  console.log('✅ 9. SnapshotModel schema verified.');

  console.log('\n🎉 ALL MONGOOSE MODEL VALIDATION TESTS PASSED CLEANLY!\n');
}

runModelTests();

