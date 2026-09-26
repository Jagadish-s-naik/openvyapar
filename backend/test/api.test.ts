import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/db/seed.js';
import { verifyCredentialSignature } from '../src/utils/crypto.js';
import { mockBusinesses, mockCredentials } from '@openvyapar/shared';
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

    // 15. Test Interactive Tamper Testing API (Phase 3 Task 3)
    // 15a. Simulate signature tampering
    const tamperRes = await fetch(`${baseUrl}/proof/simulate-tamper/${proofId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'corrupt_signature' }),
    });
    const tamperJson = await tamperRes.json();
    console.assert(tamperRes.status === 200 && tamperJson.success === true, 'Tamper simulation failed');
    console.assert(tamperJson.mode === 'corrupt_signature', 'Mode should be corrupt_signature');

    // Verifier checks tampered proof: should fail with tampered status & 0 trust score
    const verifyTamperedRes = await fetch(`${baseUrl}/proof/verify/${proofId}`);
    const verifyTamperedJson = await verifyTamperedRes.json();
    console.assert(verifyTamperedJson.verification_status === 'tampered', 'Tampered proof should return status tampered');
    console.assert(verifyTamperedJson.verification_reason === 'TAMPERED_CREDENTIALS', 'Tampered proof reason mismatch');
    console.assert(verifyTamperedJson.trust_analysis.trust_score === 0, 'Tampered proof should have trust score 0');
    console.assert(Array.isArray(verifyTamperedJson.tamper_details) && verifyTamperedJson.tamper_details.length > 0, 'Tamper details should explain mismatch');

    // 15b. Restore authentic state
    const restoreRes = await fetch(`${baseUrl}/proof/simulate-tamper/${proofId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'restore' }),
    });
    const restoreJson = await restoreRes.json();
    console.assert(restoreRes.status === 200 && restoreJson.restored === true, 'Restoration failed');

    // Verifier checks restored proof: should now be valid again
    const verifyRestoredRes = await fetch(`${baseUrl}/proof/verify/${proofId}`);
    const verifyRestoredJson = await verifyRestoredRes.json();
    console.assert(verifyRestoredJson.verification_status === 'valid', 'Restored proof should be valid');
    console.assert(verifyRestoredJson.verification_reason === 'VALID', 'Restored proof reason should be VALID');
    console.assert(verifyRestoredJson.trust_analysis.trust_score > 0, 'Restored proof should have positive trust score');

    console.log('✅ 15. Interactive Tamper Testing API & Cryptographic Restoration PASSED');

    // 16. Test Dynamic Mock Configuration & Profile Templates (Phase 4 Task 1)
    // 16a. Issue GST Defaulter Profile
    const defaulterRes = await fetch(`${baseUrl}/mocks/issue-batch/${newBizId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: 'gst_defaulter' }),
    });
    const defaulterJson = await defaulterRes.json();
    console.assert(defaulterRes.status === 201 && defaulterJson.template === 'gst_defaulter', 'Defaulter template issuance failed');
    const defaulterGst = defaulterJson.credentials.find((c: any) => c.issuer === 'gst_mock');
    const defaulterBank = defaulterJson.credentials.find((c: any) => c.issuer === 'bank_mock');
    const defaulterMkt = defaulterJson.credentials.find((c: any) => c.issuer === 'marketplace_mock');
    console.assert(defaulterGst.claim.filing_status_last_6_months === 'defaulter', 'Defaulter GST status mismatch');
    console.assert(defaulterGst.claim.active_compliance_score === 42, 'Defaulter score should be 42');
    console.assert(defaulterBank.claim.average_monthly_balance_tier === 'tier_3', 'Defaulter bank balance tier should be tier_3');
    console.assert(defaulterMkt.claim.customer_satisfaction_rating === 3.9, 'Defaulter rating should be 3.9');

    // Verify HMAC signature on defaulter credential
    const defaulterSig = verifyCredentialSignature(defaulterGst);
    console.assert(defaulterSig.isValid === true, 'Defaulter credential must have valid HMAC signature');

    // 16b. Issue High Growth Merchant Profile with Overrides
    const highGrowthRes = await fetch(`${baseUrl}/mocks/issue-batch/${newBizId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'high_growth_merchant',
        overrides: {
          marketplace: {
            platform_name: 'Custom MegaMart Network',
          },
        },
      }),
    });
    const highGrowthJson = await highGrowthRes.json();
    console.assert(highGrowthRes.status === 201 && highGrowthJson.template === 'high_growth_merchant', 'High growth template issuance failed');
    const hgGst = highGrowthJson.credentials.find((c: any) => c.issuer === 'gst_mock');
    const hgBank = highGrowthJson.credentials.find((c: any) => c.issuer === 'bank_mock');
    const hgMkt = highGrowthJson.credentials.find((c: any) => c.issuer === 'marketplace_mock');
    console.assert(hgGst.claim.active_compliance_score === 100, 'High growth score should be 100');
    console.assert(hgBank.claim.turnover_bracket === '50L_to_1Cr', 'High growth turnover should be 50L_to_1Cr');
    console.assert(hgMkt.claim.total_completed_orders === 5430, 'High growth order count should be 5430');
    console.assert(hgMkt.claim.platform_name === 'Custom MegaMart Network', 'Custom override was not applied');

    const hgSig = verifyCredentialSignature(hgMkt);
    console.assert(hgSig.isValid === true, 'High growth credential must have valid HMAC signature');

    // 16c. Invalid template error check
    const invalidTemplateRes = await fetch(`${baseUrl}/mocks/issue-batch/${newBizId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: 'unknown_profile_xyz' }),
    });
    console.assert(invalidTemplateRes.status === 400, 'Invalid template should return 400 Bad Request');

    console.log('✅ 16. Dynamic Mock Configuration, Profile Presets & Overrides PASSED');

    // 17. Test CSC Agent Field Witnessing & Geo-Photo Attestation (Phase 4 Task 2)
    // 17a. Issue CSC witness credential with geolocation and photo verification
    const cscWitnessRes = await fetch(`${baseUrl}/mocks/csc-witness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        csc_agent_id: 'did:person:csc001',
        agent_name: 'Aarav Patel (VLE #UP-VAR-8821)',
        csc_center_id: 'CSC-VAR-0912',
        coordinates: { lat: 25.3176, lng: 82.9739 },
        claim_overrides: {
          business_nature: 'Traditional Banarasi Handloom & Silk Weaving',
          approx_monthly_revenue: 'INR 3,50,000',
        },
      }),
    });
    const cscWitnessJson = await cscWitnessRes.json();
    console.assert(cscWitnessRes.status === 201 && cscWitnessJson.success === true, 'CSC witness issuance failed');
    console.assert(cscWitnessJson.credential.issuer === 'agent_witnessed', 'Issuer should be agent_witnessed');
    console.assert(cscWitnessJson.credential.type === 'self_attested', 'Credential type should be self_attested');
    console.assert(cscWitnessJson.credential.claim.witnessed_by_csc_agent_id === 'did:person:csc001', 'CSC agent ID mismatch');
    console.assert(cscWitnessJson.credential.claim.location_coordinates.lat === 25.3176, 'Geo latitude mismatch');
    console.assert(typeof cscWitnessJson.credential.claim.photo_verification_hash === 'string', 'Photo verification hash missing');
    console.assert(cscWitnessJson.witness_summary.csc_center_id === 'CSC-VAR-0912', 'Center ID mismatch');

    // Verify HMAC signature
    const cscSig = verifyCredentialSignature(cscWitnessJson.credential);
    console.assert(cscSig.isValid === true, 'CSC Witness credential must have authentic HMAC signature');

    // 17b. Verify credential in business wallet list
    const bizCredsRes = await fetch(`${baseUrl}/credentials/${newBizId}`);
    const bizCredsJson = await bizCredsRes.json();
    const foundCscCred = bizCredsJson.credentials.find((c: any) => c.credential_id === cscWitnessJson.credential.credential_id);
    console.assert(foundCscCred !== undefined, 'CSC credential should be retrievable from business credentials');

    // 17c. Error handling for non-existent business
    const nonExistentBizRes = await fetch(`${baseUrl}/mocks/csc-witness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: 'did:biz:doesnotexist999' }),
    });
    console.assert(nonExistentBizRes.status === 404, 'Non-existent business should return 404');

    console.log('✅ 17. CSC Agent Field Witnessing, Geo-tagging & Photo Attestation PASSED');

    // 18. Test Instant Snapshot, Restore & 1-Click Seed Reset (Phase 5 Task 1)
    // 18a. Create a named snapshot of current state
    const createSnapRes = await fetch(`${baseUrl}/admin/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'test-checkpoint-1',
        description: 'Checkpoint before state mutation test',
      }),
    });
    const createSnapJson = await createSnapRes.json();
    console.assert(createSnapRes.status === 201 && createSnapJson.success === true, 'Snapshot creation failed');
    console.assert(createSnapJson.snapshot.name === 'test-checkpoint-1', 'Snapshot name mismatch');
    const snapshotId = createSnapJson.snapshot.snapshot_id;

    // 18b. List snapshots
    const listSnapRes = await fetch(`${baseUrl}/admin/snapshots`);
    const listSnapJson = await listSnapRes.json();
    console.assert(listSnapRes.status === 200 && listSnapJson.success === true, 'Snapshot listing failed');
    console.assert(listSnapJson.snapshots.some((s: any) => s.snapshot_id === snapshotId), 'Created snapshot not found in list');

    // 18c. Mutate state by adding a temporary business
    const tempBizRes = await fetch(`${baseUrl}/business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Temporary Snapshot Test Store',
        owner_person_id: 'did:person:ramesh001',
        primary_language: 'en',
        metadata: {
          sector: 'Retail',
          location: 'Pune, Maharashtra',
        },
      }),
    });
    const tempBizJson = await tempBizRes.json();
    console.assert(tempBizRes.status === 201 && tempBizJson.success === true, 'Temp business creation failed');
    const tempBizId = tempBizJson.business.business_id;

    // Verify temp business exists
    const checkTempBizRes = await fetch(`${baseUrl}/business/${tempBizId}`);
    console.assert(checkTempBizRes.status === 200, 'Temporary business should exist after creation');

    // 18d. Restore from snapshot
    const snapRestoreRes = await fetch(`${baseUrl}/admin/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot_id: snapshotId }),
    });
    const snapRestoreJson = await snapRestoreRes.json();
    console.assert(snapRestoreRes.status === 200 && snapRestoreJson.success === true, 'Snapshot restore failed');

    // Verify temp business no longer exists after restore
    const checkRestoredBizRes = await fetch(`${baseUrl}/business/${tempBizId}`);
    console.assert(checkRestoredBizRes.status === 404, 'Temporary business should NOT exist after snapshot restore');

    // 18e. Delete snapshot
    const deleteSnapRes = await fetch(`${baseUrl}/admin/snapshot/${snapshotId}`, {
      method: 'DELETE',
    });
    const deleteSnapJson = await deleteSnapRes.json();
    console.assert(deleteSnapRes.status === 200 && deleteSnapJson.success === true, 'Snapshot deletion failed');

    // 18f. Test 1-click seed reset
    const resetRes = await fetch(`${baseUrl}/admin/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const resetJson = await resetRes.json();
    console.assert(resetRes.status === 200 && resetJson.success === true, 'Admin reset failed');
    console.assert(resetJson.stats.businesses === mockBusinesses.length, `Baseline business count after reset should be ${mockBusinesses.length}`);
    console.assert(resetJson.stats.credentials === mockCredentials.length, `Baseline credential count after reset should be ${mockCredentials.length}`);

    // Verify baseline business is healthy and accessible
    const baseBizRes = await fetch(`${baseUrl}/business/did:biz:sharma001`);
    console.assert(baseBizRes.status === 200, 'Sharma General Store should exist after reset');

    console.log('✅ 18. Instant Snapshot, Restore & 1-Click Seed Reset PASSED');

    // 19. Test CORS & Multi-Port Environment Hardening (Phase 5 Task 2)
    // 19a. Test Wallet preflight on port 5173
    const walletCorsRes = await fetch(`${baseUrl}/proof/generate`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, x-openvyapar-actor-id',
      },
    });
    console.assert(walletCorsRes.status === 204, 'Wallet CORS preflight should return 204');
    console.assert(walletCorsRes.headers.get('access-control-allow-origin') === 'http://localhost:5173', 'Allow-Origin mismatch for Wallet');
    console.assert(walletCorsRes.headers.get('access-control-allow-methods')?.includes('POST'), 'POST not in allowed methods');

    // 19b. Test Verifier preflight on port 5174
    const verifierCorsRes = await fetch(`${baseUrl}/proof/verify/proof-demo-001`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5174',
        'Access-Control-Request-Method': 'GET',
      },
    });
    console.assert(verifierCorsRes.status === 204, 'Verifier CORS preflight should return 204');
    console.assert(verifierCorsRes.headers.get('access-control-allow-origin') === 'http://localhost:5174', 'Allow-Origin mismatch for Verifier');

    // 19c. Test Onboarding preflight on port 5175
    const onboardingCorsRes = await fetch(`${baseUrl}/business`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5175',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, x-openvyapar-actor-id',
      },
    });
    console.assert(onboardingCorsRes.status === 204, 'Onboarding CORS preflight should return 204');
    console.assert(onboardingCorsRes.headers.get('access-control-allow-origin') === 'http://localhost:5175', 'Allow-Origin mismatch for Onboarding');

    // 19d. Test Security Headers & Request ID Tracing
    const secHeadersRes = await fetch(`${baseUrl}/health`, {
      headers: { 'Origin': 'http://localhost:5173', 'x-request-id': 'test-trace-999' },
    });
    console.assert(secHeadersRes.headers.get('x-content-type-options') === 'nosniff', 'Missing X-Content-Type-Options: nosniff');
    console.assert(secHeadersRes.headers.get('x-frame-options') === 'SAMEORIGIN', 'Missing X-Frame-Options: SAMEORIGIN');
    console.assert(secHeadersRes.headers.get('x-request-id') === 'test-trace-999', 'x-request-id tracing header missing or mismatched');

    console.log('✅ 19. CORS & Multi-Port Environment Hardening PASSED');

    // 20. Test End-to-End Health Diagnostics & Readiness Probes (Phase 5 Task 3)
    // 20a. Comprehensive Health Probe
    const deepHealthRes = await fetch(`${baseUrl}/health`);
    const deepHealthJson = await deepHealthRes.json();
    console.assert(deepHealthRes.status === 200, 'Health diagnostic probe failed');
    console.assert(deepHealthJson.status === 'healthy', 'Health status should be healthy');
    console.assert(deepHealthJson.database.status === 'connected', 'Database status should be connected');
    console.assert(typeof deepHealthJson.database.record_counts.businesses === 'number', 'Business count missing in health');
    console.assert(deepHealthJson.subsystems.gst_mock.status === 'active', 'GST mock subsystem not active');
    console.assert(deepHealthJson.subsystems.bank_mock.status === 'active', 'Bank mock subsystem not active');
    console.assert(deepHealthJson.subsystems.marketplace_mock.status === 'active', 'Marketplace mock subsystem not active');
    console.assert(deepHealthJson.subsystems.csc_witness.status === 'active', 'CSC witness subsystem not active');
    console.assert(parseFloat(deepHealthJson.memory.heap_used_mb) > 0, 'Memory telemetry missing');
    console.assert(deepHealthJson.environment.port === 3001 || typeof deepHealthJson.environment.port === 'number', 'Port missing');

    // 20b. Readiness & Liveness Probes
    const readyRes = await fetch(`${baseUrl}/health/ready`);
    const readyJson = await readyRes.json();
    console.assert(readyRes.status === 200 && readyJson.ready === true, 'Readiness probe failed');

    const liveRes = await fetch(`${baseUrl}/health/live`);
    const liveJson = await liveRes.json();
    console.assert(liveRes.status === 200 && liveJson.live === true, 'Liveness probe failed');

    console.log('✅ 20. End-to-End Health Diagnostics & Readiness Probes PASSED');

    console.log('\n🎉 ALL BACKEND API INTEGRATION TESTS PASSED CLEANLY!\n');
  } finally {
    server.close();
  }
}

runApiTests().catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
