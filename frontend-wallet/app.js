const BACKEND_URL = 'http://localhost:3001';
const AGENT_URL = 'http://localhost:3002';
const CURRENT_BIZ_ID = 'did:biz:sharma001';
let currentLanguage = 'en';

let loadedCredentials = [];
let pendingScopingAction = null;
let pendingConsentAction = null;

// Translation Dictionaries
const I18N = {
  hi: {
    title: 'ओपन व्यापार - व्यावसायिक पहचान वॉलेट',
    genProof: 'चुनिंदा प्रमाण बनाएं',
    timeSkip: 'समय-छलांग (प्रमाण जारी करें)',
    credentials: 'सत्यापित साख पत्र',
    delegation: 'प्रतिनिधि अधिकार',
    delegationDesc: 'अपने सीए या मुनीम को न्यूनतम व प्रतिसंहरणीय अनुमति दें।',
    proposeScope: 'एआई: न्यूनतम अधिकार प्रस्तावित करें',
    audit: 'अपरिवर्तनीय ऑडिट लॉग',
    confirm: 'स्वीकार करें और अनुमति दें',
  },
  kn: {
    title: 'ಓಪನ್ ವ್ಯಾಪಾರ್ - ವ್ಯಾಪಾರ ಗುರುತು ವಾಲೆಟ್',
    genProof: 'ಆಯ್ದ ಪುರಾವೆ ರಚಿಸಿ',
    timeSkip: 'ಸಮಯ-ದಾಟು (ಪ್ರಮಾಣಪತ್ರ ವಿತರಣೆ)',
    credentials: 'ದೃಢೀಕೃತ ಪ್ರಮಾಣಪತ್ರಗಳು',
    delegation: 'ನಿಯೋಜಿತ ಹಕ್ಕುಗಳು',
    delegationDesc: 'ನಿಮ್ಮ ಸಿಎ ಅಥವಾ ವ್ಯವಸ್ಥಾಪಕರಿಗೆ ಕನಿಷ್ಠ ಹಕ್ಕುಗಳನ್ನು ನೀಡಿ.',
    proposeScope: 'ಎಐ: ಕನಿಷ್ಠ ವ್ಯಾಪ್ತಿ ಶಿಫಾರಸು',
    audit: 'ಆಡಿಟ್ ಇತಿಹಾಸ',
    confirm: 'ದೃಢೀಕರಿಸಿ',
  },
  en: {
    title: 'OpenVyapar — Business Identity Wallet',
    genProof: 'Generate Selective Proof',
    timeSkip: 'Time-Skip (Issue Batch)',
    credentials: 'Verifiable Credentials',
    delegation: 'Scoped Delegation',
    delegationDesc: 'Grant minimal, revocable access to your CA or manager using natural language.',
    proposeScope: 'AI: Propose Minimal Scopes',
    audit: 'Audit Log (Immutable Trail)',
    confirm: 'Confirm & Grant',
  }
};

// Initialize
async function init() {
  setupLanguageSwitcher();
  setupEventListeners();
  await refreshDashboard();
}

function setupLanguageSwitcher() {
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentLanguage = btn.dataset.lang;
      applyTranslations();
    });
  });
}

function applyTranslations() {
  const dict = I18N[currentLanguage] || I18N.en;
  document.getElementById('txtGenProofBtn').textContent = dict.genProof;
  document.getElementById('txtTimeSkipBtn').textContent = dict.timeSkip;
  document.getElementById('txtCredentialsTitle').textContent = dict.credentials;
  document.getElementById('txtDelegationTitle').textContent = dict.delegation;
  document.getElementById('txtDelegationDesc').textContent = dict.delegationDesc;
  document.getElementById('txtProposeScopeBtn').textContent = dict.proposeScope;
  document.getElementById('txtAuditTitle').textContent = dict.audit;
}

async function refreshDashboard() {
  await Promise.all([
    fetchBusinessProfile(),
    fetchCredentials(),
    fetchDelegations(),
    fetchAuditTrail(),
  ]);
}

async function fetchBusinessProfile() {
  try {
    const res = await fetch(`${BACKEND_URL}/business/${CURRENT_BIZ_ID}`);
    const data = await res.json();
    if (data.success) {
      document.getElementById('bizName').firstChild.textContent = `${data.business.name} `;
      document.getElementById('bizSector').textContent = `🛒 ${data.business.metadata.sector}`;
      document.getElementById('bizLoc').textContent = data.business.metadata.location;
    }
  } catch (err) {
    console.error('Failed to fetch business profile:', err);
  }
}

async function fetchCredentials() {
  const container = document.getElementById('credentialsContainer');
  try {
    const res = await fetch(`${BACKEND_URL}/credentials/${CURRENT_BIZ_ID}`);
    const data = await res.json();
    if (!data.success) return;

    loadedCredentials = data.credentials;
    document.getElementById('credCountBadge').textContent = `${loadedCredentials.length} issued`;

    if (loadedCredentials.length === 0) {
      container.innerHTML = '<div style="color: var(--text-dim);">No credentials issued yet.</div>';
      return;
    }

    container.innerHTML = loadedCredentials.map((cred) => {
      let badgeClass = 'badge-gst';
      let issuerLabel = 'Mock GSTN';
      if (cred.issuer === 'bank_mock') { badgeClass = 'badge-bank'; issuerLabel = 'State Bank of India'; }
      if (cred.issuer === 'marketplace_mock') { badgeClass = 'badge-mkt'; issuerLabel = 'BharatMart ONDC'; }
      if (cred.issuer === 'agent_witnessed') { badgeClass = 'badge-csc'; issuerLabel = 'CSC Field Witness'; }

      const claimRows = Object.entries(cred.claim)
        .slice(0, 4)
        .map(([k, v]) => `<li><span>${formatClaimKey(k)}</span><strong>${v}</strong></li>`)
        .join('');

      return `
        <div class="cred-card">
          <div class="cred-header">
            <span class="issuer-badge ${badgeClass}">${issuerLabel}</span>
            <span style="font-size: 0.75rem; color: var(--text-dim);">${new Date(cred.issued_at).toLocaleDateString()}</span>
          </div>
          <div class="cred-title">${formatCredType(cred.type)}</div>
          <ul class="cred-claim-list">${claimRows}</ul>
          <div class="cred-footer">
            <span class="sig-status">🔒 HMAC Verified</span>
            <span style="font-family: monospace; font-size: 0.7rem; color: var(--text-dim);">${cred.credential_id.slice(0, 14)}...</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<div style="color: var(--rose);">Could not connect to backend server (Port 3001).</div>';
  }
}

async function fetchDelegations() {
  const container = document.getElementById('activeDelegationsList');
  try {
    const res = await fetch(`${BACKEND_URL}/delegation/${CURRENT_BIZ_ID}`);
    const data = await res.json();
    if (!data.success || data.tokens.length === 0) {
      container.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-dim);">No active delegations.</div>';
      return;
    }

    container.innerHTML = data.tokens.map((tok) => `
      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 0.85rem;">👤 ${tok.delegate?.name || tok.delegate_person_id}</strong>
          <span style="font-size: 0.75rem; color: ${tok.status === 'active' ? '#34d399' : '#f87171'}; font-weight: 700;">
            ${tok.status.toUpperCase()}
          </span>
        </div>
        <div class="scope-pills" style="margin-bottom: 8px;">
          ${tok.scopes.map((s) => `<span class="scope-pill">${s}</span>`).join('')}
        </div>
        ${tok.status === 'active' ? `
          <button class="btn btn-danger btn-revoke-tok" data-token="${tok.token_id}" style="font-size: 0.75rem; padding: 4px 10px;">
            Revoke Access
          </button>
        ` : ''}
      </div>
    `).join('');

    // Attach revoke handlers
    document.querySelectorAll('.btn-revoke-tok').forEach((b) => {
      b.addEventListener('click', async (e) => {
        const tokenId = e.target.dataset.token;
        await revokeToken(tokenId);
      });
    });
  } catch (err) {
    container.innerHTML = '<div style="color: var(--text-dim); font-size: 0.8rem;">Could not load delegations.</div>';
  }
}

async function fetchAuditTrail() {
  const container = document.getElementById('auditTimeline');
  try {
    const res = await fetch(`${BACKEND_URL}/audit/${CURRENT_BIZ_ID}`);
    const data = await res.json();
    if (!data.success || data.audit_logs.length === 0) {
      container.innerHTML = '<li style="color: var(--text-dim); font-size: 0.8rem;">No audit records.</li>';
      return;
    }

    container.innerHTML = data.audit_logs.slice(0, 6).map((log) => `
      <li class="timeline-item">
        <div class="timeline-time">${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • by ${log.actor_type} (${log.actor_id})</div>
        <div class="timeline-action">${formatAuditAction(log.action)}</div>
      </li>
    `).join('');
  } catch (err) {
    container.innerHTML = '<li style="color: var(--text-dim); font-size: 0.8rem;">Could not load audit log.</li>';
  }
}

function setupEventListeners() {
  // Beat 2 Time-Skip Simulation
  document.getElementById('btnSimulateTimeSkip').addEventListener('click', async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/mocks/issue-batch/${CURRENT_BIZ_ID}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('⏩ Time-Skip Completed! GSTN, State Bank of India, and BharatMart have issued credentials.');
        await refreshDashboard();
      }
    } catch (err) {
      alert('Error triggering mock issuers.');
    }
  });

  // AI Delegation Scoping Proposal
  document.getElementById('btnAskScopeAgent').addEventListener('click', async () => {
    const prompt = document.getElementById('txtDelegationPrompt').value;
    if (!prompt.trim()) {
      alert('Please enter a delegation instruction (e.g. "I want my CA to file taxes")');
      return;
    }

    try {
      const res = await fetch(`${AGENT_URL}/agent/scope-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: CURRENT_BIZ_ID,
          natural_language_prompt: prompt,
          delegate_info: { name: 'Vikas Mehta CA', phone: '+91 98111 22334' },
          language: currentLanguage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        pendingScopingAction = data;
        const box = document.getElementById('scopingProposalBox');
        document.getElementById('proposalScopes').innerHTML = data.proposed_scopes.map((s) => `<span class="scope-pill">${s}</span>`).join('');
        document.getElementById('proposalExplanation').textContent = data.explanation;
        document.getElementById('proposalWithheld').textContent = data.least_privilege_notes;
        box.style.display = 'block';
      }
    } catch (err) {
      alert('Agent service (Port 3002) unavailable.');
    }
  });

  // Confirm Delegation
  document.getElementById('btnConfirmDelegation').addEventListener('click', async () => {
    if (!pendingScopingAction) return;
    try {
      const res = await fetch(`${BACKEND_URL}/delegation/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: CURRENT_BIZ_ID,
          delegate_person_id: 'did:person:ca001',
          scopes: pendingScopingAction.proposed_scopes,
          granted_by: 'did:person:ramesh001',
          agent_action_id: pendingScopingAction.agent_action_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('scopingProposalBox').style.display = 'none';
        document.getElementById('txtDelegationPrompt').value = '';
        pendingScopingAction = null;
        await refreshDashboard();
      }
    } catch (err) {
      alert('Error confirming delegation.');
    }
  });

  document.getElementById('btnDismissScoping').addEventListener('click', () => {
    document.getElementById('scopingProposalBox').style.display = 'none';
    pendingScopingAction = null;
  });

  // Proof Modal
  const modal = document.getElementById('proofModal');
  document.getElementById('btnGenerateProofModal').addEventListener('click', () => {
    populateProofModalCredentials();
    document.getElementById('consentExplanationBox').style.display = 'none';
    document.getElementById('generatedProofResult').style.display = 'none';
    modal.classList.add('active');
  });

  document.getElementById('btnCloseProofModal').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('btnCancelProof').addEventListener('click', () => modal.classList.remove('active'));

  // Consent Explainer Agent
  document.getElementById('btnExplainConsent').addEventListener('click', async () => {
    const selectedCredIds = Array.from(document.querySelectorAll('.cred-checkbox:checked')).map((c) => c.value);
    const purpose = document.getElementById('proofPurposeSelect').value;
    const recipient = document.getElementById('proofRecipientInput').value;

    try {
      const res = await fetch(`${AGENT_URL}/agent/consent-explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: CURRENT_BIZ_ID,
          purpose,
          selected_credential_ids: selectedCredIds,
          recipient_name: recipient,
          language: currentLanguage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        pendingConsentAction = data;
        const box = document.getElementById('consentExplanationBox');
        document.getElementById('consentPlainSummary').textContent = data.plain_language_explanation;
        document.getElementById('consentSharedList').innerHTML = data.shared_data_summary.map((s) => `<li>${s}</li>`).join('');
        document.getElementById('consentWithheldList').innerHTML = data.withheld_data_summary.map((w) => `<li>${w}</li>`).join('');
        box.style.display = 'block';
      }
    } catch (err) {
      alert('Consent explainer agent error.');
    }
  });

  // Confirm Generate Proof
  document.getElementById('btnConfirmGenerateProof').addEventListener('click', async () => {
    const selectedCredIds = Array.from(document.querySelectorAll('.cred-checkbox:checked')).map((c) => c.value);
    const purpose = document.getElementById('proofPurposeSelect').value;
    const recipient = document.getElementById('proofRecipientInput').value;

    if (selectedCredIds.length === 0) {
      alert('Please select at least one credential to disclose.');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/proof/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: CURRENT_BIZ_ID,
          purpose,
          disclosed_credential_ids: selectedCredIds,
          shared_with: recipient,
          generated_by: 'did:person:ramesh001',
          agent_action_id: pendingConsentAction?.agent_action_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const resultBox = document.getElementById('generatedProofResult');
        const link = document.getElementById('proofShareLink');
        const verifierBtn = document.getElementById('btnOpenInVerifier');

        const verifierUrl = `http://localhost:5174?proof_id=${data.proof.proof_id}`;
        link.textContent = verifierUrl;
        link.href = verifierUrl;
        verifierBtn.href = verifierUrl;

        resultBox.style.display = 'block';
        await fetchAuditTrail();
      }
    } catch (err) {
      alert('Failed to generate proof share.');
    }
  });
}

function populateProofModalCredentials() {
  const container = document.getElementById('selectiveCredCheckboxes');
  container.innerHTML = loadedCredentials.map((c) => `
    <label style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: var(--radius-sm); cursor: pointer;">
      <input type="checkbox" class="cred-checkbox" value="${c.credential_id}" checked style="accent-color: var(--primary);">
      <div>
        <div style="font-size: 0.85rem; font-weight: 600; color: #fff;">${formatCredType(c.type)}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim);">${c.issuer} • ${c.credential_id}</div>
      </div>
    </label>
  `).join('');
}

async function revokeToken(tokenId) {
  if (!confirm('Are you sure you want to revoke this delegation token immediately?')) return;
  try {
    const res = await fetch(`${BACKEND_URL}/delegation/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: CURRENT_BIZ_ID,
        token_id: tokenId,
        revoked_by: 'did:person:ramesh001',
      }),
    });
    const data = await res.json();
    if (data.success) {
      await refreshDashboard();
    }
  } catch (err) {
    alert('Failed to revoke token.');
  }
}

// Helpers
function formatCredType(type) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatClaimKey(k) {
  return k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAuditAction(action) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

document.addEventListener('DOMContentLoaded', init);
