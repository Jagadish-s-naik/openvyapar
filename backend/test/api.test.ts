import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/db/seed.js';
import { verifyCredentialSignature } from '../src/utils/crypto.js';
import type { Server } from 'node:http';

async function runApiTests() {
  console.log('🧪 Running OpenVyapar Backend API Integration Tests...');
  seedDatabase();

  const app = createApp();
  const server: Server = app.listen(3999);
  const baseUrl = 'http://localhost:3999';

  try {
    // 1. Health Check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    console.assert(healthRes.status === 200, 'Health check failed');
    console.log('✅ 1. Health Check PASSED:', healthJson.service);

    // 2. Get Seeded Business & Credentials
    const bizRes = await fetch(`${baseUrl}/business/did:biz:sharma001`);
    const bizJson = await bizRes.json();
    console.assert(bizJson.business.name === 'Sharma General Store', 'Business retrieval failed');
    console.log('✅ 2. Business Fetch PASSED:', bizJson.business.name);

    const credsRes = await fetch(`${baseUrl}/credentials/did:biz:sharma001`);
    const credsJson = await credsRes.json();
    console.assert(credsJson.credentials.length >= 4, 'Expected >= 4 seeded credentials');
    console.log(`✅ 3. Credentials Fetch PASSED (${credsJson.credentials.length} credentials)`);

    // 4. Test Cryptographic HMAC Signature & Tamper Detection
    const sampleCred = credsJson.credentials[0];
    const sigCheck = verifyCredentialSignature(sampleCred);
    console.assert(sigCheck.isValid === true, 'Signature should be valid on genuine credential');

    // Simulate claim alteration
    const tamperedCred = {
      ...sampleCred,
      claim: { ...sampleCred.claim, turnover_bracket: 'above_100Cr_fake' },
    };
    const tamperCheck = verifyCredentialSignature(tamperedCred);
    console.assert(tamperCheck.isValid === false, 'Tampered claim must fail signature verification');
    console.log('✅ 4. HMAC Signature & Tamper Detection PASSED');

    // 5. Create New Business (Zero-Footprint Onboarding Output)
    const createBizRes = await fetch(`${baseUrl}/business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Gupta Tea Stall',
        primary_language: 'hi',
        owner_person_id: 'did:person:gupta001',
        metadata: { sector: 'Food & Beverage', location: 'Assi Ghat, Varanasi' },
      }),
    });
    const createBizJson = await createBizRes.json();
    console.assert(createBizRes.status === 201, 'Create business failed');
    const newBizId = createBizJson.business.business_id;
    console.log('✅ 5. Business Creation PASSED:', newBizId);

    // 6. Test Beat 2 Mock Batch Issuance (Time-skip)
    const batchRes = await fetch(`${baseUrl}/mocks/issue-batch/${newBizId}`, { method: 'POST' });
    const batchJson = await batchRes.json();
    console.assert(batchRes.status === 201 && batchJson.credentials.length === 3, 'Batch issuance failed');
    console.log('✅ 6. Mock Issuers Batch Trigger PASSED (GST, Bank, Marketplace credentials issued)');

    // 7. Test Delegation Grant & Revoke
    const grantRes = await fetch(`${baseUrl}/delegation/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        delegate_person_id: 'did:person:ca001',
        scopes: ['file_returns'],
        granted_by: 'did:person:gupta001',
      }),
    });
    const grantJson = await grantRes.json();
    console.assert(grantRes.status === 201, 'Grant delegation failed');
    const tokenId = grantJson.token.token_id;

    const revokeRes = await fetch(`${baseUrl}/delegation/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        token_id: tokenId,
        revoked_by: 'did:person:gupta001',
      }),
    });
    const revokeJson = await revokeRes.json();
    console.assert(revokeJson.token.status === 'revoked', 'Revoke delegation failed');
    console.log('✅ 7. Delegation Grant & Revoke Lifecycle PASSED');

    // 8. Test Selective Disclosure Proof & Verifier Verification
    const newCredsRes = await fetch(`${baseUrl}/credentials/${newBizId}`);
    const newCredsJson = await newCredsRes.json();
    const credIdsToDisclose = newCredsJson.credentials.slice(0, 2).map((c: any) => c.credential_id);

    const proofRes = await fetch(`${baseUrl}/proof/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        purpose: 'loan_application',
        disclosed_credential_ids: credIdsToDisclose,
        shared_with: 'Viksit Capital Lender',
        generated_by: 'did:person:gupta001',
      }),
    });
    const proofJson = await proofRes.json();
    console.assert(proofRes.status === 201, 'Generate proof failed');
    const proofId = proofJson.proof.proof_id;

    const verifyRes = await fetch(`${baseUrl}/proof/verify/${proofId}`);
    const verifyJson = await verifyRes.json();
    console.assert(verifyJson.verification_status === 'valid', 'Verifier validation failed');
    console.assert(verifyJson.credentials.length === 2, 'Expected 2 disclosed credentials in proof');
    console.log('✅ 8. Selective Disclosure Proof & Verifier Inspection PASSED');

    // 9. Verify Immutable Audit Log
    const auditRes = await fetch(`${baseUrl}/audit/${newBizId}`);
    const auditJson = await auditRes.json();
    console.assert(auditJson.audit_logs.length >= 4, 'Audit logs should contain all mutation actions');
    console.log(`✅ 9. Audit Trail PASSED (${auditJson.audit_logs.length} logged actions recorded)`);

    console.log('\n🎉 ALL BACKEND API INTEGRATION TESTS PASSED CLEANLY!\n');
  } finally {
    server.close();
  }
}

runApiTests().catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
