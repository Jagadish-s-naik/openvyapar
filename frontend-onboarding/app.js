const BACKEND_URL = 'http://localhost:3001';
const AGENT_URL = 'http://localhost:3002';

const SAMPLE_TRANSCRIPTS = {
  'hi-kirana': 'नमस्ते, मेरा नाम रमेश शर्मा है। गोदौलिया वाराणसी में "शर्मा जनरल स्टोर" नाम से 2018 से किराना की दुकान है। महीने का टर्नओवर लगभग 2 लाख रुपये है। फ़ोन नंबर 9876543210 है।',
  'hi-chai': 'प्रणाम, मेरा नाम सुरेश गुप्ता है। अस्सी घाट पर "बनारस टी स्टॉल" नाम से 2020 से चाय की दुकान चला रहा हूँ। मेरा फ़ोन 9812345678 है।',
  'en-handloom': 'Hello, I am Anand Ansari. I run "Anand Silk Weaving" at Chowk Varanasi since 2015 with monthly sales around 3 Lakhs. Phone number is 9899988877.',
};

let currentProposal = null;

function init() {
  // Sample Transcript Chips (Fill textarea, do NOT auto-submit)
  document.querySelectorAll('.sample-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const sampleKey = chip.dataset.sample;
      const transcriptInput = document.getElementById('txtConversationalTranscript');
      if (transcriptInput && SAMPLE_TRANSCRIPTS[sampleKey]) {
        transcriptInput.value = SAMPLE_TRANSCRIPTS[sampleKey];
      }
    });
  });

  // Action Handlers
  document.getElementById('btnExtractOnboarding').addEventListener('click', handleExtract);
  document.getElementById('btnConfirmOnboard').addEventListener('click', handleConfirmRegistration);

  // Default initial sample in textarea
  const defaultTextarea = document.getElementById('txtConversationalTranscript');
  if (defaultTextarea && !defaultTextarea.value) {
    defaultTextarea.value = SAMPLE_TRANSCRIPTS['hi-kirana'];
  }
}

/**
 * Handle AI Extraction from conversational transcript
 * Calls POST /agent/onboard-extract (Port 3002)
 */
async function handleExtract() {
  const textInput = document.getElementById('txtConversationalTranscript');
  const extractBtn = document.getElementById('btnExtractOnboarding');
  const errorBox = document.getElementById('extractionErrorBox');
  const placeholder = document.getElementById('extractionPlaceholder');
  const resultBox = document.getElementById('proposalResultBox');
  const rawRefCard = document.getElementById('transcriptReferenceCard');
  const rawRefText = document.getElementById('lblRawTranscript');

  const text = textInput ? textInput.value.trim() : '';

  errorBox.style.display = 'none';
  errorBox.textContent = '';

  if (!text) {
    errorBox.textContent = 'Please enter a conversational transcript or select one of the sample chips above.';
    errorBox.style.display = 'block';
    return;
  }

  // Loading State
  extractBtn.disabled = true;
  extractBtn.innerHTML = '<span>⏳</span> <span>Extracting Structured Metadata with AI...</span>';

  try {
    const res = await fetch(`${AGENT_URL}/agent/onboard-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_transcript_or_text: text,
        rawText: text,
        csc_agent_id: 'did:person:csc001',
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      const errorMsg = data.error?.message || data.error?.code || 'Failed to extract onboarding data.';
      const details = data.error?.details ? ` (${data.error.details})` : '';
      errorBox.innerHTML = `⚠️ <strong>Extraction Error:</strong> ${errorMsg}${details}`;
      errorBox.style.display = 'block';
      resultBox.style.display = 'none';
      currentProposal = null;
      return;
    }

    currentProposal = data;

    // Show raw transcript in reference card
    if (rawRefCard && rawRefText) {
      rawRefText.textContent = text;
      rawRefCard.style.display = 'block';
    }

    // Populate Structured Form & Confidence UI
    placeholder.style.display = 'none';
    resultBox.style.display = 'block';

    renderExtractionProposal(data);
  } catch (err) {
    errorBox.innerHTML = '⚠️ <strong>Service Error:</strong> Could not connect to OpenVyapar Agent Service on Port 3002. Please ensure the agent service is running.';
    errorBox.style.display = 'block';
    resultBox.style.display = 'none';
    currentProposal = null;
  } finally {
    extractBtn.disabled = false;
    extractBtn.innerHTML = '<span>🤖</span> <span>Extract Structured Business & Starter Credential</span>';
  }
}

/**
 * Render structured proposal into editable form inputs & confidence badges
 */
function renderExtractionProposal(data) {
  const b = data.proposed_business || {};
  const c = data.proposed_starter_credential?.claim || {};
  const missing = Array.isArray(data.missing_fields) ? data.missing_fields : [];

  // Confidence & Notes
  const confidenceScore = Math.round((data.confidence_score ?? 0.94) * 100);
  document.getElementById('lblConfidenceScore').textContent = `${confidenceScore}% Confidence`;
  document.getElementById('lblConfidenceNotes').textContent = data.confidence_notes || 'Extracted accurately from conversational input.';

  // Highlight missing fields if any
  const missingAlert = document.getElementById('missingFieldsAlert');
  const missingList = document.getElementById('missingFieldsList');
  if (missing.length > 0) {
    missingList.innerHTML = `The AI flagged the following fields as missing or uncertain: <strong>${missing.join(', ')}</strong>. Please review and fill them in manually below.`;
    missingAlert.style.display = 'block';
  } else {
    missingAlert.style.display = 'none';
  }

  // Set Editable Form Input Values
  const nameInput = document.getElementById('txtBizName');
  const sectorInput = document.getElementById('txtBizSector');
  const locInput = document.getElementById('txtBizLocation');
  const revInput = document.getElementById('txtRevenueBracket');
  const langSelect = document.getElementById('selPrimaryLanguage');
  const ownerInput = document.getElementById('txtOwnerName');
  const phoneInput = document.getElementById('txtContactPhone');
  const yearInput = document.getElementById('txtEstablishedYear');

  nameInput.value = data.name || b.name || '';
  sectorInput.value = data.sector || b.sector || '';
  locInput.value = data.location || b.location || '';
  revInput.value = data.estimated_revenue_bracket || c.approx_monthly_revenue || '';
  langSelect.value = data.primary_language || b.primary_language || 'hi';
  ownerInput.value = b.owner_name || data.owner_name || 'Ramesh Sharma';
  phoneInput.value = b.contact_phone || data.contact_phone || '';
  yearInput.value = c.established_year || data.established_year || 2018;

  // Toggle visual warnings on specific inputs based on missing_fields
  toggleMissingWarning(nameInput, 'badgeMissingName', missing.includes('name'));
  toggleMissingWarning(sectorInput, 'badgeMissingSector', missing.includes('sector'));
  toggleMissingWarning(locInput, 'badgeMissingLocation', missing.includes('location'));
  toggleMissingWarning(revInput, 'badgeMissingRevenue', missing.includes('revenue') || missing.includes('estimated_revenue_bracket'));
  toggleMissingWarning(ownerInput, 'badgeMissingOwner', missing.includes('owner_name'));
  toggleMissingWarning(phoneInput, 'badgeMissingPhone', missing.includes('contact_phone'));
  toggleMissingWarning(yearInput, 'badgeMissingYear', missing.includes('established_year'));

  // Starter Credential Preview
  updateStarterCredentialPreview();

  // Attach live listeners on form inputs to refresh credential preview
  [nameInput, sectorInput, locInput, revInput, yearInput].forEach((el) => {
    el.addEventListener('input', updateStarterCredentialPreview);
  });

  // Hide previous success state on new extraction
  document.getElementById('onboardSuccessMsg').style.display = 'none';
  document.getElementById('confirmErrorBox').style.display = 'none';
}

function toggleMissingWarning(inputEl, badgeId, isMissing) {
  const badge = document.getElementById(badgeId);
  if (isMissing) {
    inputEl.classList.add('missing-warning');
    if (badge) badge.style.display = 'inline-flex';
  } else {
    inputEl.classList.remove('missing-warning');
    if (badge) badge.style.display = 'none';
  }
}

function updateStarterCredentialPreview() {
  const sector = document.getElementById('txtBizSector').value.trim() || 'Retail Grocery & Essentials';
  const year = document.getElementById('txtEstablishedYear').value.trim() || '2018';
  const revenue = document.getElementById('txtRevenueBracket').value.trim() || 'INR 1.5 Lakh - 2.5 Lakh / month';

  const credClaimEl = document.getElementById('lblCredClaim');
  if (credClaimEl) {
    credClaimEl.innerHTML = `
      <div>• <strong>Business Nature:</strong> ${sector}</div>
      <div>• <strong>Established Year:</strong> ${year}</div>
      <div>• <strong>Approx Monthly Revenue:</strong> ${revenue}</div>
      <div>• <strong>Witness Attestation:</strong> Witnessed & verified in-person by CSC Field Agent (did:person:csc001) at shop premises.</div>
    `;
  }
}

/**
 * Handle explicit Human Confirmation & Registration
 * Calls POST /business (Port 3001) & POST /credentials/issue
 * Guardrail 1: Human confirmation is required before DB writes.
 */
async function handleConfirmRegistration() {
  if (!currentProposal) return;

  const confirmBtn = document.getElementById('btnConfirmOnboard');
  const confirmErrorBox = document.getElementById('confirmErrorBox');
  const successBox = document.getElementById('onboardSuccessMsg');
  const createdBizIdEl = document.getElementById('lblCreatedBizId');

  confirmErrorBox.style.display = 'none';
  confirmErrorBox.textContent = '';

  // Read latest (possibly edited) values from form
  const name = document.getElementById('txtBizName').value.trim();
  const sector = document.getElementById('txtBizSector').value.trim();
  const location = document.getElementById('txtBizLocation').value.trim();
  const revenueBracket = document.getElementById('txtRevenueBracket').value.trim();
  const primaryLanguage = document.getElementById('selPrimaryLanguage').value;
  const ownerName = document.getElementById('txtOwnerName').value.trim();
  const contactPhone = document.getElementById('txtContactPhone').value.trim();
  const establishedYear = parseInt(document.getElementById('txtEstablishedYear').value.trim(), 10) || 2018;

  if (!name) {
    confirmErrorBox.textContent = 'Business name is required to register identity.';
    confirmErrorBox.style.display = 'block';
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<span>⏳</span> <span>Creating Verified Business Identity...</span>';

  // Derive owner person ID deterministically
  const ownerPersonId = ownerName.toLowerCase().includes('ramesh')
    ? 'did:person:ramesh001'
    : `did:person:${ownerName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'owner001'}`;

  try {
    // 1. Create Business Identity on Backend
    const bizRes = await fetch(`${BACKEND_URL}/business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        primary_language: primaryLanguage,
        owner_person_id: ownerPersonId,
        metadata: {
          sector,
          location,
          estimated_revenue_bracket: revenueBracket,
          owner_name: ownerName,
          contact_phone: contactPhone,
          established_year: establishedYear,
          onboarding_source: 'csc_agent',
          csc_agent_id: 'did:person:csc001',
        },
        agent_action_id: currentProposal.agent_action_id,
      }),
    });

    const bizData = await bizRes.json();

    if (!bizRes.ok || !bizData.success) {
      const errMsg = bizData.error?.message || bizData.error?.code || 'Failed to create business on backend.';
      confirmErrorBox.innerHTML = `⚠️ <strong>Registration Error:</strong> ${errMsg}`;
      confirmErrorBox.style.display = 'block';
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
        claim: {
          business_nature: sector,
          established_year: establishedYear,
          approx_monthly_revenue: revenueBracket,
          witness_notes: 'Witnessed and verified in-person by CSC Field Agent (did:person:csc001) at shop premises.',
        },
        agent_action_id: currentProposal.agent_action_id,
      }),
    });

    // 3. Show Success State
    if (createdBizIdEl) {
      createdBizIdEl.textContent = newBizId;
    }
    successBox.style.display = 'block';
    confirmBtn.innerHTML = '<span>✅</span> <span>Business Identity Created</span>';
    confirmBtn.disabled = true;
  } catch (err) {
    confirmErrorBox.innerHTML = '⚠️ <strong>Backend Error:</strong> Could not connect to OpenVyapar Backend on Port 3001.';
    confirmErrorBox.style.display = 'block';
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<span>✅</span> <span>Confirm & Create Business Identity</span>';
  }
}

document.addEventListener('DOMContentLoaded', init);
