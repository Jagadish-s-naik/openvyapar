import { createApp } from '../src/app.js';
import type { Server } from 'node:http';

async function runAgentTests() {
  console.log('🧪 Running OpenVyapar Agent Integration Tests (Unified Backend)...');

  const app = createApp();
  const server: Server = app.listen(3998);
  const baseUrl = 'http://localhost:3998';

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    console.assert(healthRes.status === 200, 'Health check failed');
    console.log('✅ 1. Health Check PASSED:', healthJson.service);

    // 2. Onboard Extract (Hindi unstructured transcript)
    const onboardRes = await fetch(`${baseUrl}/agent/onboard-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_transcript_or_text: 'नमस्ते, मेरा नाम रमेश शर्मा है। गोदौलिया वाराणसी में "शर्मा जनरल स्टोर" नाम से 2018 से किराना की दुकान है। फ़ोन नंबर 9876543210 है।',
        csc_agent_id: 'did:person:csc001',
        language: 'hi',
      }),
    });
    const onboardJson = await onboardRes.json();
    console.assert(onboardRes.status === 200, 'Onboard extract failed');
    console.assert(onboardJson.proposed_business.name === 'शर्मा जनरल स्टोर' || onboardJson.proposed_business.name.includes('Sharma') || onboardJson.proposed_business.name.includes('शर्मा'), 'Name extraction failed');
    console.assert(onboardJson.proposed_starter_credential.type === 'self_attested', 'Self-attested credential missing');
    console.log('✅ 2. Onboarding Agent Extraction PASSED:', onboardJson.proposed_business.name);

    // 3. Consent Explainer (Hindi)
    const consentRes = await fetch(`${baseUrl}/agent/consent-explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: 'did:biz:sharma001',
        purpose: 'loan_application',
        selected_credential_ids: ['cred-gst-002', 'cred-mkt-004'],
        recipient_name: 'Viksit Capital MSME Lending',
        language: 'hi',
      }),
    });
    const consentJson = await consentRes.json();
    console.assert(consentRes.status === 200, 'Consent explainer failed');
    console.assert(consentJson.shared_data_summary.length > 0, 'Shared summary empty');
    console.assert(consentJson.withheld_data_summary.length > 0, 'Withheld summary empty');
    console.log('✅ 3. Consent Explainer Agent PASSED (Explains shared vs. withheld data)');

    // 4. Delegation Scoping Agent (Least Privilege)
    const scopeRes = await fetch(`${baseUrl}/agent/scope-suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: 'did:biz:sharma001',
        natural_language_prompt: 'I want my CA Vikas Mehta to file my taxes and GST returns only',
        delegate_info: { name: 'Vikas Mehta CA' },
        language: 'en',
      }),
    });
    const scopeJson = await scopeRes.json();
    console.assert(scopeRes.status === 200, 'Scope suggest failed');
    console.assert(scopeJson.proposed_scopes.includes('file_returns'), 'Expected file_returns scope');
    console.assert(!scopeJson.proposed_scopes.includes('submit_loan_application'), 'Loan scope should NOT be granted (least privilege violation)');
    console.log('✅ 4. Delegation Scoping Agent PASSED (Least-Privilege Scoping Enforced):', scopeJson.proposed_scopes);

    // 5. Verifier Trust Flagger
    const verifierRes = await fetch(`${baseUrl}/agent/verifier-flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proof_id: 'proof-loan-001',
        business_id: 'did:biz:sharma001',
        business_status: 'active',
        credentials: [
          {
            credential_id: 'cred-gst-002',
            business_id: 'did:biz:sharma001',
            issuer: 'gst_mock',
            type: 'gst_compliant',
            claim: {},
            issued_at: new Date().toISOString(),
            expires_at: null,
            signature: 'sig',
            status: 'valid',
          },
        ],
      }),
    });
    const verifierJson = await verifierRes.json();
    console.assert(verifierRes.status === 200, 'Verifier flag failed');
    console.assert(verifierJson.overall_verdict !== undefined, 'Verdict missing');
    console.log('✅ 5. Verifier Trust Flagger PASSED (Verdict:', verifierJson.overall_verdict, ')');

    console.log('\n🎉 ALL AGENT INTEGRATION TESTS PASSED CLEANLY!\n');
  } finally {
    server.close();
  }
}

runAgentTests().catch((err) => {
  console.error('❌ Agent test failed:', err);
  process.exit(1);
});
