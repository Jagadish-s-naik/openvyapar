const BACKEND_URL = 'http://localhost:3001';
const AGENT_URL = 'http://localhost:3002';
const CURRENT_BIZ_ID = 'did:biz:sharma001';
let currentLanguage = 'en';

let loadedCredentials = [];
let pendingScopingAction = null;
let pendingConsentAction = null;

// Human-friendly scope labels across languages
const SCOPE_LABELS = {
  file_returns: {
    en: 'File Tax & GST Returns',
    hi: 'टैक्स और जीएसटी रिटर्न दाखिल करें',
    kn: 'ತೆರಿಗೆ ಮತ್ತು ಜಿಎಸ್‌ಟಿ ರಿಟರ್ನ್ಸ್ ಸಲ್ಲಿಸಿ',
    desc_en: 'Draft and file GSTR-1 and GSTR-3B filings',
  },
  view_credentials: {
    en: 'View Verified Credentials',
    hi: 'सत्यापित साख पत्र देखें',
    kn: 'ದೃಢೀಕೃತ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    desc_en: 'Read-only access to view business credentials',
  },
  generate_proof: {
    en: 'Generate Selective Proofs',
    hi: 'चुनिंदा प्रमाण बनाएं',
    kn: 'ಆಯ್ದ ಪುರಾವೆಗಳನ್ನು ರಚಿಸಿ',
    desc_en: 'Generate selective-disclosure proofs for lenders/marketplaces',
  },
  manage_delegation: {
    en: 'Manage Subordinate Delegations',
    hi: 'प्रतिनिधि अधिकार प्रबंधित करें',
    kn: 'ನಿಯೋಜಿತ ಹಕ್ಕುಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    desc_en: 'Issue and manage delegation tokens for staff',
  },
  transfer_ownership: {
    en: 'Transfer Business Ownership',
    hi: 'व्यावसायिक स्वामित्व हस्तांतरित करें',
    kn: 'ವ್ಯಾಪಾರ ಮಾಲೀಕತ್ವ ವರ್ಗಾಯಿಸಿ',
    desc_en: 'Succession and transfer of primary business identity',
  },
};

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
    confirmGrant: 'स्वीकार करें और अनुमति दें',
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
    confirmGrant: 'ದೃಢೀಕರಿಸಿ ಮತ್ತು ಹಕ್ಕುಗಳನ್ನು ನೀಡಿ',
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
    confirmGrant: 'Confirm & Grant Access',
  },
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
  const confirmBtn = document.getElementById('txtConfirmGrantBtn');
  if (confirmBtn) confirmBtn.textContent = dict.confirmGrant;

  if (pendingScopingAction) {
    renderScopingProposal(pendingScopingAction);
  }
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

    container.innerHTML = data.tokens.map((tok) => {
      const scopeLabels = tok.scopes.map((s) => {
        const item = SCOPE_LABELS[s];
        const label = item ? item[currentLanguage] || item.en : s.replace(/_/g, ' ');
        return `<span class="scope-pill">${label}</span>`;
      }).join('');

      return `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 0.85rem;">👤 ${tok.delegate?.name || tok.delegate_person_id}</strong>
            <span style="font-size: 0.75rem; color: ${tok.status === 'active' ? '#34d399' : '#f87171'}; font-weight: 700;">
              ${tok.status.toUpperCase()}
            </span>
          </div>
          <div class="scope-pills" style="margin-bottom: 8px;">
            ${scopeLabels}
          </div>
          ${tok.status === 'active' ? `
            <button class="btn btn-danger btn-revoke-tok" data-token="${tok.token_id}" style="font-size: 0.75rem; padding: 4px 10px;">
              Revoke Access
            </button>
          ` : ''}
        </div>
      `;
    }).join('');

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

function renderScopingProposal(data) {
  const box = document.getElementById('scopingProposalBox');
  const summaryEl = document.getElementById('proposalSummary');
  const excludedWhyEl = document.getElementById('proposalExcludedWhy');
  const checklistContainer = document.getElementById('proposalScopesChecklist');

  summaryEl.textContent = data.plain_summary || data.explanation || 'Minimal least-privilege scopes suggested for your representative.';
  excludedWhyEl.textContent = data.excluded_and_why || data.least_privilege_notes || 'All sensitive and unrequested permissions withheld.';

  // Render editable checklist (owner can UNCHECK, cannot ADD beyond proposed)
  checklistContainer.innerHTML = data.proposed_scopes.map((scopeId) => {
    const scopeMeta = SCOPE_LABELS[scopeId] || {
      en: scopeId.replace(/_/g, ' '),
      hi: scopeId,
      kn: scopeId,
    };
    const label = scopeMeta[currentLanguage] || scopeMeta.en;
    const desc = scopeMeta.desc_en ? ` — <span style="color: var(--text-dim); font-size: 0.74rem;">${scopeMeta.desc_en}</span>` : '';

    return `
      <label style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 7px 10px; border-radius: var(--radius-sm); cursor: pointer;">
        <input type="checkbox" class="proposed-scope-checkbox" value="${scopeId}" checked style="accent-color: var(--emerald); width: 16px; height: 16px;">
        <div style="font-size: 0.82rem; color: #fff;">
          <strong>${label}</strong>${desc}
        </div>
      </label>
    `;
  }).join('');

  box.style.display = 'block';
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
    const promptInput = document.getElementById('txtDelegationPrompt');
    const delegateNameInput = document.getElementById('txtDelegateName');
    const errorBox = document.getElementById('scopingErrorBox');
    const askBtn = document.getElementById('btnAskScopeAgent');
    const proposalBox = document.getElementById('scopingProposalBox');

    const promptText = promptInput.value.trim();
    const delegateName = delegateNameInput ? delegateNameInput.value.trim() : 'Vikas Mehta (CA)';

    errorBox.style.display = 'none';
    errorBox.textContent = '';

    if (!promptText) {
      errorBox.textContent = 'Please enter a delegation request in plain language (e.g. "I want my CA to file my taxes").';
      errorBox.style.display = 'block';
      return;
    }

    // Loading state
    askBtn.disabled = true;
    askBtn.innerHTML = '<span>⏳</span> <span>Analyzing Least-Privilege Scope...</span>';

    try {
      const res = await fetch(`${AGENT_URL}/agent/scope-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: CURRENT_BIZ_ID,
          natural_language_prompt: promptText,
          delegate_info: { name: delegateName },
          language: currentLanguage,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errMsg = data.error?.message || data.error?.code || 'Failed to suggest scoping.';
        errorBox.innerHTML = `⚠️ <strong>Scoping Error:</strong> ${errMsg}`;
        errorBox.style.display = 'block';
        proposalBox.style.display = 'none';
        pendingScopingAction = null;
        return;
      }

      pendingScopingAction = data;
      renderScopingProposal(data);
    } catch (err) {
      errorBox.innerHTML = '⚠️ <strong>Service Unavailable:</strong> Could not connect to OpenVyapar Agent Service on Port 3002.';
      errorBox.style.display = 'block';
      proposalBox.style.display = 'none';
      pendingScopingAction = null;
    } finally {
      askBtn.disabled = false;
      const dict = I18N[currentLanguage] || I18N.en;
      askBtn.innerHTML = `<span>🤖</span> <span>${dict.proposeScope}</span>`;
    }
  });

function slugifyPersonId(name) {
  if (!name || typeof name !== 'string') return 'did:person:ca001';
  const clean = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!clean) return 'did:person:ca001';
  if (clean.includes('vikas') || clean === 'ca' || clean.includes('ca001')) return 'did:person:ca001';
  if (clean.includes('priya')) return 'did:person:priya001';
  if (clean.includes('ramesh')) return 'did:person:ramesh001';
  if (clean.includes('aarav') || clean.includes('csc')) return 'did:person:csc001';
  return `did:person:${clean}`;
}

  // Explicit Confirm & Grant Access (Guardrail 1: human confirmation)
  document.getElementById('btnConfirmDelegation').addEventListener('click', async () => {
    if (!pendingScopingAction) return;

    const checkedBoxes = document.querySelectorAll('.proposed-scope-checkbox:checked');
    const selectedScopes = Array.from(checkedBoxes).map((cb) => cb.value);

    if (selectedScopes.length === 0) {
      alert('Please check at least one scope to grant access.');
      return;
    }

    const delegateNameInput = document.getElementById('txtDelegateName');
    const delegateName = delegateNameInput ? delegateNameInput.value.trim() : 'Vikas Mehta CA';
    const delegatePersonId = slugifyPersonId(delegateName);

    try {
      const res = await fetch(`${BACKEND_URL}/delegation/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: CURRENT_BIZ_ID,
          delegate_person_id: delegatePersonId,
          scopes: selectedScopes,
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
      } else {
        alert(`Failed to grant delegation: ${data.error?.message || 'Server error'}`);
      }
    } catch (err) {
      alert('Error connecting to backend server on Port 3001.');
    }
  });

  // Dismiss proposal without granting
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
        document.getElementById('consentPlainSummary').textContent = data.plain_summary || data.plain_language_explanation;
        const shared = data.will_share || data.shared_data_summary || [];
        const withheld = data.will_not_share || data.withheld_data_summary || [];
        document.getElementById('consentSharedList').innerHTML = shared.map((s) => `<li>${s}</li>`).join('');
        document.getElementById('consentWithheldList').innerHTML = withheld.map((w) => `<li>${w}</li>`).join('');
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

  // Transfer Ownership Modal (Beat 5)
  const transferModal = document.getElementById('transferModal');
  document.getElementById('btnTransferOwnershipModal').addEventListener('click', () => {
    transferModal.classList.add('active');
  });

  document.getElementById('btnCloseTransferModal').addEventListener('click', () => transferModal.classList.remove('active'));
  document.getElementById('btnCancelTransfer').addEventListener('click', () => transferModal.classList.remove('active'));

  document.getElementById('btnConfirmTransfer').addEventListener('click', async () => {
    const successorId = document.getElementById('successorSelect').value;
    try {
      const res = await fetch(`${BACKEND_URL}/business/${CURRENT_BIZ_ID}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_id: successorId,
          role_type: 'owner',
          granted_by: 'did:person:ramesh001',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 Succession Complete! Priya Sharma is now the primary owner of Sharma General Store. All accumulated credentials persist seamlessly.');
        transferModal.classList.remove('active');
        await refreshDashboard();
      }
    } catch (err) {
      alert('Failed to transfer ownership.');
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
