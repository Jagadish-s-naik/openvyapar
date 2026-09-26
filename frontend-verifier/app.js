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
    loadProof(document.getElementById('txtProofIdInput').value.trim());
  });

  document.getElementById('btnSimulateTamper').addEventListener('click', () => {
    isTamperSimulated = !isTamperSimulated;
    renderProofView(currentProofData);
  });

  await loadProof(document.getElementById('txtProofIdInput').value.trim());
}

async function loadProof(proofId) {
  if (!proofId) return;

  try {
    const res = await fetch(`${BACKEND_URL}/proof/verify/${proofId}`);
    const data = await res.json();
    if (!data.success) {
      alert(`Proof ${proofId} not found.`);
      return;
    }

    currentProofData = data;
    renderProofView(data);
    await fetchAiTrustFlags(data);
  } catch (err) {
    alert('Could not connect to OpenVyapar backend.');
  }
}

function renderProofView(data) {
  if (!data) return;

  const banner = document.getElementById('statusBanner');
  const title = document.getElementById('txtStatusTitle');
  const sub = document.getElementById('txtStatusSubtitle');
  const chip = document.getElementById('badgeStatusChip');
  const cardsContainer = document.getElementById('disclosedCardsContainer');

  const isValid = !isTamperSimulated && data.verification_status === 'valid';

  if (isValid) {
    banner.className = 'verification-status-banner banner-valid';
    title.textContent = '✅ Cryptographically Valid Proof';
    sub.textContent = `Issued for: ${data.proof.purpose.replace(/_/g, ' ')} • Shared with: ${data.proof.shared_with}`;
    chip.className = 'status-chip chip-valid';
    chip.textContent = 'VALID';
  } else {
    banner.className = 'verification-status-banner banner-tampered';
    title.textContent = '🚨 Cryptographic Verification FAILED (Tampered Payload)';
    sub.textContent = 'HMAC signature verification failed. The credential claim payload does not match the issuer signature.';
    chip.className = 'status-chip chip-tampered';
    chip.textContent = 'TAMPERED';
  }

  // Render Credential Cards
  cardsContainer.innerHTML = data.credentials.map((cred) => {
    let displayClaim = { ...cred.claim };
    if (isTamperSimulated) {
      displayClaim = { ...displayClaim, simulated_unauthorized_modification: 'Turnover figure illegally altered from 25L to 250Cr' };
    }

    const claimRows = Object.entries(displayClaim)
      .map(([k, v]) => `<div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;"><span style="color: var(--text-muted);">${k}:</span><strong>${v}</strong></div>`)
      .join('');

    return `
      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: var(--radius-md); padding: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <strong style="color: #60a5fa; font-size: 0.95rem;">${cred.type.toUpperCase()}</strong>
          <span style="font-size: 0.75rem; color: var(--text-dim);">${cred.issuer}</span>
        </div>
        <div style="margin-bottom: 12px;">${claimRows}</div>
        <div style="font-family: monospace; font-size: 0.68rem; color: var(--text-dim); border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;">
          Sig: ${cred.signature.slice(0, 24)}...
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
        <div style="font-size: 0.8rem; background: rgba(255,255,255,0.04); padding: 6px 10px; border-radius: 4px; display: flex; align-items: center; gap: 6px;">
          <span>${f.severity === 'alert' ? '🚨' : f.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
          <span>${f.message}</span>
        </div>
      `).join('');
    }
  } catch (err) {
    document.getElementById('txtTrustSummary').textContent = 'AI Trust Agent service offline.';
  }
}

document.addEventListener('DOMContentLoaded', init);
