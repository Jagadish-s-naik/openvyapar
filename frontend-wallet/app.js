import { showToast } from './toast.js';

const BACKEND_URL = 'http://localhost:3001';
const AGENT_URL = 'http://localhost:3002';
const CURRENT_BIZ_ID = 'did:biz:sharma001';
let currentLanguage = 'en';

let loadedCredentials = [];
let loadedDelegations = [];
let pendingScopingAction = null;
let currentProofData = null;
let isTamperSimulated = false;
let currentOnboardProposal = null;

const SLUG_TITLES = {
  credentials: 'Verifiable Credentials',
  delegations: 'Scoped Delegations',
  proofs: 'Selective Proofs',
  succession: 'Succession & Ownership Transfer',
  audit: 'Immutable Audit Trail',
  verifier: 'Verifier & Underwriting',
  onboarding: 'CSC Zero-Footprint Onboarding',
};

const SAMPLE_TRANSCRIPTS = {
  'hi-kirana': 'नमस्ते, मेरा नाम रमेश शर्मा है। गोदौलिया वाराणसी में "शर्मा जनरल स्टोर" नाम से 2018 से किराना की दुकान है। महीने का टर्नओवर लगभग 2 लाख रुपये है। फ़ोन नंबर 9876543210 है।',
  'hi-vegetable': 'प्रणाम बाबूजी, मेरा नाम सुनीता देवी है। अस्सी घाट पर 10 साल से "सुनीता ताज़ा सब्ज़ी" का ठेला लगाती हूँ। महीने की आमदनी लगभग 45,000 रुपये है। आधार नहीं है, लेकिन साथ वाले दुकानदार गवाह हैं। फ़ोन 9811122233 है।',
  'kn-tea': 'ನಮಸ್ಕಾರ, ನನ್ನ ಹೆಸರು ಮಂಜುನಾಥ್. ಬೆಂಗಳೂರಿನ ಜಯನಗರದಲ್ಲಿ "ಶ್ರೀ ಮಂಜುನಾಥ ಟೀ ಸ್ಟಾಲ್" ಅನ್ನು 2019 ರಿಂದ ನಡೆಸುತ್ತಿದ್ದೇನೆ. ಮಾಸಿಕ ಆದಾಯ 80,000 ರೂ. ಫೋನ್ 9844455566.',
  'en-handloom': 'Hello, I am Anand Ansari. I run "Anand Silk Weaving" at Chowk Varanasi since 2015 with monthly sales around 3 Lakhs. Phone number is 9899988877.',
};

// ========================================================
// Initializer & Routing
// ========================================================
async function init() {
  setupNavigationRouting();
  setupCopyHandlers();
  setupEventListeners();
  
  // Route to current pathname or default to credentials
  const initialSlug = getSlugFromPath() || 'credentials';
  navigateToSlug(initialSlug, false);

  await refreshDashboard();
}

function getSlugFromPath() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (SLUG_TITLES[path]) return path;
  return 'credentials';
}

function setupNavigationRouting() {
  // Sidebar navigation links
  document.querySelectorAll('.sidebar-nav .nav-item').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const slug = link.dataset.slug;
      if (slug) {
        navigateToSlug(slug, true);
      }
    });
  });

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const slug = getSlugFromPath();
    navigateToSlug(slug, false);
  });
}

function navigateToSlug(slug, pushState = true) {
  if (!SLUG_TITLES[slug]) slug = 'credentials';

  if (pushState) {
    window.history.pushState({ slug }, '', `/${slug}`);
  }

  // 1. Update Active Nav Link
  document.querySelectorAll('.sidebar-nav .nav-item').forEach((link) => {
    if (link.dataset.slug === slug) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 2. Switch Active View
  document.querySelectorAll('.slug-view').forEach((view) => {
    view.classList.remove('active');
  });

  const targetView = document.getElementById(`view-${slug}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // 3. Update Breadcrumb & Header Action
  const title = SLUG_TITLES[slug] || 'Verifiable Credentials';
  document.getElementById('crumbActiveTitle').textContent = title;

  const headerBtn = document.getElementById('btnHeaderAction');
  const headerBtnText = document.getElementById('btnHeaderActionText');

  if (slug === 'credentials') {
    headerBtn.style.display = 'inline-flex';
    headerBtnText.textContent = 'Time-Skip (Issue Batch)';
    headerBtn.onclick = triggerTimeSkip;
  } else if (slug === 'delegations') {
    headerBtn.style.display = 'inline-flex';
    headerBtnText.textContent = 'Recommend Scopes (AI)';
    headerBtn.onclick = () => document.getElementById('btnAskScopeAgent')?.click();
  } else if (slug === 'proofs') {
    headerBtn.style.display = 'inline-flex';
    headerBtnText.textContent = 'Generate Proof Bundle';
    headerBtn.onclick = () => document.getElementById('btnConfirmGenerateProof')?.click();
  } else if (slug === 'verifier') {
    headerBtn.style.display = 'inline-flex';
    headerBtnText.textContent = 'Inspect PRF-loan-001';
    headerBtn.onclick = () => document.getElementById('btnInspectProof')?.click();
  } else {
    headerBtn.style.display = 'none';
  }

  // If entering verifier or proofs, populate their specific elements
  if (slug === 'proofs') {
    populateProofModalCredentials();
  } else if (slug === 'verifier' && !currentProofData) {
    loadVerifierProof('PRF-loan-001');
  }
}

function setupCopyHandlers() {
  const didTags = [document.getElementById('bizId'), document.getElementById('sideBizId')];
  didTags.forEach((tag) => {
    tag?.addEventListener('click', () => {
      const text = tag.textContent.trim();
      navigator.clipboard.writeText(text);
      showToast(`Copied Business DID: ${text}`, 'info', 2000);
    });
  });
}

// ========================================================
// Data Refresh
// ========================================================
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
    if (data.success && data.business) {
      document.getElementById('bizName').textContent = data.business.name;
      document.getElementById('sideBizName').textContent = data.business.name;
      document.getElementById('bizSector').textContent = data.business.metadata?.sector || 'Retail Grocery & Essentials';
      document.getElementById('bizLoc').textContent = data.business.metadata?.location || 'Varanasi, Uttar Pradesh';
    }
  } catch (err) {
    console.error('Failed to fetch business profile:', err);
  }
}

let activeCredFilter = 'all';

async function fetchCredentials() {
  try {
    const res = await fetch(`${BACKEND_URL}/credentials/${CURRENT_BIZ_ID}`);
    const data = await res.json();
    if (!data.success) return;

    loadedCredentials = data.credentials || [];
    updateCredentialCounts();
    renderCredentials();
    populateProofModalCredentials();
  } catch (err) {
    const container = document.getElementById('credentialsContainer');
    if (container) {
      container.innerHTML = '<div style="color: var(--accent-rose); padding: 16px;">Could not connect to backend server.</div>';
    }
  }
}

function updateCredentialCounts() {
  const allCount = loadedCredentials.length;
  const groups = groupCredentialsByType(loadedCredentials);
  const uniqueTypesCount = Object.keys(groups).length;

  const gstnCount = loadedCredentials.filter(c => c.issuer === 'gstn_root' || c.type.includes('gst')).length;
  const bankCount = loadedCredentials.filter(c => c.issuer === 'bank_mock' || c.type.includes('bank')).length;
  const mktCount = loadedCredentials.filter(c => c.issuer === 'marketplace_mock' || c.type.includes('marketplace') || c.type.includes('ondc')).length;
  const cscCount = loadedCredentials.filter(c => c.issuer === 'agent_witnessed' || c.type.includes('self') || c.type.includes('witness')).length;

  document.getElementById('sideCredCount').textContent = uniqueTypesCount;
  document.getElementById('credCountBadge').textContent = `${uniqueTypesCount} institutional types (${allCount} total versions)`;
  document.getElementById('lblMetricCredCount').textContent = `${uniqueTypesCount} / 4 Anchors`;

  document.getElementById('countAllCreds').textContent = uniqueTypesCount;
  document.getElementById('countGstnCreds').textContent = gstnCount > 0 ? (gstnCount > 1 ? `1 (v${gstnCount})` : '1') : '0';
  document.getElementById('countBankCreds').textContent = bankCount > 0 ? (bankCount > 1 ? `1 (v${bankCount})` : '1') : '0';
  document.getElementById('countMktCreds').textContent = mktCount > 0 ? (mktCount > 1 ? `1 (v${mktCount})` : '1') : '0';
  document.getElementById('countCscCreds').textContent = cscCount > 0 ? (cscCount > 1 ? `1 (v${cscCount})` : '1') : '0';
}

function groupCredentialsByType(creds) {
  const groups = {};
  for (const cred of creds) {
    const key = cred.type;
    if (!groups[key]) groups[key] = [];
    groups[key].push(cred);
  }
  // Sort each group newest first
  Object.values(groups).forEach(arr => {
    arr.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
  });
  return groups;
}

function renderCredentials() {
  const container = document.getElementById('credentialsContainer');
  if (!container) return;

  const searchKeyword = (document.getElementById('txtCredSearch')?.value || '').toLowerCase().trim();
  const groups = groupCredentialsByType(loadedCredentials);

  let groupKeys = Object.keys(groups);

  // Filter by selected tab
  if (activeCredFilter === 'gstn') groupKeys = groupKeys.filter(k => k.includes('gst'));
  else if (activeCredFilter === 'bank') groupKeys = groupKeys.filter(k => k.includes('bank') || k.includes('income'));
  else if (activeCredFilter === 'marketplace') groupKeys = groupKeys.filter(k => k.includes('marketplace') || k.includes('order') || k.includes('ondc'));
  else if (activeCredFilter === 'witness') groupKeys = groupKeys.filter(k => k.includes('self') || k.includes('witness'));

  if (searchKeyword) {
    groupKeys = groupKeys.filter(k => {
      const arr = groups[k];
      return arr.some(cred => {
        const typeStr = (cred.type || '').toLowerCase();
        const idStr = (cred.credential_id || '').toLowerCase();
        const issuerStr = (cred.issuer || '').toLowerCase();
        const claimsStr = JSON.stringify(cred.claim || {}).toLowerCase();
        return typeStr.includes(searchKeyword) || idStr.includes(searchKeyword) || issuerStr.includes(searchKeyword) || claimsStr.includes(searchKeyword);
      });
    });
  }

  if (groupKeys.length === 0) {
    container.innerHTML = '<div style="color: var(--text-dim); text-align: center; grid-column: span 2; padding: 36px 0; font-size: 0.85rem;">No matching credentials found for current filter.</div>';
    return;
  }

  container.innerHTML = groupKeys.map((key) => {
    const stack = groups[key];
    const latest = stack[0];
    const totalRevisions = stack.length;
    const historicalRevisions = stack.slice(1);

    let badgeLabel = 'Government Root';
    let badgeClass = 'badge-gst';
    let authorityLabel = 'GSTN / Ministry of Finance';

    if (latest.issuer === 'bank_mock' || latest.type.includes('bank') || latest.type.includes('income')) {
      badgeLabel = 'State Bank of India';
      badgeClass = 'badge-bank';
      authorityLabel = 'Banking & Credit Registry';
    } else if (latest.issuer === 'marketplace_mock' || latest.type.includes('marketplace') || latest.type.includes('order')) {
      badgeLabel = 'BharatMart ONDC';
      badgeClass = 'badge-mkt';
      authorityLabel = 'E-Commerce Protocol';
    } else if (latest.issuer === 'agent_witnessed' || latest.type.includes('self') || latest.type.includes('witness')) {
      badgeLabel = 'CSC Field Witness';
      badgeClass = 'badge-csc';
      authorityLabel = 'VLE Assisted In-Person';
    }

    const latestMonth = new Date(latest.issued_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    const versionChipHtml = totalRevisions > 1
      ? `<span class="version-chip-stack" title="${totalRevisions} total versions issued">v${totalRevisions} Active <span style="font-weight: 500; opacity: 0.85;">(${totalRevisions - 1} historical revisions)</span></span>`
      : `<span class="version-chip-single">v1 Active</span>`;

    const claimRows = Object.entries(latest.claim)
      .map(([k, v]) => `
        <div class="claim-table-row">
          <span class="claim-table-key">${formatClaimKey(k)}</span>
          <strong class="claim-table-val">${v}</strong>
        </div>
      `)
      .join('');

    const historyTimelineHtml = historicalRevisions.map((rev, revIdx) => {
      const revNum = totalRevisions - 1 - revIdx;
      const revDate = new Date(rev.issued_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const revClaims = Object.entries(rev.claim).map(([k, v]) => `<span>${formatClaimKey(k)}: <strong>${v}</strong></span>`).join(' • ');

      return `
        <div class="revision-item">
          <div class="revision-item-top">
            <span class="revision-tag">v${revNum}</span>
            <code class="revision-id" title="${rev.credential_id}">${rev.credential_id.slice(0, 16)}...</code>
            <span class="revision-date">${revDate}</span>
            <button class="btn-copy-raw-json btn btn-secondary" data-raw='${JSON.stringify(rev).replace(/'/g, "&apos;")}' style="font-size: 0.65rem; padding: 1px 6px; margin-left: auto;">Copy v${revNum} JSON</button>
          </div>
          <div class="revision-claims-summary">${revClaims}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="cred-card">
        <div>
          <!-- Header: Issuer + Version Stack Badge -->
          <div class="cred-card-header">
            <div class="issuer-badge-wrap">
              <span class="issuer-badge ${badgeClass}">${badgeLabel} (Latest: ${latestMonth})</span>
              <span class="cred-issuer-authority">${authorityLabel}</span>
            </div>
            ${versionChipHtml}
          </div>

          <!-- Title & High-Contrast Technical ID -->
          <h3 class="cred-card-title">${formatCredType(latest.type)}</h3>
          
          <div class="cred-id-chip" data-id="${latest.credential_id}" title="Click to copy full Credential ID">
            <span class="id-label">LATEST ID</span>
            <code class="id-code">${latest.credential_id}</code>
            <button class="btn-copy-mini" type="button" aria-label="Copy ID">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>

          <!-- Structured Metadata Grid -->
          <div class="cred-claim-table">
            ${claimRows}
          </div>
        </div>

        <!-- Footer -->
        <div class="cred-card-footer">
          <div class="sig-status-group">
            <span class="sig-valid-dot"></span>
            <span class="sig-valid-text">HMAC-SHA256 Root Sealed</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-view-proof-toggle" data-cred-id="${latest.credential_id}">
              <span>${totalRevisions > 1 ? `Revisions (${totalRevisions})` : 'Inspect Payload'}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>
        </div>

        <!-- Collapsible Version Drawer & Raw Diff -->
        <div class="cred-raw-proof-drawer" id="drawer-${latest.credential_id}" style="display: none;">
          ${totalRevisions > 1 ? `
            <div style="margin-bottom: 12px; border-bottom: 1px solid #334155; padding-bottom: 10px;">
              <span class="sub-label" style="color: #93c5fd;">HISTORICAL LEDGER STACK (REVISION EVOLUTION)</span>
              <div class="revision-stack-list">
                ${historyTimelineHtml}
              </div>
            </div>
          ` : ''}

          <div class="drawer-header">
            <span class="sub-label">ACTIVE PAYLOAD (v${totalRevisions} LATEST)</span>
            <button class="btn-copy-raw-json btn btn-secondary" data-raw='${JSON.stringify(latest).replace(/'/g, "&apos;")}' style="font-size: 0.68rem; padding: 2px 6px;">Copy Latest JSON</button>
          </div>
          <pre class="drawer-pre">${JSON.stringify(latest, null, 2)}</pre>
        </div>
      </div>
    `;
  }).join('');

  // Wire ID copy buttons
  document.querySelectorAll('.cred-id-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = chip.dataset.id;
      if (id) {
        navigator.clipboard.writeText(id);
        showToast(`Copied Credential ID: ${id}`, 'info', 2000);
      }
    });
  });

  // Wire payload drawer toggles
  document.querySelectorAll('.btn-view-proof-toggle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const credId = e.currentTarget.dataset.credId;
      const drawer = document.getElementById(`drawer-${credId}`);
      if (drawer) {
        const isHidden = drawer.style.display === 'none';
        drawer.style.display = isHidden ? 'block' : 'none';
        e.currentTarget.classList.toggle('active', isHidden);
      }
    });
  });

  // Wire copy raw json buttons
  document.querySelectorAll('.btn-copy-raw-json').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const raw = e.currentTarget.dataset.raw;
      if (raw) {
        navigator.clipboard.writeText(raw);
        showToast('Credential JSON payload copied to clipboard.', 'success', 2000);
      }
    });
  });
}

function openDelegationModal() {
  const modal = document.getElementById('delegationModal');
  const body = document.getElementById('delegationModalBody');
  if (!modal || !body) return;

  const activeToken = loadedDelegations.find(t => t.status === 'active');

  if (activeToken) {
    const delegateName = activeToken.delegate?.name || 'CA Vikas Mehta';
    const delegateId = activeToken.delegate_person_id || 'did:person:vikas001';
    const scopesPills = activeToken.scopes.map(s => `<span class="scope-pill" style="font-weight: 700; color: #6d28d9; background: #f5f3ff; border: 1px solid #ddd6fe; padding: 3px 8px; border-radius: 4px; font-size: 0.76rem;">${s}</span>`).join(' ');

    body.innerHTML = `
      <div style="background: #f8fafc; border: 1px solid var(--border-card); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div>
            <span class="sub-label">DELEGATE IDENTITY</span>
            <div style="font-weight: 800; font-size: 1rem; color: var(--text-main);">${delegateName}</div>
            <code style="font-family: var(--font-mono); font-size: 0.74rem; color: #1e40af;">${delegateId}</code>
          </div>
          <span style="font-size: 0.68rem; font-weight: 800; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px;">ACTIVE CAPABILITY TOKEN</span>
        </div>

        <div style="margin-bottom: 12px;">
          <span class="sub-label">GRANTED SCOPES (LEAST-PRIVILEGE)</span>
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
            ${scopesPills}
          </div>
        </div>

        <div style="background: #ffffff; border: 1px solid var(--border-light); border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; font-size: 0.76rem; color: #475569;">
          <strong style="color: #0f172a; display: block; margin-bottom: 2px;">🛡️ Guardrails Enforced:</strong>
          Banking master keys, loan applications, and business ownership transfer privileges are withheld.
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.74rem;">
          <div>
            <span style="color: var(--text-muted); display: block; font-size: 0.68rem; font-weight: 700;">TOKEN TTL</span>
            <span style="font-weight: 600; color: var(--text-main);">14 Days Remaining (Auto-expires Oct 10, 2026)</span>
          </div>
          <div>
            <span style="color: var(--text-muted); display: block; font-size: 0.68rem; font-weight: 700;">CRYPTOGRAPHIC BINDING</span>
            <span style="font-family: var(--font-mono); font-weight: 600; color: #1e40af;">HMAC-SHA256 (did:biz:sharma001)</span>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 16px;">
        <button id="btnModalRevokeDelegation" class="btn btn-danger" data-token="${activeToken.token_id}" style="padding: 8px 16px;">
          Revoke Token Instantly
        </button>
        <button id="btnModalGoToDelegations" class="btn btn-secondary" style="padding: 8px 14px;">
          Manage Scopes in Delegations →
        </button>
      </div>
    `;

    document.getElementById('btnModalRevokeDelegation')?.addEventListener('click', async (e) => {
      const tokId = e.currentTarget.dataset.token;
      modal.classList.remove('active');
      await revokeToken(tokId);
    });

    document.getElementById('btnModalGoToDelegations')?.addEventListener('click', () => {
      modal.classList.remove('active');
      navigateToSlug('delegations');
    });
  } else {
    body.innerHTML = `
      <div style="text-align: center; padding: 24px 0;">
        <div style="font-size: 1.5rem; margin-bottom: 8px;">🔒</div>
        <h4 style="font-family: var(--font-display); font-size: 1rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">No Active Delegations</h4>
        <p style="font-size: 0.8rem; color: var(--text-muted); max-width: 340px; margin: 0 auto 16px auto;">
          Sharma General Store has zero active delegated tokens. Grant revocable scopes to your CA without passwords.
        </p>
        <button id="btnModalGrantDelegation" class="btn btn-primary">
          Grant Scoped Delegation →
        </button>
      </div>
    `;

    document.getElementById('btnModalGrantDelegation')?.addEventListener('click', () => {
      modal.classList.remove('active');
      navigateToSlug('delegations');
    });
  }

  modal.classList.add('active');
}

async function fetchDelegations() {
  const container = document.getElementById('activeDelegationsList');
  try {
    const res = await fetch(`${BACKEND_URL}/delegation/${CURRENT_BIZ_ID}`);
    const data = await res.json();
    if (!data.success || !data.tokens || data.tokens.length === 0) {
      container.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-dim); padding: 14px 0;">No active delegations.</div>';
      document.getElementById('lblMetricDelegations').textContent = '0 Active';
      document.getElementById('sideDelegationCount').textContent = '0';
      document.getElementById('activeDelegationHeaderBadge').textContent = '0 Tokens';
      return;
    }

    loadedDelegations = data.tokens;
    const activeTokens = loadedDelegations.filter(t => t.status === 'active');
    document.getElementById('lblMetricDelegations').textContent = `${activeTokens.length} Active Token`;
    document.getElementById('sideDelegationCount').textContent = `${activeTokens.length} Active`;
    document.getElementById('activeDelegationHeaderBadge').textContent = `${activeTokens.length} Token`;

    container.innerHTML = activeTokens.map((tok) => `
      <div style="background: #ffffff; border: 1px solid var(--border-card); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 10px; box-shadow: var(--shadow-xs);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div>
            <strong style="font-size: 0.88rem; color: var(--text-main); display: block;">${tok.delegate?.name || tok.delegate_person_id}</strong>
            <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">${tok.delegate_person_id}</span>
          </div>
          <span style="font-size: 0.68rem; color: var(--accent-teal); font-weight: 700; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 7px; border-radius: 4px;">ACTIVE CAPABILITY</span>
        </div>
        <div style="margin: 8px 0 12px 0;">
          <span class="sub-label">GRANTED SCOPES (LEAST-PRIVILEGE)</span>
          ${tok.scopes.map(s => `<span class="scope-pill">${s}</span>`).join('')}
        </div>
        <button class="btn btn-danger btn-revoke-action" data-token="${tok.token_id}" style="font-size: 0.74rem; padding: 5px 12px;">
          Revoke Access Immediately
        </button>
      </div>
    `).join('');

    document.querySelectorAll('.btn-revoke-action').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const tokId = e.currentTarget.dataset.token;
        await revokeToken(tokId);
      });
    });
  } catch (err) {
    container.innerHTML = '<div style="font-size: 0.78rem; color: var(--text-dim);">Could not load delegations.</div>';
  }
}

let loadedTimelineEvents = [];
let activeEventFilter = 'all';

async function fetchAuditTrail() {
  const container = document.getElementById('auditEventsContainer');
  try {
    const res = await fetch(`${BACKEND_URL}/audit/${CURRENT_BIZ_ID}/timeline`);
    const data = await res.json();
    if (!data.success) return;

    loadedTimelineEvents = data.timeline || [];
    updateEventCounts();
    renderAuditEvents();
  } catch (err) {
    if (container) {
      container.innerHTML = '<div style="color: var(--accent-rose); padding: 14px;">Could not load audit timeline.</div>';
    }
  }
}

function updateEventCounts() {
  const credEvents = loadedTimelineEvents.filter(e => e.category === 'credential').length;
  const delegationEvents = loadedTimelineEvents.filter(e => e.category === 'delegation').length;
  const proofEvents = loadedTimelineEvents.filter(e => e.category === 'proof').length;
  const agentEvents = loadedTimelineEvents.filter(e => e.category === 'agent' || e.source === 'agent_action').length;

  document.getElementById('countAllEvents').textContent = loadedTimelineEvents.length;
  document.getElementById('countCredEvents').textContent = credEvents;
  document.getElementById('countDelegationEvents').textContent = delegationEvents;
  document.getElementById('countProofEvents').textContent = proofEvents;
  document.getElementById('countAgentEvents').textContent = agentEvents;
}

function renderAuditEvents() {
  const container = document.getElementById('auditEventsContainer');
  if (!container) return;

  const searchKeyword = (document.getElementById('txtAuditSearch')?.value || '').toLowerCase().trim();

  let filtered = loadedTimelineEvents.filter(event => {
    if (activeEventFilter === 'credential') return event.category === 'credential';
    if (activeEventFilter === 'delegation') return event.category === 'delegation';
    if (activeEventFilter === 'proof') return event.category === 'proof';
    if (activeEventFilter === 'agent') return event.category === 'agent' || event.source === 'agent_action';
    return true;
  });

  if (searchKeyword) {
    filtered = filtered.filter(event => {
      const title = (event.title || '').toLowerCase();
      const desc = (event.description || '').toLowerCase();
      const actorId = (event.actor?.actor_id || event.actor?.id || '').toLowerCase();
      const actorName = (event.actor?.actor_name || event.actor?.name || '').toLowerCase();
      return title.includes(searchKeyword) || desc.includes(searchKeyword) || actorId.includes(searchKeyword) || actorName.includes(searchKeyword);
    });
  }

  document.getElementById('lblShowingEventCount').textContent = `Showing ${filtered.length} events`;

  if (filtered.length === 0) {
    container.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 28px 0; font-size: 0.82rem;">No matching events found in audit ledger.</div>';
    return;
  }

  container.innerHTML = filtered.map((event, idx) => {
    let iconClass = 'event-icon-green';
    let iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    if (event.category === 'delegation') {
      iconClass = 'event-icon-purple';
      iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
    } else if (event.category === 'proof') {
      iconClass = 'event-icon-blue';
      iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>';
    } else if (event.category === 'governance') {
      iconClass = 'event-icon-amber';
      iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>';
    } else if (event.source === 'agent_action') {
      iconClass = 'event-icon-amber';
      iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
    }

    const humanBadge = event.actor?.confirmed_by_human
      ? '<span style="color: var(--accent-teal); font-weight: 600;">✓ Human Confirmed</span>'
      : '<span style="color: var(--text-muted); font-weight: 500;">⚙️ Root System</span>';

    return `
      <div class="event-card-item">
        <div class="event-card-left">
          <div class="event-type-icon ${iconClass}">
            ${iconSvg}
          </div>
          <div>
            <div class="event-main-desc">${event.title}</div>
            <p style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 3px;">${event.description}</p>
            <div class="event-meta-line">
              <span>Actor: <strong class="event-actor-tag">${event.actor?.name || event.actor?.actor_name || event.actor?.id || 'DPI System'}</strong></span>
              <span>•</span>
              ${humanBadge}
            </div>
          </div>
        </div>

        <div class="event-card-right">
          <div class="event-time-text">
            ${new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <div style="font-size: 0.68rem; color: var(--text-dim);">${new Date(event.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
          </div>
          <button class="btn btn-secondary btn-inspect-event" data-index="${idx}" style="font-size: 0.72rem; padding: 4px 10px;">
            Inspect Payload
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Wire inspect payload buttons
  document.querySelectorAll('.btn-inspect-event').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      const selectedEvent = filtered[idx];
      if (selectedEvent) {
        openEventInspectorModal(selectedEvent);
      }
    });
  });
}

function openEventInspectorModal(event) {
  const modal = document.getElementById('eventModal');
  if (!modal) return;

  const actorName = event.actor?.name || event.actor?.actor_name || 'System';
  const actorId = event.actor?.id || event.actor?.actor_id || 'DPI Node';

  document.getElementById('eventModalTitle').textContent = event.title;
  document.getElementById('eventModalLogId').textContent = event.event_id;
  document.getElementById('eventModalActorId').textContent = `${actorName} (${actorId})`;
  document.getElementById('eventModalJsonPayload').textContent = JSON.stringify(event.details || event.payload || event, null, 2);

  modal.classList.add('active');
}

// ========================================================
// Time-Skip Trigger (Beat 2)
// ========================================================
async function triggerTimeSkip() {
  try {
    const res = await fetch(`${BACKEND_URL}/mocks/issue-batch/${CURRENT_BIZ_ID}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Time-Skip: GSTN, State Bank of India, and BharatMart issued verified credentials.', 'success', 4500);
      await refreshDashboard();
    }
  } catch (err) {
    showToast('Error triggering mock issuers.', 'error');
  }
}

// ========================================================
// Event Listeners for All Slugs
// ========================================================
function setupEventListeners() {
  
  // 0. Credentials View Inline CTA, Filter Tabs, and Search
  document.getElementById('btnInlineTimeSkip')?.addEventListener('click', triggerTimeSkip);

  document.querySelectorAll('.cred-tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.cred-tab').forEach(t => t.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      activeCredFilter = target.dataset.filter || 'all';
      renderCredentials();
    });
  });

  document.getElementById('txtCredSearch')?.addEventListener('input', () => {
    renderCredentials();
  });

  // 1. Language switcher buttons
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentLanguage = target.dataset.lang || 'en';
      showToast(`Language switched to ${target.textContent.trim()}`, 'info', 1500);
    });
  });

  // 2. AI Scoping Agent (/delegations)
  document.getElementById('btnAskScopeAgent')?.addEventListener('click', async () => {
    const prompt = document.getElementById('txtDelegationPrompt').value.trim();
    if (!prompt) {
      showToast('Please describe the delegation scope in the box above.', 'warning');
      return;
    }

    const btn = document.getElementById('btnAskScopeAgent');
    btn.disabled = true;
    btn.innerHTML = '<span>Evaluating Least-Privilege Scopes...</span>';

    try {
      const res = await fetch(`${AGENT_URL}/agent/scope-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: CURRENT_BIZ_ID,
          natural_language_intent: prompt,
          target_person_name: 'CA Vikas Mehta',
          language: currentLanguage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        pendingScopingAction = data;
        const box = document.getElementById('scopingProposalBox');
        document.getElementById('proposalScopes').innerHTML = data.proposed_scopes.map(s => `<span class="scope-pill">${s}</span>`).join('');
        document.getElementById('proposalExplanation').textContent = data.explanation;
        document.getElementById('proposalWithheld').textContent = data.least_privilege_notes;
        box.style.display = 'block';
        showToast('AI proposed minimal scopes. Review and click "Confirm & Grant".', 'success');
      }
    } catch (err) {
      const box = document.getElementById('scopingProposalBox');
      document.getElementById('proposalScopes').innerHTML = `<span class="scope-pill">file_returns</span><span class="scope-pill">view_compliance</span>`;
      document.getElementById('proposalExplanation').textContent = 'Recommended minimal scopes for CA tax filing.';
      document.getElementById('proposalWithheld').textContent = 'Banking & loan management withheld.';
      box.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        <span>Recommend Scopes (AI)</span>
      `;
    }
  });

  document.getElementById('btnConfirmDelegation')?.addEventListener('click', async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/delegation/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: CURRENT_BIZ_ID,
          delegate_person_id: 'did:person:vikas001',
          scopes: pendingScopingAction?.proposed_scopes || ['file_returns', 'view_compliance'],
          agent_action_id: pendingScopingAction?.agent_action_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Scoped delegation token granted to CA Vikas Mehta.', 'success');
        document.getElementById('scopingProposalBox').style.display = 'none';
        document.getElementById('txtDelegationPrompt').value = '';
        await fetchDelegations();
        await fetchAuditTrail();
      }
    } catch (err) {
      showToast('Failed to grant delegation.', 'error');
    }
  });

  document.getElementById('btnDismissScoping')?.addEventListener('click', () => {
    document.getElementById('scopingProposalBox').style.display = 'none';
  });

  // 3. Selective Proof Generator (/proofs)
  document.getElementById('btnExplainConsent')?.addEventListener('click', async () => {
    const selectedCredIds = Array.from(document.querySelectorAll('.cred-checkbox:checked')).map(c => c.value);
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
        const box = document.getElementById('consentExplanationBox');
        document.getElementById('consentPlainSummary').textContent = data.plain_language_explanation;
        document.getElementById('consentSharedList').textContent = data.shared_data_summary.join(', ');
        document.getElementById('consentWithheldList').textContent = data.withheld_data_summary.join(', ');
        box.style.display = 'block';
      }
    } catch (err) {
      const box = document.getElementById('consentExplanationBox');
      document.getElementById('consentPlainSummary').textContent = 'Only selected credentials will be signed into the proof token.';
      document.getElementById('consentSharedList').textContent = 'Selected credentials only';
      document.getElementById('consentWithheldList').textContent = 'All unselected private accounts & IDs';
      box.style.display = 'block';
    }
  });

  document.getElementById('btnConfirmGenerateProof')?.addEventListener('click', async () => {
    const selectedCredIds = Array.from(document.querySelectorAll('.cred-checkbox:checked')).map(c => c.value);
    const purpose = document.getElementById('proofPurposeSelect').value;
    const recipient = document.getElementById('proofRecipientInput').value;

    if (selectedCredIds.length === 0) {
      showToast('Please select at least one credential to disclose.', 'warning');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/proof/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: CURRENT_BIZ_ID,
          purpose,
          shared_with: recipient,
          disclosed_credential_ids: selectedCredIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const proofShare = data.proof_share;
        showToast('Selective Proof generated successfully.', 'success');

        document.getElementById('proofPlaceholder').style.display = 'none';
        const resultBox = document.getElementById('generatedProofResult');
        const verifierBtn = document.getElementById('btnOpenInVerifier');
        const urlInput = document.getElementById('txtProofShareUrl');

        const shareUrl = `http://localhost:5174?proof_id=${proofShare.proof_id}`;
        urlInput.value = shareUrl;
        verifierBtn.href = shareUrl;
        resultBox.style.display = 'block';

        await fetchAuditTrail();
      }
    } catch (err) {
      showToast('Failed to generate proof bundle.', 'error');
    }
  });

  // 4. Succession Transfer (/succession)
  document.getElementById('btnConfirmTransfer')?.addEventListener('click', async () => {
    const successorId = document.getElementById('successorSelect').value;
    try {
      const res = await fetch(`${BACKEND_URL}/business/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: CURRENT_BIZ_ID,
          new_owner_person_id: successorId,
          transfer_reason: 'Beat 5 Succession Planning',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Succession Transfer Confirmed: Priya Sharma is now primary executive. Business DID and credentials preserved intact!', 'success', 6000);
        await refreshDashboard();
      }
    } catch (err) {
      showToast('Failed to transfer ownership.', 'error');
    }
  });

  // 5. Verifier Controls (/verifier)
  document.getElementById('btnInspectProof')?.addEventListener('click', () => {
    isTamperSimulated = false;
    updateTamperBtn();
    loadVerifierProof(document.getElementById('txtProofIdInput').value.trim());
  });

  document.getElementById('btnSimulateTamper')?.addEventListener('click', () => {
    if (!currentProofData) {
      showToast('Please inspect a proof first.', 'warning');
      return;
    }
    isTamperSimulated = !isTamperSimulated;
    updateTamperBtn();
    renderVerifierView(currentProofData);
    showToast(
      isTamperSimulated
        ? 'Tampering simulated: turnover figure altered in memory. HMAC signature verification fails.'
        : 'Authentic cryptographic payload restored.',
      isTamperSimulated ? 'warning' : 'info',
      4000
    );
  });

  document.getElementById('btnApproveLoan')?.addEventListener('click', () => {
    if (isTamperSimulated) {
      showToast('Underwriting Error: Cannot sanction loan on a tampered cryptographic proof.', 'error', 4500);
      return;
    }
    showToast('Loan Sanctioned: ₹5,00,000 credit limit approved based on verified DPI track record.', 'success', 5000);
  });

  // 6. Onboarding Controls (/onboarding)
  document.querySelectorAll('#view-onboarding .sample-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#view-onboarding .sample-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const sampleKey = chip.dataset.sample;
      document.getElementById('txtConversationalTranscript').value = SAMPLE_TRANSCRIPTS[sampleKey] || '';
      showToast('Sample transcript loaded.', 'info', 1500);
    });
  });

  document.getElementById('btnExtractOnboarding')?.addEventListener('click', handleOnboardingExtract);
  document.getElementById('btnConfirmOnboard')?.addEventListener('click', handleConfirmOnboardRegistration);

  // 7. Event Center Filters & Search (/audit)
  document.querySelectorAll('.event-tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.event-tab').forEach(t => t.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      activeEventFilter = target.dataset.filter || 'all';
      renderAuditEvents();
    });
  });

  document.getElementById('txtAuditSearch')?.addEventListener('input', () => {
    renderAuditEvents();
  });

  // Interactive Delegation Stat Card & Modal Handlers
  document.getElementById('statCardDelegation')?.addEventListener('click', openDelegationModal);

  const delegationModal = document.getElementById('delegationModal');
  const closeDelegationModal = () => delegationModal?.classList.remove('active');

  document.getElementById('btnCloseDelegationModal')?.addEventListener('click', closeDelegationModal);
  delegationModal?.addEventListener('click', (e) => {
    if (e.target === delegationModal) closeDelegationModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && delegationModal?.classList.contains('active')) {
      closeDelegationModal();
    }
  });

  // Event Inspector Modal Handlers
  const eventModal = document.getElementById('eventModal');
  const closeEventModal = () => eventModal?.classList.remove('active');

  document.getElementById('btnCloseEventModal')?.addEventListener('click', closeEventModal);
  document.getElementById('btnCloseEventModalBtn')?.addEventListener('click', closeEventModal);
  eventModal?.addEventListener('click', (e) => {
    if (e.target === eventModal) closeEventModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && eventModal?.classList.contains('active')) {
      closeEventModal();
    }
  });

  document.getElementById('btnCopyEventPayload')?.addEventListener('click', () => {
    const rawText = document.getElementById('eventModalJsonPayload')?.textContent;
    if (rawText) {
      navigator.clipboard.writeText(rawText);
      showToast('Event payload JSON copied to clipboard.', 'success', 2000);
    }
  });

  // Onboarding Success Actions
  document.getElementById('btnViewNewBizInWallet')?.addEventListener('click', () => {
    navigateToSlug('credentials');
  });

  document.getElementById('btnOnboardAnother')?.addEventListener('click', () => {
    document.getElementById('onboardSuccessScreen').style.display = 'none';
    document.getElementById('extractionPlaceholder').style.display = 'block';
    document.getElementById('txtConversationalTranscript').value = SAMPLE_TRANSCRIPTS['hi-kirana'];
    currentOnboardProposal = null;
  });

  // Set default onboarding transcript
  const transcriptArea = document.getElementById('txtConversationalTranscript');
  if (transcriptArea) transcriptArea.value = SAMPLE_TRANSCRIPTS['hi-kirana'];
}

function populateProofModalCredentials() {
  const container = document.getElementById('selectiveCredCheckboxes');
  if (!container) return;
  if (loadedCredentials.length === 0) {
    container.innerHTML = '<div style="font-size: 0.78rem; color: var(--text-muted);">No credentials available.</div>';
    return;
  }

  container.innerHTML = loadedCredentials.map((cred) => `
    <label style="display: flex; align-items: center; gap: 8px; font-size: 0.78rem; cursor: pointer; padding: 8px 10px; background: #f8fafc; border: 1px solid var(--border-card); border-radius: var(--radius-xs);">
      <input type="checkbox" class="cred-checkbox" value="${cred.credential_id}" checked>
      <div>
        <strong style="color: var(--text-main); font-weight: 600;">${formatCredType(cred.type)}</strong>
        <span style="color: var(--text-muted); margin-left: 4px;">(${cred.issuer})</span>
      </div>
    </label>
  `).join('');
}

async function revokeToken(tokenId) {
  try {
    const res = await fetch(`${BACKEND_URL}/delegation/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token_id: tokenId,
        revoked_by: 'did:person:ramesh001',
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('Delegation revoked immediately.', 'info');
      await fetchDelegations();
      await fetchAuditTrail();
    }
  } catch (err) {
    showToast('Failed to revoke delegation.', 'error');
  }
}

// ========================================================
// Verifier View Logic
// ========================================================
function updateTamperBtn() {
  const btn = document.getElementById('btnSimulateTamper');
  const txt = document.getElementById('tamperBtnText');
  if (!btn || !txt) return;
  if (isTamperSimulated) {
    btn.style.background = '#ecfdf5';
    btn.style.borderColor = '#a7f3d0';
    btn.style.color = '#047857';
    txt.textContent = 'Restore Authentic Payload';
  } else {
    btn.style.background = '#ffffff';
    btn.style.borderColor = 'var(--accent-rose-border)';
    btn.style.color = 'var(--accent-rose)';
    txt.textContent = 'Simulate Tampering';
  }
}

async function loadVerifierProof(proofId) {
  if (!proofId) return;
  try {
    const res = await fetch(`${BACKEND_URL}/proof/verify/${proofId}`);
    const data = await res.json();
    if (!data.success) return;
    currentProofData = data;
    renderVerifierView(data);
  } catch (err) {
    console.error('Error loading verifier proof:', err);
  }
}

function renderVerifierView(data) {
  if (!data) return;

  const summaryCard = document.getElementById('businessSummaryCard');
  if (summaryCard) summaryCard.style.display = 'flex';

  if (data.business) {
    document.getElementById('inspectBizName').textContent = data.business.name;
    document.getElementById('inspectBizDid').textContent = data.business.business_id;
    document.getElementById('inspectBizSector').textContent = data.business.metadata?.sector || 'MSME Enterprise';
    document.getElementById('inspectBizLoc').textContent = data.business.metadata?.location || 'India';
  }

  const banner = document.getElementById('statusBanner');
  const bannerIcon = document.getElementById('bannerIcon');
  const title = document.getElementById('txtStatusTitle');
  const sub = document.getElementById('txtStatusSubtitle');
  const chip = document.getElementById('badgeStatusChip');
  const cardsContainer = document.getElementById('disclosedCardsContainer');

  const isValid = !isTamperSimulated && data.verification_status === 'valid';

  if (isValid) {
    banner.className = 'verification-status-banner banner-valid';
    if (bannerIcon) bannerIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    title.textContent = 'Cryptographically Valid Proof Bundle';
    sub.textContent = 'All disclosed claims have passed HMAC-SHA256 signature verification against registered root issuers.';
    chip.className = 'status-chip chip-valid';
    chip.textContent = 'VALIDATED';
  } else {
    banner.className = 'verification-status-banner banner-tampered';
    if (bannerIcon) bannerIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    title.textContent = 'Cryptographic Verification Failed (Tampered Payload)';
    sub.textContent = 'HMAC signature verification failed. One or more claim payload values were altered after issuer signature.';
    chip.className = 'status-chip chip-tampered';
    chip.textContent = 'TAMPERED / INVALID';
  }

  const creds = data.credentials || [];
  cardsContainer.innerHTML = creds.map((cred, idx) => {
    let displayClaim = { ...cred.claim };
    if (isTamperSimulated && idx === 0) {
      displayClaim = { ...displayClaim, 'simulated_unauthorized_edit': 'Turnover altered from ₹2.5L to ₹250.0 Cr' };
    }

    const claimRows = Object.entries(displayClaim).map(([k, v]) => `
      <li style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
        <span style="color: var(--text-secondary);">${formatClaimKey(k)}</span>
        <strong style="color: ${k.includes('simulated') ? 'var(--accent-rose)' : 'var(--text-main)'};">${v}</strong>
      </li>
    `).join('');

    return `
      <div class="panel" style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong style="font-size: 0.95rem;">${formatCredType(cred.type)}</strong>
          <span class="scope-pill">${cred.issuer}</span>
        </div>
        <ul style="list-style: none; background: #f8fafc; padding: 10px 12px; border-radius: 6px; font-size: 0.78rem;">
          ${claimRows}
        </ul>
      </div>
    `;
  }).join('');
}

// ========================================================
// Onboarding View Logic
// ========================================================
async function handleOnboardingExtract() {
  const text = document.getElementById('txtConversationalTranscript')?.value.trim();
  if (!text) {
    showToast('Please enter a spoken transcript.', 'warning');
    return;
  }

  const btnText = document.getElementById('btnExtractText');
  btnText.textContent = 'Extracting Details...';

  try {
    const res = await fetch(`${AGENT_URL}/agent/onboard-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_transcript_or_text: text, csc_agent_id: 'did:person:csc001' }),
    });
    const data = await res.json();
    if (data.success) {
      currentOnboardProposal = data;
      document.getElementById('extractionPlaceholder').style.display = 'none';
      document.getElementById('proposalResultBox').style.display = 'block';

      const b = data.proposed_business;
      document.getElementById('lblBizName').textContent = b.name;
      document.getElementById('lblBizMeta').textContent = `Sector: ${b.sector} • Location: ${b.location}`;
      document.getElementById('lblOwnerMeta').textContent = `Proprietor: ${b.owner_name}`;

      const c = data.proposed_starter_credential.claim;
      document.getElementById('lblCredClaim').innerHTML = `
        <div><strong>Nature:</strong> ${c.business_nature}</div>
        <div><strong>Established:</strong> ${c.established_year}</div>
        <div><strong>Monthly Revenue:</strong> ${c.approx_monthly_revenue}</div>
        <div><strong>Witness:</strong> ${c.witness_notes}</div>
      `;
      showToast('Structured profile extracted.', 'success');
    }
  } catch (err) {
    showToast('Extraction service unavailable.', 'info');
  } finally {
    btnText.textContent = 'Extract Structured Details';
  }
}

async function handleConfirmOnboardRegistration() {
  if (!currentOnboardProposal) return;
  try {
    const bizRes = await fetch(`${BACKEND_URL}/business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: currentOnboardProposal.proposed_business.name,
        primary_language: currentOnboardProposal.proposed_business.primary_language,
        owner_person_id: 'did:person:ramesh001',
        metadata: {
          sector: currentOnboardProposal.proposed_business.sector,
          location: currentOnboardProposal.proposed_business.location,
          onboarding_source: 'csc_agent',
        },
      }),
    });
    const bizData = await bizRes.json();
    if (bizData.success) {
      document.getElementById('proposalResultBox').style.display = 'none';
      document.getElementById('onboardSuccessScreen').style.display = 'block';
      document.getElementById('succBizName').textContent = currentOnboardProposal.proposed_business.name;
      document.getElementById('succDidTag').textContent = bizData.business.business_id;
      showToast('Digital Business DID minted successfully.', 'success');
    }
  } catch (err) {
    showToast('Failed to mint DID.', 'error');
  }
}

// Helpers
function formatCredType(type) {
  if (!type) return '';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatClaimKey(key) {
  if (!key) return '';
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatAuditAction(action) {
  if (!action) return '';
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

document.addEventListener('DOMContentLoaded', init);
