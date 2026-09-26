const BACKEND_URL = 'http://localhost:3001';
const AGENT_URL = 'http://localhost:3002';

const SAMPLE_TRANSCRIPTS = {
  'hi-kirana': 'नमस्ते, मेरा नाम रमेश शर्मा है। गोदौलिया वाराणसी में "शर्मा जनरल स्टोर" नाम से 2018 से किराना की दुकान है। महीने का टर्नओवर लगभग 2 लाख रुपये है। फ़ोन नंबर 9876543210 है।',
  'hi-chai': 'प्रणाम, मेरा नाम सुरेश गुप्ता है। अस्सी घाट पर "बनारस टी स्टॉल" नाम से 2020 से चाय की दुकान चला रहा हूँ। मेरा फ़ोन 9812345678 है।',
  'en-handloom': 'Hello, I am Anand Ansari. I run "Anand Silk Weaving" at Chowk Varanasi since 2015 with monthly sales around 3 Lakhs. Phone number is 9899988877.',
};

let currentProposal = null;

function init() {
  document.querySelectorAll('.sample-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const sampleKey = chip.dataset.sample;
      document.getElementById('txtConversationalTranscript').value = SAMPLE_TRANSCRIPTS[sampleKey] || '';
    });
  });

  document.getElementById('btnExtractOnboarding').addEventListener('click', handleExtract);
  document.getElementById('btnConfirmOnboard').addEventListener('click', handleConfirmRegistration);

  // Set default sample
  document.getElementById('txtConversationalTranscript').value = SAMPLE_TRANSCRIPTS['hi-kirana'];
}

async function handleExtract() {
  const text = document.getElementById('txtConversationalTranscript').value.trim();
  if (!text) {
    alert('Please enter a transcript or click one of the demo samples.');
    return;
  }

  try {
    const res = await fetch(`${AGENT_URL}/agent/onboard-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_transcript_or_text: text,
        csc_agent_id: 'did:person:csc001',
      }),
    });
    const data = await res.json();
    if (!data.success) {
      alert('Extraction failed.');
      return;
    }

    currentProposal = data;

    document.getElementById('extractionPlaceholder').style.display = 'none';
    document.getElementById('proposalResultBox').style.display = 'block';

    const b = data.proposed_business;
    document.getElementById('lblBizName').textContent = b.name;
    document.getElementById('lblBizMeta').textContent = `Sector: ${b.sector} • Location: ${b.location}`;
    document.getElementById('lblOwnerMeta').textContent = `Proprietor: ${b.owner_name} • Phone: ${b.contact_phone}`;

    const c = data.proposed_starter_credential.claim;
    document.getElementById('lblCredClaim').innerHTML = `
      <div>• <strong>Nature:</strong> ${c.business_nature}</div>
      <div>• <strong>Established:</strong> ${c.established_year}</div>
      <div>• <strong>Approx Revenue:</strong> ${c.approx_monthly_revenue}</div>
      <div>• <strong>Witness Note:</strong> ${c.witness_notes}</div>
    `;
  } catch (err) {
    alert('Agent service error. Make sure agent-service is running on Port 3002.');
  }
}

async function handleConfirmRegistration() {
  if (!currentProposal) return;

  try {
    // 1. Create Business on Backend
    const bizRes = await fetch(`${BACKEND_URL}/business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: currentProposal.proposed_business.name,
        primary_language: currentProposal.proposed_business.primary_language,
        owner_person_id: 'did:person:ramesh001',
        metadata: {
          sector: currentProposal.proposed_business.sector,
          location: currentProposal.proposed_business.location,
          onboarding_source: 'csc_agent',
          csc_agent_id: 'did:person:csc001',
        },
        agent_action_id: currentProposal.agent_action_id,
      }),
    });
    const bizData = await bizRes.json();
    if (!bizData.success) {
      alert('Registration failed.');
      return;
    }

    const newBizId = bizData.business.business_id;

    // 2. Issue Starter Self-Attested Credential
    await fetch(`${BACKEND_URL}/credentials/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: newBizId,
        issuer: 'agent_witnessed',
        type: 'self_attested',
        claim: currentProposal.proposed_starter_credential.claim,
      }),
    });

    document.getElementById('onboardSuccessMsg').style.display = 'block';
  } catch (err) {
    alert('Error connecting to backend.');
  }
}

document.addEventListener('DOMContentLoaded', init);
