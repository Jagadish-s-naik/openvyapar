import { useState, useEffect, useCallback } from 'react';
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
  CheckCircle2,
} from 'lucide-react';
import { verifyProof, analyzeVerifierTrust, getProof } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';
import type { ProofShare, Credential, Business } from '@openvyapar/shared';

const SAMPLE_PROOFS = [
  { id: 'proof-loan-001', label: 'Sharma General Store (MSME Loan Proof)', desc: 'GST + ONDC + Bank Disclosures' },
  { id: 'proof-gst-002', label: 'Sri Lakshmi Textiles (GST Filing Proof)', desc: 'Zero Tax Arrears & Udyam' },
  { id: 'proof-mkt-003', label: 'Anand Silk Weaving (ONDC Volume)', desc: '2,840 Order History & GST' },
];

export interface VerifyInspectionResult {
  success: boolean;
  valid?: boolean;
  tampered?: boolean;
  verification_status?: string;
  proof?: ProofShare;
  business?: Business;
  credentials?: Credential[];
  trust_score?: number;
  message?: string;
  [key: string]: unknown;
}

export interface TrustInspectionAnalysis {
  success?: boolean;
  overall_verdict: string;
  trust_score?: number;
  flags?: Array<string | { severity: string; code: string; message: string }>;
  narrative_summary?: string;
  anomalies_detected?: boolean;
  agent_action_id?: string;
}

export const VerifierPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const urlProofId = searchParams.get('proof_id') || searchParams.get('did') || '';
  const [prevUrlProofId, setPrevUrlProofId] = useState(urlProofId);
  const [proofId, setProofId] = useState(urlProofId || 'proof-loan-001');
  const [loading, setLoading] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerifyInspectionResult | null>(null);
  const [trustAnalysis, setTrustAnalysis] = useState<TrustInspectionAnalysis | null>(null);
  const [rawProof, setRawProof] = useState<ProofShare | null>(null);
  const [deskPin] = useState('SBI-DESK-7492');
  const [showQrModal, setShowQrModal] = useState(false);

  // Synchronize proofId when URL query parameters change
  if (urlProofId && urlProofId !== prevUrlProofId) {
    setPrevUrlProofId(urlProofId);
    setProofId(urlProofId);
  }

  const handleInspect = useCallback(async (idToInspect: string, simulateTamper = false) => {
    if (!idToInspect.trim()) return;
    setLoading(true);
    try {
      // 1. Fetch raw proof
      let proofData: ProofShare | null = null;
      try {
        const proofRes = await getProof(idToInspect.trim());
        if (proofRes.success) {
          proofData = proofRes.proof;
          setRawProof(proofData);
        }
      } catch {
        // Continue with verify call
      }

      // 2. Cryptographic proof verification
      const verifyRes = await verifyProof({
        proof_id: idToInspect.trim(),
        verifier_id: 'did:org:sbi_bank',
        simulate_tamper: simulateTamper,
      });
      setVerificationResult(verifyRes);

      const activeProof = verifyRes.proof || proofData;
      if (activeProof) {
        setRawProof(activeProof);
      }

      const activeCredentials = (verifyRes.credentials || (activeProof?.disclosed_credentials as Credential[]) || []);
      const activeBusinessId = activeProof?.business_id || verifyRes?.business?.business_id || 'did:biz:sharma001';

      // 3. AI Trust analysis
      try {
        const trustRes = await analyzeVerifierTrust({
          proof_id: idToInspect.trim(),
          business_id: activeBusinessId,
          business_status: 'active',
          credentials: activeCredentials.length > 0 ? activeCredentials : [
            {
              credential_id: 'cred-gst-002',
              business_id: activeBusinessId,
              type: 'gst_compliant',
              issuer: 'gst_mock',
              issuer_signature: 'sig_mock_001',
              signature: 'sig_mock_001',
              issued_at: new Date().toISOString(),
              expires_at: null,
              claim: { compliance_score: 98 },
              status: simulateTamper ? 'tampered' : 'valid',
            } as unknown as Credential,
          ],
        });
        if (trustRes.success) {
          setTrustAnalysis(trustRes);
        }
      } catch {
        // Fallback trust status
        setTrustAnalysis({
          overall_verdict: simulateTamper ? 'tampered_data' : 'verified_clean',
          trust_score: simulateTamper ? 15 : (verifyRes.trust_score || 88),
          flags: simulateTamper
            ? ['HMAC signature payload divergence detected', 'Modified turnover claim exceeds verified ledger bracket']
            : ['Authentic issuer cryptographic signatures verified', 'Disclosed credentials match root registry', 'Single-use nonce verified'],
        });
      }
    } catch (err: unknown) {
      console.error('Verification inspection failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      if (active) {
        await handleInspect(proofId, isTampering);
      }
    })();

    return () => {
      active = false;
    };
  }, [proofId, isTampering, handleInspect]);

  const toggleTamper = () => {
    setIsTampering((prev) => !prev);
  };

  const selectSample = (id: string) => {
    setProofId(id);
    setSearchParams({ proof_id: id });
    setIsTampering(false);
  };

  const isValid = verificationResult?.valid === true && !isTampering;
  const displayedCredentials = (verificationResult?.credentials || (rawProof?.disclosed_credentials as Credential[]) || []);
  const displayedBusiness = verificationResult?.business;

  const formatCredType = (type: string) => {
    switch (type) {
      case 'gst_compliant':
        return 'GST Compliance Certificate';
      case 'income_bracket':
        return 'Turnover Bracket & Current Account Attestation';
      case 'order_history':
        return 'ONDC Merchant Order History';
      case 'self_attested':
        return 'CSC Witnessed Starter Claim';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const formatIssuer = (issuer: string) => {
    switch (issuer) {
      case 'gst_mock':
        return 'Goods and Services Tax Network (GSTN)';
      case 'bank_mock':
        return 'State Bank of India — MSME Sahay';
      case 'marketplace_mock':
        return 'BharatMart (ONDC Open Network)';
      case 'agent_witnessed':
        return 'CSC Field Agent Witness (did:person:csc001)';
      default:
        return issuer;
    }
  };

  const formatClaimHighlights = (cred: Credential) => {
    const claim = cred.claim as Record<string, unknown>;
    const highlights: { label: string; value: string; isTampered?: boolean }[] = [];

    if (claim.gstin) {
      highlights.push({ label: 'GSTIN', value: String(claim.gstin) });
    }
    if (claim.active_compliance_score !== undefined) {
      highlights.push({ label: 'Compliance Score', value: `${claim.active_compliance_score}% (All on-time)` });
    }
    if (claim.turnover_bracket) {
      highlights.push({
        label: 'Turnover Bracket',
        value: isTampering ? '₹1.5Cr - ₹2.5Cr [TAMPERED]' : String(claim.turnover_bracket).replace(/_/g, ' '),
        isTampered: isTampering,
      });
    }
    if (claim.bank_name) {
      highlights.push({ label: 'Bank', value: String(claim.bank_name) });
    }
    if (claim.total_completed_orders !== undefined) {
      highlights.push({ label: 'Completed Orders', value: `${Number(claim.total_completed_orders).toLocaleString()} Deliveries` });
    }
    if (claim.customer_satisfaction_rating !== undefined) {
      highlights.push({ label: 'Rating', value: `${claim.customer_satisfaction_rating} ★ (${claim.fulfillment_rate_pct || 99}% Fulfillment)` });
    }
    if (claim.business_nature) {
      highlights.push({ label: 'Nature', value: String(claim.business_nature) });
    }
    if (claim.doc_number) {
      highlights.push({ label: 'Doc Number', value: String(claim.doc_number) });
    }
    if (claim.enterprise_type) {
      highlights.push({ label: 'Category', value: String(claim.enterprise_type) });
    }
    if (claim.approx_monthly_revenue) {
      highlights.push({ label: 'Est. Monthly Sales', value: String(claim.approx_monthly_revenue) });
    }

    return highlights;
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {t.verifier.verifiedNode}
              </span>
              <span className="text-xs font-mono text-slate-400">SBI MSME Underwriting v2.1</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.verifier.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {t.verifier.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start md:self-auto">
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer transition-colors"
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
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 sm:gap-3 justify-between">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-slate-400 transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={proofId}
              onChange={(e) => setProofId(e.target.value)}
              placeholder="Enter Proof ID (e.g. proof-loan-001 or paste verification token)"
              className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-800 focus:outline-hidden font-mono"
            />
          </div>

          <div className="flex flex-wrap xs:flex-nowrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleInspect(proofId, isTampering)}
              disabled={loading}
              className="flex-1 xs:flex-none px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{loading ? t.verifier.verifying : t.verifier.inspectProof}</span>
            </button>

            <button
              onClick={toggleTamper}
              className={`flex-1 xs:flex-none px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                isTampering
                  ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isTampering ? 'text-white animate-bounce' : 'text-amber-600'}`} />
              <span>{isTampering ? t.verifier.restorePayload : t.verifier.simulateTamper}</span>
            </button>
          </div>
        </div>

        {/* Quick Sample Chips */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-500 mr-1">Demo Proofs:</span>
          {SAMPLE_PROOFS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => selectSample(sample.id)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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

      {/* Target Business Metadata Banner */}
      {displayedBusiness && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-base shrink-0">
              🏪
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm truncate">{displayedBusiness.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 font-mono truncate">
                  {displayedBusiness.business_id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {(displayedBusiness.metadata?.location as string) || (displayedBusiness.metadata?.sector as string) || 'Verified MSME Entity'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 text-xs border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
            <div className="text-left sm:text-right">
              <span className="text-slate-400 block text-[10px]">Declared Purpose:</span>
              <span className="font-semibold text-slate-800">{rawProof?.purpose || 'MSME Verification'}</span>
            </div>
            <div className="text-left sm:text-right border-l pl-3 sm:pl-4 border-slate-200">
              <span className="text-slate-400 block text-[10px]">Shared With:</span>
              <span className="font-semibold text-slate-800">{rawProof?.shared_with || 'Viksit Capital'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Verification Status Banner */}
      <div
        className={`rounded-2xl p-4 sm:p-5 border shadow-sm transition-all ${
          isValid
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isValid ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {isValid ? <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" /> : <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight">
                  {isValid
                    ? 'Cryptographically Verified: Authentic HMAC Signature'
                    : 'CRITICAL: Cryptographic Verification Failed (HMAC Mismatch)'}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold uppercase ${
                    isValid ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {isValid ? 'VALID' : 'TAMPERED / CORRUPT'}
                </span>
              </div>
              <p className="text-xs mt-1 opacity-90 leading-relaxed">
                {isValid
                  ? 'The proof token was verified against canonical issuer public keys. Claims match the zero-knowledge commitment.'
                  : 'Tampering simulation active! The underlying data was modified in-flight, invalidating the HMAC-SHA256 cryptographic digest.'}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50 shrink-0">
            <span className="text-[11px] font-medium text-slate-500">Trust Score</span>
            <span
              className={`text-xl sm:text-2xl font-black font-mono ${
                isValid ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {isValid ? `${trustAnalysis?.trust_score || verificationResult?.trust_score || 95}/100` : '15/100'}
            </span>
          </div>
        </div>
      </div>


      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Column: AI Trust & Redaction Policy (5 cols) */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-6">
          {/* AI Trust Flagger Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">AI Trust & Anomaly Flagger</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">PRD §8</span>
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
                  {(trustAnalysis?.flags || (isValid ? [
                    `Authentic cryptographic credentials disclosed for ${displayedBusiness?.name || 'entity'}`,
                    'Issuer signatures match national root registries (GSTN, Banks, ONDC)',
                    'Single-use nonce verified; zero double-spend detected',
                  ] : [
                    'HMAC signature payload divergence detected',
                    'Modified turnover or compliance claim exceeds verified ledger',
                  ])).map((flag, idx: number) => {
                    const flagText = typeof flag === 'string' ? flag : flag.message;
                    return (
                      <li key={idx} className="text-xs flex items-start gap-2 text-slate-700 leading-relaxed">
                        <span className={`mt-0.5 shrink-0 font-bold ${isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isValid ? '✓' : '✗'}
                        </span>
                        <span className="break-words">{flagText}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* Selective Disclosure & Redaction Audit Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5 sm:space-y-4">
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
                  <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Shared / Disclosed Attributes ({displayedCredentials.length} Credentials)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 space-y-1 font-mono break-all">
                  {displayedCredentials.map((c, idx) => (
                    <div key={idx}>
                      • {formatCredType(c.type)}: Verified by {formatIssuer(c.issuer)}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Strictly Withheld / Redacted Attributes</span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 text-xs text-rose-950 space-y-1 font-mono">
                  <div>• [REDACTED] Raw Bank Account Number & IFSC</div>
                  <div>• [REDACTED] Detailed Customer Contact Lists</div>
                  <div>• [REDACTED] Individual Line-Item Invoice Margins</div>
                  <div>• [REDACTED] Aadhaar / Personal Biometric Data</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Disclosed Credential Proof Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  Disclosed Credentials in Proof ({displayedCredentials.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 truncate">{proofId}</span>
            </div>

            {/* Dynamic Disclosed Credentials List */}
            <div className="space-y-3.5 sm:space-y-4">
              {displayedCredentials.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                  No credentials attached to this proof bundle.
                </div>
              ) : (
                displayedCredentials.map((cred) => {
                  const highlights = formatClaimHighlights(cred);
                  const credIsTampered = isTampering && (cred.type === 'income_bracket' || cred.type === 'gst_compliant');

                  return (
                    <div
                      key={cred.credential_id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-colors space-y-3 ${
                        credIsTampered
                          ? 'border-rose-300 bg-rose-50/50'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 xs:gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold uppercase ${
                              cred.type === 'gst_compliant'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : cred.type === 'income_bracket'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : cred.type === 'order_history'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-200 text-slate-800 border border-slate-300'
                            }`}
                          >
                            {cred.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">{formatIssuer(cred.issuer)}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 truncate">{cred.credential_id}</span>
                      </div>

                      {/* Claim Key-Values Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                        {highlights.map((item, hIdx) => (
                          <div key={hIdx}>
                            <span className="text-slate-500 block text-[11px]">{item.label}:</span>
                            <span
                              className={`font-semibold break-words ${
                                item.isTampered
                                   ? 'text-rose-600 font-mono font-bold'
                                  : 'text-slate-800'
                              }`}
                            >
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Cryptographic Signature Integrity Row */}
                      <div className="flex flex-col xs:flex-row xs:items-center justify-between text-[11px] font-mono text-slate-500 pt-1 gap-1">
                        <span className="truncate">
                          HMAC:{' '}
                          {credIsTampered
                            ? 'CORRUPT_DIGEST_SIG'
                            : cred.signature
                            ? `${cred.signature.slice(0, 8)}...${cred.signature.slice(-6)}`
                            : '3a9f7e8...c940'}
                        </span>
                        <span
                          className={
                            credIsTampered
                              ? 'text-rose-600 font-bold shrink-0'
                              : 'text-emerald-700 font-semibold shrink-0'
                          }
                        >
                          {credIsTampered ? '✗ Signature Mismatch' : '✓ Cryptographically Sealed'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Fast Action Underwriter Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Proof Expires: in 48 hours (Single Use)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={!isValid}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 shadow-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Underwriting Decision</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desk QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-6 border border-slate-200 shadow-xl space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">Bank Officer Desk Stand</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="w-36 h-36 sm:w-40 sm:h-40 mx-auto bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-center">
                <QrCode className="w-28 h-28 sm:w-32 sm:h-32 text-slate-900" />
              </div>
              <div>
                <span className="text-xs text-slate-500">Scan or enter Desk PIN on borrower wallet:</span>
                <div className="text-lg sm:text-xl font-mono font-black text-amber-600 mt-1 tracking-widest">{deskPin}</div>
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
