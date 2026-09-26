import { showToast } from './toast.js';

const BACKEND_URL = 'http://localhost:3001';
const AGENT_URL = 'http://localhost:3002';

const SAMPLE_TRANSCRIPTS = {
  'hi-kirana': 'नमस्ते, मेरा नाम रमेश शर्मा है। गोदौलिया वाराणसी में "शर्मा जनरल स्टोर" नाम से 2018 से किराना की दुकान है। महीने का टर्नओवर लगभग 2 लाख रुपये है। फ़ोन नंबर 9876543210 है।',
  'hi-vegetable': 'प्रणाम बाबूजी, मेरा नाम सुनीता देवी है। अस्सी घाट पर 10 साल से "सुनीता ताज़ा सब्ज़ी" का ठेला लगाती हूँ। महीने की आमदनी लगभग 45,000 रुपये है। आधार नहीं है, लेकिन साथ वाले दुकानदार गवाह हैं। फ़ोन 9811122233 है।',
  'kn-tea': 'ನಮಸ್ಕಾರ, ನನ್ನ ಹೆಸರು ಮಂಜುನಾಥ್. ಬೆಂಗಳೂರಿನ ಜಯನಗರದಲ್ಲಿ "ಶ್ರೀ ಮಂಜುನಾಥ ಟೀ ಸ್ಟಾಲ್" ಅನ್ನು 2019 ರಿಂದ ನಡೆಸುತ್ತಿದ್ದೇನೆ. ಮಾಸಿಕ ಆದಾಯ 80,000 ರೂ. ಫೋನ್ 9844455566.',
  'en-handloom': 'Hello, I am Anand Ansari. I run "Anand Silk Weaving" at Chowk Varanasi since 2015 with monthly sales around 3 Lakhs. Phone number is 9899988877.',
};

let currentProposal = null;

function init() {
  // Sample chips
  document.querySelectorAll('.sample-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.sample-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const sampleKey = chip.dataset.sample;
      document.getElementById('txtConversationalTranscript').value = SAMPLE_TRANSCRIPTS[sampleKey] || '';
      showToast('Sample transcript loaded. Click "Extract Structured Details" to proceed.', 'info', 2500);
    });
  });

  // Radio cards
  document.querySelectorAll('.radio-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.radio-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  document.getElementById('btnExtractOnboarding').addEventListener('click', handleExtract);
  document.getElementById('btnConfirmOnboard').addEventListener('click', handleConfirmRegistration);
  document.getElementById('btnRegisterAnother').addEventListener('click', resetOnboardingForm);

  // Language switch buttons
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      showToast(`Language switched to ${target.textContent.trim()}`, 'info', 1500);
    });
  });

  // Set default sample
  document.getElementById('txtConversationalTranscript').value = SAMPLE_TRANSCRIPTS['hi-kirana'];
}

async function handleExtract() {
  const text = document.getElementById('txtConversationalTranscript').value.trim();
  if (!text) {
    showToast('Please enter a transcript or select a sample on the left.', 'warning');
    return;
  }

  const btnExtract = document.getElementById('btnExtractOnboarding');
  const btnText = document.getElementById('btnExtractText');
  btnExtract.disabled = true;
  btnText.textContent = 'Extracting Structured Metadata...';

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
      showToast('Extraction failed. Please check transcript syntax.', 'error');
      return;
    }

    currentProposal = data;

    document.getElementById('extractionPlaceholder').style.display = 'none';
    document.getElementById('onboardSuccessScreen').style.display = 'none';
    document.getElementById('proposalResultBox').style.display = 'block';

    const b = data.proposed_business;
    document.getElementById('lblBizName').textContent = b.name;
    document.getElementById('lblBizMeta').textContent = `Sector: ${b.sector} • Location: ${b.location}`;
    document.getElementById('lblOwnerMeta').textContent = `Proprietor: ${b.owner_name} • Phone: ${b.contact_phone}`;

    const c = data.proposed_starter_credential.claim;
    document.getElementById('lblCredClaim').innerHTML = `
      <div><strong>Nature:</strong> ${c.business_nature}</div>
      <div><strong>Established:</strong> ${c.established_year}</div>
      <div><strong>Monthly Revenue:</strong> ${c.approx_monthly_revenue}</div>
      <div><strong>Witness:</strong> ${c.witness_notes}</div>
    `;
    showToast('Structured data extracted. Review details and confirm registration.', 'success');
  } catch (err) {
    showToast('Agent service error. Ensure agent-service is running on Port 3002.', 'error');
  } finally {
    btnExtract.disabled = false;
    btnText.textContent = 'Extract Structured Details';
  }
}

async function handleConfirmRegistration() {
  if (!currentProposal) return;

  const btnConfirm = document.getElementById('btnConfirmOnboard');
  btnConfirm.disabled = true;
  btnConfirm.innerHTML = '<span>Minting Business DID & Anchoring Credential...</span>';

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
      showToast('Business registration failed.', 'error');
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

    // 3. Render Rich Success Showcase
    document.getElementById('proposalResultBox').style.display = 'none';
    document.getElementById('onboardSuccessScreen').style.display = 'block';

    document.getElementById('succBizName').textContent = currentProposal.proposed_business.name;
    document.getElementById('succDidTag').textContent = newBizId;
    document.getElementById('succOwnerName').textContent = currentProposal.proposed_business.owner_name;
    document.getElementById('succDateIssued').textContent = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    document.getElementById('smsDidText').textContent = newBizId;

    showToast('Genesis Business DID and Starter Credential successfully anchored.', 'success', 6000);
  } catch (err) {
    showToast('Error connecting to backend on port 3001.', 'error');
  } finally {
    btnConfirm.disabled = false;
    btnConfirm.innerHTML = `
      <span class="svg-icon">
        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </span>
      <span>Confirm & Issue Business DID</span>
    `;
  }
}

function resetOnboardingForm() {
  document.getElementById('onboardSuccessScreen').style.display = 'none';
  document.getElementById('proposalResultBox').style.display = 'none';
  document.getElementById('extractionPlaceholder').style.display = 'block';
  document.getElementById('txtConversationalTranscript').value = '';
  currentProposal = null;
}

document.addEventListener('DOMContentLoaded', init);
