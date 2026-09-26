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

    // 11. Test Enriched Audit Trail & Unified Timeline API (Phase 2 Task 2)
    const timelineRes = await fetch(`${baseUrl}/audit/${newBizId}/timeline`);
    const timelineJson = await timelineRes.json();
    console.assert(timelineRes.status === 200, 'Timeline fetch failed');
    console.assert(timelineJson.success === true && timelineJson.timeline.length >= 8, 'Expected >= 8 timeline events');
    
    // Verify event structure
    const sampleEvent = timelineJson.timeline[0];
    console.assert(sampleEvent.event_id && sampleEvent.category && sampleEvent.title && sampleEvent.actor, 'Invalid timeline event structure');
    
    // Verify enriched audit fields
    const auditLogEvent = timelineJson.timeline.find((t: any) => t.event_type === 'audit_log');
    console.assert(auditLogEvent.ip_address && auditLogEvent.origin && auditLogEvent.actor.role, 'Missing enriched audit fields');

    // Test category filter
    const delegationTimelineRes = await fetch(`${baseUrl}/audit/${newBizId}/timeline?category=delegation`);
    const delegationTimelineJson = await delegationTimelineRes.json();
    console.assert(
      delegationTimelineJson.timeline.every((t: any) => t.category === 'delegation'),
      'Category filter failed'
    );

    // Test sort order
    const ascTimelineRes = await fetch(`${baseUrl}/audit/${newBizId}/timeline?sort=asc`);
    const ascTimelineJson = await ascTimelineRes.json();
    const firstTime = new Date(ascTimelineJson.timeline[0].timestamp).getTime();
    const lastTime = new Date(ascTimelineJson.timeline[ascTimelineJson.timeline.length - 1].timestamp).getTime();
    console.assert(firstTime <= lastTime, 'Ascending sort order failed');

    console.log(`✅ 11. Enriched Audit Trail & Timeline API PASSED (${timelineJson.count} timeline events delivered)`);

    // 12. Test Multi-Persona Auth Context & Permission Guards (Phase 2 Task 3)
    // 12a. Fetch available personas
    const personasRes = await fetch(`${baseUrl}/auth/personas`);
    const personasJson = await personasRes.json();
    console.assert(personasRes.status === 200 && personasJson.personas.length >= 5, 'Persona list fetch failed');

    // 12b. Inspect active persona session via header
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'x-openvyapar-actor-id': 'did:person:ramesh001' },
    });
    const meJson = await meRes.json();
    console.assert(meJson.authenticated === true && meJson.person.name === 'Ramesh Sharma', 'Auth session inspection failed');

    // 12c. Test auto-population of actor ID in mutations
    const autoPopRes = await fetch(`${baseUrl}/delegation/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-openvyapar-actor-id': 'did:person:gupta001',
      },
      body: JSON.stringify({
        business_id: newBizId,
        delegate_person_id: 'did:person:ca001',
        scopes: ['view_compliance'],
      }),
    });
    const autoPopJson = await autoPopRes.json();
    console.assert(autoPopRes.status === 201 && autoPopJson.token.granted_by === 'did:person:gupta001', 'Actor ID auto-population failed');

    // 12d. Permission check: Unauthorized persona attempting owner action gets 403 Forbidden
    const unauthRes = await fetch(`${baseUrl}/delegation/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-openvyapar-actor-id': 'did:person:ca001', // CA is a delegate, not an owner
      },
      body: JSON.stringify({
        business_id: newBizId,
        delegate_person_id: 'did:person:priya001',
        scopes: ['full_delegation'],
      }),
    });
    const unauthJson = await unauthRes.json();
    console.assert(unauthRes.status === 403 && unauthJson.success === false, 'Unauthorized role should fail with 403 Forbidden');

    console.log('✅ 12. Multi-Persona Simulation, Actor Auto-population & 403 Guardrails PASSED');

    // 13. Test Proof Expiration & Single-Use Quota Enforcement (Phase 3 Task 1)
    // 13a. Test input validation for max_uses and expires_at
    const invalidMaxUsesRes = await fetch(`${baseUrl}/proof/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        purpose: 'loan_application',
        disclosed_credential_ids: credIdsToDisclose,
        shared_with: 'Test Bank',
        generated_by: 'did:person:gupta001',
        max_uses: -5,
      }),
    });
    console.assert(invalidMaxUsesRes.status === 400, 'Invalid max_uses should fail with 400');

    const invalidExpiresRes = await fetch(`${baseUrl}/proof/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        purpose: 'loan_application',
        disclosed_credential_ids: credIdsToDisclose,
        shared_with: 'Test Bank',
        generated_by: 'did:person:gupta001',
        expires_at: 'invalid-date-string',
      }),
    });
    console.assert(invalidExpiresRes.status === 400, 'Invalid expires_at should fail with 400');

    // 13b. Single-use token (max_uses: 1)
    const singleUseProofRes = await fetch(`${baseUrl}/proof/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        purpose: 'loan_application',
        disclosed_credential_ids: credIdsToDisclose,
        shared_with: 'Single Use Lender',
        generated_by: 'did:person:gupta001',
        max_uses: 1,
      }),
    });
    const singleUseProofJson = await singleUseProofRes.json();
    console.assert(singleUseProofRes.status === 201 && singleUseProofJson.proof.max_uses === 1, 'Single-use proof generation failed');
    const singleUseProofId = singleUseProofJson.proof.proof_id;

    // First inspection: valid, use_count = 1
    const firstVerifyRes = await fetch(`${baseUrl}/proof/verify/${singleUseProofId}`);
    const firstVerifyJson = await firstVerifyRes.json();
    console.assert(firstVerifyRes.status === 200, 'First verify failed');
    console.assert(firstVerifyJson.verification_status === 'valid', 'First inspection should be valid');
    console.assert(firstVerifyJson.use_count === 1, 'First inspection use_count should be 1');
    console.assert(firstVerifyJson.verification_reason === 'VALID', 'First inspection reason should be VALID');

    // Second inspection: rejected with max_uses_exceeded, use_count = 2, trust_score = 0
    const secondVerifyRes = await fetch(`${baseUrl}/proof/verify/${singleUseProofId}`);
    const secondVerifyJson = await secondVerifyRes.json();
    console.assert(secondVerifyRes.status === 200, 'Second verify request failed');
    console.assert(secondVerifyJson.verification_status === 'max_uses_exceeded', 'Second inspection should exceed max uses');
    console.assert(secondVerifyJson.verification_reason === 'PROOF_MAX_USES_EXCEEDED', 'Second inspection reason should be PROOF_MAX_USES_EXCEEDED');
    console.assert(secondVerifyJson.use_count === 2, 'Second inspection use_count should be 2');
    console.assert(secondVerifyJson.trust_analysis.trust_score === 0, 'Trust score should be 0 when quota exceeded');

    // 13c. Expired proof (expires_at in past)
    const expiredProofRes = await fetch(`${baseUrl}/proof/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        purpose: 'loan_application',
        disclosed_credential_ids: credIdsToDisclose,
        shared_with: 'Expired Loan Officer',
        generated_by: 'did:person:gupta001',
        expires_at: '2020-01-01T00:00:00.000Z',
      }),
    });
    const expiredProofJson = await expiredProofRes.json();
    console.assert(expiredProofRes.status === 201, 'Expired proof generation failed');
    const expiredProofId = expiredProofJson.proof.proof_id;

    const expiredVerifyRes = await fetch(`${baseUrl}/proof/verify/${expiredProofId}`);
    const expiredVerifyJson = await expiredVerifyRes.json();
    console.assert(expiredVerifyRes.status === 200, 'Expired verify request failed');
    console.assert(expiredVerifyJson.verification_status === 'expired', 'Verification status should be expired');
    console.assert(expiredVerifyJson.verification_reason === 'PROOF_EXPIRED', 'Verification reason should be PROOF_EXPIRED');
    console.assert(expiredVerifyJson.trust_analysis.trust_score === 0, 'Trust score should be 0 for expired proof');

    console.log('✅ 13. Proof Expiration & Single-Use Quota Enforcement PASSED');

    // 14. Test Granular Attribute Redaction & Sub-Hash Verification (Phase 3 Task 2)
    // 14a. Validation check: unknown attribute name should return 400
    const bankCredId = newCredsJson.credentials.find((c: any) => c.type === 'income_bracket')?.credential_id || credIdsToDisclose[0];
    const invalidAttrRes = await fetch(`${baseUrl}/proof/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        purpose: 'loan_application',
        disclosed_credential_ids: [bankCredId],
        shared_with: 'Fintech Underwriter',
        generated_by: 'did:person:gupta001',
        disclosed_attributes: {
          [bankCredId]: ['non_existent_field'],
        },
      }),
    });
    console.assert(invalidAttrRes.status === 400, 'Unknown attribute in disclosed_attributes should fail with 400');

    // 14b. Generate proof disclosing only turnover_bracket & relationship_tenure_months
    const granularProofRes = await fetch(`${baseUrl}/proof/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        purpose: 'loan_application',
        disclosed_credential_ids: [bankCredId],
        shared_with: 'Fintech Underwriter',
        generated_by: 'did:person:gupta001',
        disclosed_attributes: {
          [bankCredId]: ['turnover_bracket', 'relationship_tenure_months'],
        },
      }),
    });
    const granularProofJson = await granularProofRes.json();
    console.assert(granularProofRes.status === 201, 'Granular proof generation failed');
    console.assert(granularProofJson.proof.redaction_manifest?.[bankCredId], 'Redaction manifest missing on proof');
    const granularProofId = granularProofJson.proof.proof_id;

    // 14c. Verifier inspects granular proof
    const granularVerifyRes = await fetch(`${baseUrl}/proof/verify/${granularProofId}`);
    const granularVerifyJson = await granularVerifyRes.json();
    console.assert(granularVerifyRes.status === 200, 'Granular verify fetch failed');
    console.assert(granularVerifyJson.verification_status === 'valid', 'Granular proof verification should be valid');
    console.assert(granularVerifyJson.verification_reason === 'VALID', 'Verification reason should be VALID');

    const verifiedBankCred = granularVerifyJson.credentials.find((c: any) => c.credential_id === bankCredId);
    console.assert(verifiedBankCred, 'Verified bank credential missing');
    console.assert(verifiedBankCred.claim.turnover_bracket !== '[REDACTED]', 'turnover_bracket should be disclosed');
    console.assert(verifiedBankCred.claim.relationship_tenure_months !== '[REDACTED]', 'relationship_tenure_months should be disclosed');
    console.assert(verifiedBankCred.claim.account_category === '[REDACTED]', 'account_category should be redacted');
    console.assert(verifiedBankCred.claim.average_monthly_balance_tier === '[REDACTED]', 'average_monthly_balance_tier should be redacted');
    console.assert(granularVerifyJson.redaction_summary?.[bankCredId], 'Redaction summary missing for credential');
    console.assert(granularVerifyJson.redaction_summary[bankCredId].disclosed.includes('turnover_bracket'), 'Redaction summary disclosed list mismatch');
    console.assert(granularVerifyJson.redaction_summary[bankCredId].redacted.includes('account_category'), 'Redaction summary redacted list mismatch');

    console.log('✅ 14. Granular Attribute Redaction & Sub-Hash Verification PASSED');

    console.log('\n🎉 ALL BACKEND API INTEGRATION TESTS PASSED CLEANLY!\n');
  } finally {
    server.close();
  }
}

runApiTests().catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
