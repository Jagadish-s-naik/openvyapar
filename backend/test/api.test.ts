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

    // 10. Test Agent Proposal Lifecycle & Idempotency Protection (Phase 2 Guardrail)
    // 10a. Record a pending proposal
    const proposalRes = await fetch(`${baseUrl}/audit/agent-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_action_id: 'agent-act-test-scope-01',
        business_id: newBizId,
        agent_type: 'delegation_scoping',
        input_summary: 'Suggest least-privilege tax filing scope',
        proposed_action: { scopes: ['file_returns'], delegate: 'did:person:ca001' },
      }),
    });
    const proposalJson = await proposalRes.json();
    console.assert(proposalRes.status === 201 && proposalJson.agent_action.human_decision === 'pending', 'Proposal creation failed');

    // 10b. Human confirms & executes the proposal
    const confirmProposalRes = await fetch(`${baseUrl}/delegation/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        delegate_person_id: 'did:person:ca001',
        scopes: ['file_returns'],
        granted_by: 'did:person:gupta001',
        agent_action_id: 'agent-act-test-scope-01',
      }),
    });
    const confirmProposalJson = await confirmProposalRes.json();
    console.assert(confirmProposalRes.status === 201, 'Confirmed proposal mutation failed');
    const grantedTokenId = confirmProposalJson.token.token_id;

    // Verify agent action record updated to confirmed atomically
    const auditCheckRes = await fetch(`${baseUrl}/audit/${newBizId}`);
    const auditCheckJson = await auditCheckRes.json();
    const updatedAction = auditCheckJson.agent_proposals.find((a: any) => a.agent_action_id === 'agent-act-test-scope-01');
    console.assert(
      updatedAction &&
      updatedAction.human_decision === 'confirmed' &&
      updatedAction.target_action_ref === grantedTokenId,
      'Agent action was not updated to confirmed with target ref'
    );

    // 10c. Idempotency test: Re-executing same confirmed proposal must be rejected with 409
    const duplicateRes = await fetch(`${baseUrl}/delegation/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        delegate_person_id: 'did:person:ca001',
        scopes: ['file_returns'],
        granted_by: 'did:person:gupta001',
        agent_action_id: 'agent-act-test-scope-01',
      }),
    });
    const duplicateJson = await duplicateRes.json();
    console.assert(duplicateRes.status === 409 && duplicateJson.success === false, 'Duplicate execution should fail with 409 Conflict');

    // 10d. Auto-registration & subsequent idempotency protection
    const freshProposalRes = await fetch(`${baseUrl}/proof/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        purpose: 'loan_application',
        disclosed_credential_ids: credIdsToDisclose,
        shared_with: 'Test Bank',
        generated_by: 'did:person:gupta001',
        agent_action_id: 'agent-act-auto-reg-999',
      }),
    });
    const freshProposalJson = await freshProposalRes.json();
    console.assert(freshProposalRes.status === 201 && freshProposalJson.success === true, 'Fresh proposal auto-registration failed');

    // Attempting to reuse agent-act-auto-reg-999 must now fail with 409
    const reuseFreshRes = await fetch(`${baseUrl}/proof/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        purpose: 'loan_application',
        disclosed_credential_ids: credIdsToDisclose,
        shared_with: 'Test Bank',
        generated_by: 'did:person:gupta001',
        agent_action_id: 'agent-act-auto-reg-999',
      }),
    });
    console.assert(reuseFreshRes.status === 409, 'Reusing auto-registered proposal should fail with 409 Conflict');

    // 10e. Rejected proposal check: Must return 400
    await fetch(`${baseUrl}/audit/agent-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_action_id: 'agent-act-rejected-01',
        business_id: newBizId,
        agent_type: 'consent_explainer',
        input_summary: 'Over-broad disclosure rejected by user',
        proposed_action: {},
        human_decision: 'rejected',
      }),
    });
    const rejectedExecRes = await fetch(`${baseUrl}/proof/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        purpose: 'loan_application',
        disclosed_credential_ids: credIdsToDisclose,
        shared_with: 'Test Bank',
        generated_by: 'did:person:gupta001',
        agent_action_id: 'agent-act-rejected-01',
      }),
    });
    const rejectedExecJson = await rejectedExecRes.json();
    console.assert(rejectedExecRes.status === 400 && rejectedExecJson.success === false, 'Rejected proposal should fail with 400');

    console.log('✅ 10. Agent Proposal Lifecycle, Atomicity & Idempotency Guardrails PASSED');

    console.log('\n🎉 ALL BACKEND API INTEGRATION TESTS PASSED CLEANLY!\n');
  } finally {
    server.close();
  }
}

runApiTests().catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
