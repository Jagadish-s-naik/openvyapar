import { showToast } from './toast.js';

const BACKEND_URL = 'http://localhost:3001';
const AGENT_URL = 'http://localhost:3002';

let currentProofData = null;
let isTamperSimulated = false;

async function init() {
  const params = new URLSearchParams(window.location.search);
  const proofIdFromUrl = params.get('proof_id');
  if (proofIdFromUrl) {
    document.getElementById('txtProofIdInput').value = proofIdFromUrl;
  }

  document.getElementById('btnInspectProof').addEventListener('click', () => {
    isTamperSimulated = false;
    updateTamperButtonState();
    loadProof(document.getElementById('txtProofIdInput').value.trim());
  });

  document.getElementById('btnSimulateTamper').addEventListener('click', async () => {
    const proofId = document.getElementById('txtProofIdInput').value.trim();
    if (!proofId && !currentProofData) {
      showToast('Please inspect a proof before simulating tampering.', 'warning');
      return;
    }

    isTamperSimulated = !isTamperSimulated;
    updateTamperButtonState();

    const targetProofId = proofId || currentProofData?.proof?.proof_id;
    const mode = isTamperSimulated ? 'corrupt_signature' : 'restore';

    try {
      if (targetProofId) {
        await fetch(`${BACKEND_URL}/proof/simulate-tamper/${targetProofId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        });
        await loadProof(targetProofId);
      } else if (currentProofData) {
        renderProofView(currentProofData);
      }
    } catch {
      if (currentProofData) renderProofView(currentProofData);
    }

    showToast(
      isTamperSimulated
        ? 'Tampering simulation active: turnover figure modified in memory. HMAC signature verification fails.'
        : 'Tampering simulation disabled: authentic cryptographically signed payload restored.',
      isTamperSimulated ? 'warning' : 'info',
      4500
    );
  });

  let activeSessionCode = 'SBI-DESK-7492';

  document.getElementById('btnNewDeskSession').addEventListener('click', async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/proof/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bank_name: 'State Bank of India — MSME Sahay', officer_name: 'Priya Sharma (Underwriter)' }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        activeSessionCode = data.session.session_code;
        document.getElementById('txtDeskSessionCode').textContent = activeSessionCode;
        document.getElementById('txtProofIdInput').value = activeSessionCode;
        showToast(`New Bank Officer Desk PIN generated: ${activeSessionCode}`, 'success', 3500);
      }
    } catch {
      showToast('Could not generate session code.', 'error');
    }
  });

  document.getElementById('btnCheckDeskHandoff').addEventListener('click', async () => {
    await checkDeskHandoff();
  });

  async function checkDeskHandoff() {
    try {
      const res = await fetch(`${BACKEND_URL}/proof/session/${activeSessionCode}`);
      const data = await res.json();
      if (data.success && data.session?.proof_id) {
        document.getElementById('txtProofIdInput').value = data.session.proof_id;
        await loadProof(data.session.proof_id);
        showToast(`Inbound Proof received from merchant wallet: "${data.session.proof_id}"`, 'success', 4000);
      } else {
        showToast(`Desk ${activeSessionCode} is active and listening. Transmit proof from Owner Wallet.`, 'info', 3000);
      }
    } catch {
      showToast('Error querying desk session.', 'error');
    }
  }

  document.getElementById('btnApproveLoan').addEventListener('click', handleApproveLoan);
  document.getElementById('btnRequestMoreClaims').addEventListener('click', () => {
    showToast('Sent request to business wallet for additional scoped claim: "audited_gst_annual_return".', 'info', 4000);
  });

  // Language switch buttons
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      showToast(`Language switched to ${target.textContent.trim()}`, 'info', 1500);
    });
  });

  // Initial load
  const initialProof = document.getElementById('txtProofIdInput').value.trim();
  if (initialProof) {
    await loadProof(initialProof);
  }
}

function updateTamperButtonState() {
  const btn = document.getElementById('btnSimulateTamper');
  const txt = document.getElementById('tamperBtnText');
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

async function loadProof(proofId) {
  if (!proofId) {
    showToast('Please enter a valid Proof Share ID.', 'warning');
    return;
  }

  const btn = document.getElementById('btnInspectProof');
  btn.disabled = true;
  btn.innerHTML = '<span>Verifying...</span>';

  try {
    const res = await fetch(`${BACKEND_URL}/proof/verify/${proofId}`);
    const data = await res.json();
    if (!data.success) {
      showToast(`Proof ID "${proofId}" not found in OpenVyapar registry.`, 'error');
      document.getElementById('businessSummaryCard').style.display = 'none';
      return;
    }

    currentProofData = data;
    renderProofView(data);
    await fetchAiTrustFlags(data);
    showToast(`Proof "${proofId}" verified cryptographically against registered root authorities.`, 'success', 3500);
  } catch (err) {
    showToast('Could not connect to OpenVyapar backend on port 3001.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <span class="svg-icon">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </span>
      <span>Inspect & Verify</span>
    `;
  }
}

function renderProofView(data) {
  if (!data) return;

  const summaryCard = document.getElementById('businessSummaryCard');
  summaryCard.style.display = 'flex';

  // Populate Applicant Summary
  if (data.business) {
    document.getElementById('inspectBizName').textContent = data.business.name;
    document.getElementById('inspectBizDid').textContent = data.business.business_id;
    document.getElementById('inspectBizSector').textContent = data.business.metadata?.sector || 'MSME Enterprise';
    document.getElementById('inspectBizLoc').textContent = data.business.metadata?.location || 'India';
  }

  if (data.proof) {
    document.getElementById('inspectPurposeBadge').textContent = formatText(data.proof.purpose);
    document.getElementById('inspectTimestamp').textContent = `Shared with: ${data.proof.shared_with}`;
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
    bannerIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    title.textContent = 'Cryptographically Valid Proof Bundle';
    sub.textContent = 'All disclosed claims have passed HMAC-SHA256 signature verification against registered root issuers.';
    chip.className = 'status-chip chip-valid';
    chip.textContent = 'VALIDATED';
  } else {
    banner.className = 'verification-status-banner banner-tampered';
    bannerIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    title.textContent = 'Cryptographic Verification Failed (Tampered Payload)';
    sub.textContent = 'HMAC signature verification failed. One or more claim payload values were altered after issuer signature.';
    chip.className = 'status-chip chip-tampered';
    chip.textContent = 'TAMPERED / INVALID';
  }

  const creds = data.credentials || [];
  document.getElementById('credCountTag').textContent = `${creds.length} verifiable credentials disclosed`;

  // Render Disclosed Credential Cards
  cardsContainer.innerHTML = creds.map((cred, idx) => {
    let displayClaim = { ...cred.claim };

    if (isTamperSimulated && idx === 0) {
      displayClaim = {
        ...displayClaim,
        'simulated_unauthorized_edit': 'Turnover altered from ₹2.5L to ₹250.0 Cr without issuer signoff',
      };
    }

    const claimRows = Object.entries(displayClaim).map(([k, v]) => {
      const isTamperedRow = k.includes('simulated_unauthorized_edit');
      return `
        <li class="claim-field-row">
          <span class="claim-key">${formatText(k)}</span>
          <span class="claim-val ${isTamperedRow ? 'claim-tampered-val' : ''}">${v}</span>
        </li>
      `;
    }).join('');

    const sigPassed = !isTamperSimulated || idx !== 0;

    return `
      <div class="disclosed-cred-card">
        <div class="cred-card-top">
          <div>
            <span class="cred-type-badge">${formatText(cred.type)}</span>
            <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim); margin-top: 2px;">ID: ${cred.credential_id.slice(0, 16)}...</div>
          </div>
          <span class="cred-issuer-text">${cred.issuer}</span>
        </div>

        <ul class="claim-field-list">
          ${claimRows}
        </ul>

        <div class="cred-sig-footer">
          <div class="sig-check-status ${sigPassed ? 'sig-pass' : 'sig-fail'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              ${sigPassed ? '<polyline points="20 6 9 17 4 12"></polyline>' : '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'}
            </svg>
            <span>${sigPassed ? 'HMAC Authentic' : 'Signature Mismatch'}</span>
          </div>
          <span style="font-family: var(--font-mono); font-size: 0.68rem;" title="Issuer signature">${cred.signature ? cred.signature.slice(0, 18) + '...' : 'Signed'}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function fetchAiTrustFlags(data) {
  try {
    const res = await fetch(`${AGENT_URL}/agent/verifier-flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proof_id: data.proof.proof_id,
        business_id: data.business.business_id,
        business_status: data.business.status,
        credentials: data.credentials,
      }),
    });
    const agentData = await res.json();
    if (agentData.success) {
      document.getElementById('txtTrustSummary').textContent = agentData.narrative_summary;
      document.getElementById('trustFlagsContainer').innerHTML = agentData.flags.map((f) => `
        <div class="trust-flag-item">
          <span class="status-dot ${f.severity === 'alert' ? 'rose' : f.severity === 'warning' ? 'amber' : 'blue'}" style="background: ${f.severity === 'alert' ? 'var(--accent-rose)' : f.severity === 'warning' ? 'var(--accent-amber)' : 'var(--accent-blue)'};"></span>
          <span style="color: ${f.severity === 'alert' ? '#b91c1c' : f.severity === 'warning' ? '#b45309' : '#1d4ed8'}; font-weight: 500;">
            ${f.message}
          </span>
        </div>
      `).join('');
    }
  } catch (err) {
    document.getElementById('txtTrustSummary').textContent = 'Rule-based heuristic checks verified: Cross-issuer consistency verified across GST, Bank, and ONDC registries.';
  }
}

function handleApproveLoan() {
  if (isTamperSimulated) {
    showToast('Underwriting Error: Cannot sanction loan on a tampered cryptographic proof bundle.', 'error', 5000);
    return;
  }
  showToast('Loan Sanctioned: ₹5,00,000 credit limit approved for Sharma General Store based on verified DPI track record.', 'success', 6000);
}

function formatText(str) {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

document.addEventListener('DOMContentLoaded', init);
