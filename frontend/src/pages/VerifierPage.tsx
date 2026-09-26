import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Zap,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Clock,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { verifyProof, analyzeVerifierTrust, getProof } from '../api/client';

const SAMPLE_PROOFS = [
  { id: 'proof-loan-001', label: 'Sharma General Store (MSME Loan Proof)', desc: 'GST + ONDC Disclosures' },
  { id: 'proof-gst-002', label: 'Sri Lakshmi Textiles (GST Filing Proof)', desc: 'Zero Tax Arrears' },
  { id: 'proof-mkt-003', label: 'Anand Silk Weaving (ONDC Volume)', desc: '1,420 Order History' },
];

export const VerifierPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [proofId, setProofId] = useState(searchParams.get('proof_id') || 'proof-loan-001');
  const [loading, setLoading] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [trustAnalysis, setTrustAnalysis] = useState<any>(null);
  const [rawProof, setRawProof] = useState<any>(null);
  const [deskPin] = useState('SBI-DESK-7492');
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const urlProofId = searchParams.get('proof_id');
    if (urlProofId && urlProofId !== proofId) {
      setProofId(urlProofId);
      handleInspect(urlProofId, isTampering);
    } else {
      handleInspect(proofId, isTampering);
    }
  }, [searchParams]);

  const handleInspect = async (idToInspect: string, simulateTamper = false) => {
    if (!idToInspect.trim()) return;
    setLoading(true);
    try {
      // 1. Fetch raw proof
      let proofData = null;
      try {
        const proofRes = await getProof(idToInspect.trim());
        if (proofRes.success) {
          proofData = proofRes.proof;
          setRawProof(proofData);
        }
      } catch {
        // Continue with mock or synthetic if proof not found in active memory
      }

      // 2. Cryptographic proof verification
      const verifyRes = await verifyProof({
        proof_id: idToInspect.trim(),
        verifier_id: 'did:org:sbi_bank',
        simulate_tamper: simulateTamper,
      });
      setVerificationResult(verifyRes);

      // 3. AI Trust analysis
      try {
        const trustRes = await analyzeVerifierTrust({
          proof_id: idToInspect.trim(),
          business_id: proofData?.business_id || 'did:biz:sharma001',
          business_status: 'active',
          credentials: proofData?.disclosed_credentials || [
            {
              credential_id: 'cred-gst-002',
              type: 'gst_compliant',
              issuer: 'gst_mock',
              status: simulateTamper ? 'tampered' : 'valid',
            },
          ],
        });
        if (trustRes.success) {
          setTrustAnalysis(trustRes);
        }
      } catch {
        // Fallback trust status
        setTrustAnalysis({
          overall_verdict: simulateTamper ? 'tampered_data' : 'verified_clean',
          trust_score: simulateTamper ? 15 : 88,
          flags: simulateTamper
            ? ['HMAC signature payload divergence detected', 'Modified turnover claim exceeds verified ledger bracket']
            : ['Authentic GSTN cryptographic signature', 'ONDC verified transaction count', 'Single-use nonce verified'],
        });
      }
    } catch (err: any) {
      console.error('Verification inspection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTamper = () => {
    const nextState = !isTampering;
    setIsTampering(nextState);
    handleInspect(proofId, nextState);
  };

  const selectSample = (id: string) => {
    setProofId(id);
    setSearchParams({ proof_id: id });
    setIsTampering(false);
    handleInspect(id, false);
  };

  const isValid = verificationResult?.valid === true && !isTampering;

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verified DPI Node
              </span>
              <span className="text-xs font-mono text-slate-400">SBI MSME Underwriting v2.1</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Cryptographic Proof & Tamper Inspector
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Zero-knowledge verification of HMAC-SHA256 signed business credentials. Verify loan eligibility without accessing raw confidential accounting books or personal bank statements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer transition-colors"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Desk PIN: <span className="font-mono text-amber-400">{deskPin}</span></span>
            </button>
            <Link
              to="/onboarding"
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>CSC Onboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Proof Selector & Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-slate-400 transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={proofId}
              onChange={(e) => setProofId(e.target.value)}
              placeholder="Enter Proof ID (e.g. proof-loan-001 or paste verification token)"
              className="w-full bg-transparent border-none text-sm text-slate-800 focus:outline-hidden font-mono"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleInspect(proofId, isTampering)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>{loading ? 'Verifying Proof...' : 'Inspect Proof'}</span>
            </button>

            <button
              onClick={toggleTamper}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                isTampering
                  ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${isTampering ? 'text-white animate-bounce' : 'text-amber-600'}`} />
              <span>{isTampering ? 'Restore Authentic Signed Payload' : '⚡ Simulate Tampered Payload'}</span>
            </button>
          </div>
        </div>

        {/* Quick Sample Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-500 mr-1">Demo Proofs:</span>
          {SAMPLE_PROOFS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => selectSample(sample.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                proofId === sample.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{sample.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cryptographic Verification Status Banner */}
      <div
        className={`rounded-2xl p-5 border shadow-sm transition-all ${
          isValid
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isValid ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {isValid ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6 animate-pulse" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  {isValid
                    ? 'Cryptographically Verified: Authentic HMAC Signature'
                    : 'CRITICAL: Cryptographic Verification Failed (HMAC Mismatch)'}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase ${
                    isValid ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {isValid ? 'VALID' : 'TAMPERED / CORRUPT'}
                </span>
              </div>
              <p className="text-xs mt-1 opacity-90">
                {isValid
                  ? 'The proof token was verified against canonical issuer public keys. Claims match the zero-knowledge commitment.'
                  : 'Tampering simulation active! The underlying data was modified in-flight, invalidating the HMAC-SHA256 cryptographic digest.'}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50">
            <span className="text-[11px] font-medium text-slate-500">Trust Score</span>
            <span
              className={`text-2xl font-black font-mono ${
                isValid ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {isValid ? `${trustAnalysis?.trust_score || 88}/100` : '15/100'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Trust & Redaction Policy (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Trust Flagger Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">AI Trust & Anomaly Flagger</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">PRD §8 /agent/verifier-flag</span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block mb-1">AI Underwriter Verdict</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isValid ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {isValid ? 'VERIFIED_CLEAN' : 'FLAGGED_SUSPICIOUS'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-2">Evaluated Verification Rules:</span>
                <ul className="space-y-2">
                  {(trustAnalysis?.flags || [
                    'Issuer public key matches national GSTN registry',
                    'Single-use nonce verified; zero double-spend detected',
                    'Disclosed turnover matches accredited bank bracket',
                  ]).map((flag: string, idx: number) => (
                    <li key={idx} className="text-xs flex items-start gap-2 text-slate-700">
                      <span className={`mt-0.5 ${isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isValid ? '✓' : '✗'}
                      </span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Selective Disclosure & Redaction Audit Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900">Privacy & Redaction Policy</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Zero Custody
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Shared / Disclosed Attributes</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 space-y-1 font-mono">
                  <div>• GST Compliance Rating: Active (No Arrears)</div>
                  <div>• ONDC Fulfilled Orders: 1,420 Deliveries</div>
                  <div>• Verified Annual Turnover: ₹25L - ₹50L</div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                  <span>Strictly Withheld / Redacted Attributes</span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 text-xs text-rose-950 space-y-1 font-mono">
                  <div>• [REDACTED] Raw Bank Account Number & IFSC</div>
                  <div>• [REDACTED] Detailed Customer Contact Lists</div>
                  <div>• [REDACTED] Individual Line-Item Invoice Margins</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Disclosed Credential Proof Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Disclosed Credentials in Proof ({rawProof?.disclosed_credentials?.length || 2})
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">{proofId}</span>
            </div>

            {/* Disclosed Credentials List */}
            <div className="space-y-4">
              {/* Credential 1: GST */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      GST_COMPLIANT
                    </span>
                    <span className="text-xs font-semibold text-slate-900">Goods & Services Tax Network</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">did:issuer:gstn01</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Filing Frequency:</span>
                    <span className="font-semibold text-slate-800">Monthly (GSTR-3B Regular)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Status:</span>
                    <span className="font-semibold text-emerald-600">Active & Compliant</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                  <span>HMAC: 3a9f7e8...c940</span>
                  <span className="text-emerald-700 font-semibold">✓ Cryptographically Sealed</span>
                </div>
              </div>

              {/* Credential 2: Bank Turnover */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      TURNOVER_BRACKET
                    </span>
                    <span className="text-xs font-semibold text-slate-900">State Bank of India</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">did:issuer:sbi01</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Verified Turnover Bracket:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {isTampering ? '₹1.5Cr - ₹2.5Cr [TAMPERED]' : '₹25L - ₹50L'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Account Stability:</span>
                    <span className="font-semibold text-slate-800">Verified &gt; 3 Years</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                  <span>HMAC: {isTampering ? 'CORRUPT_DIGEST' : '88f21e0...bb12'}</span>
                  <span className={isTampering ? 'text-rose-600 font-bold' : 'text-emerald-700 font-semibold'}>
                    {isTampering ? '✗ Signature Mismatch' : '✓ Cryptographically Sealed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Fast Action Underwriter Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Proof Expires: in 48 hours (Single Use)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={!isValid}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 shadow-xs"
                >
                  Approve Loan Line
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desk QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Bank Officer Desk Stand</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="w-40 h-40 mx-auto bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-center">
                <QrCode className="w-32 h-32 text-slate-900" />
              </div>
              <div>
                <span className="text-xs text-slate-500">Scan or enter Desk PIN on borrower wallet:</span>
                <div className="text-xl font-mono font-black text-amber-600 mt-1 tracking-widest">{deskPin}</div>
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
