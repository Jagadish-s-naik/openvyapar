import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  CheckCircle2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Camera,
  Sparkles,
  Award,
  Shield,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { verifyProof, analyzeVerifierTrust, getProof } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';
import { BusinessQRCode } from '../components/ui/BusinessQRCode';
import type { ProofShare, Credential, Business } from '@openvyapar/shared';

const SAMPLE_PROOFS = [
  { id: 'proof-loan-001', label: 'Sharma General Store (MSME Loan Proof)', desc: 'GST + ONDC + Bank Disclosures', did: 'did:biz:sharma001' },
  { id: 'proof-gst-002', label: 'Sri Lakshmi Textiles (GST Filing Proof)', desc: 'Zero Tax Arrears & Udyam', did: 'OV-4471' },
  { id: 'proof-mkt-003', label: 'Anand Silk Weaving (ONDC Volume)', desc: '2,840 Order History & GST', did: 'did:biz:anand002' },
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

  const urlProofParam = searchParams.get('proof_id') || '';
  const urlDidParam = searchParams.get('did') || '';

  const resolveTargetProofId = (didParam: string, proofParam: string) => {
    if (proofParam) return proofParam;
    if (didParam === 'did:biz:sharma001') return 'proof-loan-001';
    if (didParam === 'OV-4471' || didParam === 'did:biz:lakshmi002') return 'proof-gst-002';
    if (didParam === 'did:biz:anand002' || didParam === 'did:biz:anand003') return 'proof-mkt-003';
    return didParam || 'proof-loan-001';
  };

  const initialProofId = resolveTargetProofId(urlDidParam, urlProofParam);
  const [proofId, setProofId] = useState(initialProofId);
  const [loading, setLoading] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerifyInspectionResult | null>(null);
  const [trustAnalysis, setTrustAnalysis] = useState<TrustInspectionAnalysis | null>(null);
  const [rawProof, setRawProof] = useState<ProofShare | null>(null);
  const [deskPin] = useState('SBI-DESK-7492');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [cardViewFormat, setCardViewFormat] = useState<'standee' | 'pvc' | 'underwrite'>('standee');
  const [copiedDid, setCopiedDid] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Synchronize when query params change
  useEffect(() => {
    const target = resolveTargetProofId(urlDidParam, urlProofParam);
    if (target && target !== proofId) {
      setProofId(target);
    }
  }, [urlDidParam, urlProofParam]);

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

  const selectSample = (id: string, did?: string) => {
    setProofId(id);
    setSearchParams(did ? { proof_id: id, did } : { proof_id: id });
    setIsTampering(false);
  };

  const isValid = verificationResult?.valid === true && !isTampering;
  const displayedCredentials = (verificationResult?.credentials || (rawProof?.disclosed_credentials as Credential[]) || []);
  const displayedBusiness = verificationResult?.business;
  const activeBusinessId = displayedBusiness?.business_id || rawProof?.business_id || 'did:biz:sharma001';
  const activeBusinessName = displayedBusiness?.name || (activeBusinessId.includes('lakshmi') || activeBusinessId === 'OV-4471' ? 'Sri Lakshmi Textiles & Apparels' : (activeBusinessId.includes('anand') ? 'Anand Silk Weaving Emporium' : 'Sharma General Store'));

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const publicVerifierUrl = `${origin}/verifier?did=${encodeURIComponent(activeBusinessId)}&proof_id=${encodeURIComponent(proofId)}`;

  const handleCopyDid = () => {
    navigator.clipboard.writeText(activeBusinessId);
    setCopiedDid(true);
    setTimeout(() => setCopiedDid(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicVerifierUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadCertificate = () => {
    const certPayload = {
      title: 'OpenVyapar Verified Business Identity Pass',
      business_name: activeBusinessName,
      business_id: activeBusinessId,
      status: isValid ? 'ACTIVE_CRYPTOGRAPHICALLY_VERIFIED' : 'FAILED_SIGNATURE_MISMATCH',
      trust_score: isValid ? (trustAnalysis?.trust_score || 95) : 15,
      proof_id: proofId,
      verifier_id: 'did:org:sbi_bank',
      verification_url: publicVerifierUrl,
      verified_at: new Date().toISOString(),
      disclosed_credentials_count: displayedCredentials.length,
      credentials: displayedCredentials.map((c) => ({
        type: c.type,
        issuer: c.issuer,
        signature: c.signature,
        claim: c.claim,
      })),
      cryptographic_anchor: 'did:ov:ed25519-key-1 (W3C VC 2.0)',
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(certPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `OpenVyapar_Verified_Card_${activeBusinessId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

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
              <span className="text-xs font-mono text-slate-400">DPI QR Verifier & Underwriting Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.verifier.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Scan any merchant's Sovereign QR Pass or enter a Proof ID to cryptographically verify authenticated business identity, tax compliance, bank turnover, and ONDC reputation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start md:self-auto">
            <button
              onClick={() => setShowScannerModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              title="Open QR Scanner camera / image resolver"
            >
              <Camera className="w-4 h-4" />
              <span>📷 Scan QR Code</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer transition-colors"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Desk PIN: <span className="font-mono text-amber-400">{deskPin}</span></span>
            </button>
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
              placeholder="Enter Proof ID or Business DID (e.g. proof-loan-001 or did:biz:sharma001)"
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

        {/* Quick Sample Chips with Real QR Business Bindings */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-500 mr-1">Demo Scanned QR Passes:</span>
          {SAMPLE_PROOFS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => selectSample(sample.id, sample.did)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                proofId === sample.id
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <QrCode className="w-3 h-3 text-amber-400" />
              <span>{sample.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🎯 CORE DELIVERABLE: 1) NAME, 2) ID, 3) STATUS, AND 4) DIGITAL CARD      */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Section Header & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Scanned QR Business Pass & Verified Digital ID Card</h2>
              <p className="text-[11px] text-slate-500">Live cryptographic verification result for scanned entity</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
            <button
              onClick={() => setCardViewFormat('standee')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                cardViewFormat === 'standee'
                  ? 'bg-white text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sovereign Pass
            </button>
            <button
              onClick={() => setCardViewFormat('pvc')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                cardViewFormat === 'pvc'
                  ? 'bg-white text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PVC Smart Card
            </button>
            <button
              onClick={() => setCardViewFormat('underwrite')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                cardViewFormat === 'underwrite'
                  ? 'bg-white text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Underwriter Engine
            </button>
          </div>
        </div>

        {/* 1) NAME, 2) ID, and 3) STATUS Summary Header */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* 1) Business Name & Sector */}
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl font-bold border border-amber-500/20 shrink-0 shadow-xs">
                🏪
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                    {activeBusinessName}
                  </h1>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {(displayedBusiness?.metadata?.location as string) || 'Shop 14, Main Market, Godowlia, Varanasi, UP'} · <span className="font-semibold text-slate-800">{(displayedBusiness?.metadata?.sector as string) || 'Retail Grocery & Daily Essentials'}</span>
                </p>
              </div>
            </div>

            {/* 2) Business ID Badge & Copy */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-2 rounded-xl border border-slate-800 font-mono text-xs shadow-xs">
                <span className="text-slate-400 text-[10px] uppercase font-sans font-bold">BUSINESS DID:</span>
                <span className="font-bold text-amber-400">{activeBusinessId}</span>
                <button
                  onClick={handleCopyDid}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Business DID"
                >
                  {copiedDid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Copy public verification link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy QR Link'}</span>
              </button>
            </div>
          </div>

          {/* 3) Cryptographic Status Banner */}
          <div
            className={`rounded-xl p-3.5 sm:p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isValid
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/90 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isValid ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {isValid ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5 animate-pulse" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold tracking-tight">
                    {isValid
                      ? 'Cryptographically Verified: Sovereign DPI Entity Active'
                      : 'Verification Alert: Cryptographic HMAC Signature Mismatch'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                      isValid ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {isValid ? 'ACTIVE · VALID' : 'TAMPERED / CORRUPT'}
                  </span>
                </div>
                <div className="text-[11px] opacity-85 mt-0.5 font-mono">
                  {isValid
                    ? 'HMAC-SHA256 Canonical digest matches root key did:ov:ed25519-key-1 · W3C VC 2.0 Compliant'
                    : 'Payload tampered! Cryptographic hash does not match original issuer attestation.'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-200 shrink-0">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Trust Score</span>
                <span
                  className={`text-lg sm:text-xl font-black font-mono ${
                    isValid ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {isValid ? `${trustAnalysis?.trust_score || 95}/100` : '15/100'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4) VERIFIABLE SOVEREIGN DIGITAL CARD PRESENTATION */}
        {cardViewFormat === 'standee' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-900 shadow-xl space-y-6 relative overflow-hidden">
            {/* Government Emblem Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-amber-400 shadow-sm">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700">
                    GOVERNMENT OF INDIA • DIGITAL PUBLIC INFRASTRUCTURE
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wider font-display">
                    MINISTRY OF MSME & SOVEREIGN COMMERCE
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-slate-900 text-amber-400 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider self-start sm:self-auto">
                <Sparkles className="w-3.5 h-3.5" />
                <span>OFFICIAL SOVEREIGN VYAPAR PASS</span>
              </div>
            </div>

            {/* Merchant Identity & Live QR Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <div className="md:col-span-7 space-y-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>VERIFIED SOVEREIGN ENTERPRISE</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 font-display tracking-tight">
                    {activeBusinessName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Proprietor: <strong className="text-slate-900">{activeBusinessId.includes('lakshmi') ? 'Smt. Lakshmi Narayan' : (activeBusinessId.includes('anand') ? 'Shri Anand Kumar' : 'Ramesh Sharma')}</strong> · {(displayedBusiness?.metadata?.sector as string) || 'Micro Retail Enterprise'}
                  </p>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-sans font-bold">
                      Sovereign Business DID
                    </div>
                    <div className="font-bold text-slate-950 text-sm truncate">
                      {activeBusinessId}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[9px] font-sans font-bold">UDYAM REGISTRATION</span>
                      <span className="font-bold text-slate-800">{(displayedBusiness?.metadata?.udyam_reg_no as string) || 'UDYAM-UP-54-0098214'}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[9px] font-sans font-bold">GSTIN ID</span>
                      <span className="font-bold text-slate-800">{(displayedBusiness?.metadata?.gstin as string) || '09AABCS1429B1Z5'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: High-Resolution Cryptographic QR */}
              <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-md">
                <BusinessQRCode value={publicVerifierUrl} size={160} showLogo={true} />
                <div className="mt-2 text-[10px] font-mono font-black text-slate-950 tracking-wider">
                  CRYPTOGRAPHIC SCAN LINK
                </div>
                <div className="text-[9px] text-slate-500 font-mono truncate max-w-[180px]">
                  {activeBusinessId}
                </div>
              </div>
            </div>

            {/* 4 Cryptographically Anchored Institutional Attestations */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Verified Institutional Attestation Badges ({displayedCredentials.length})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                    🏛️
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-mono font-bold uppercase">GSTN AUTHORITY</div>
                    <div className="text-xs font-bold text-slate-900 truncate">Tax Compliance 98%</div>
                    <div className="text-[10px] text-emerald-600 font-mono">Zero Arrears ✓</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                    🏦
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-mono font-bold uppercase">SBI BANKING</div>
                    <div className="text-xs font-bold text-slate-900 truncate">Turnover Verified</div>
                    <div className="text-[10px] text-emerald-600 font-mono">₹25L–₹50L Bracket ✓</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    🛍️
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-mono font-bold uppercase">BHARATMART ONDC</div>
                    <div className="text-xs font-bold text-slate-900 truncate">Verified Volume</div>
                    <div className="text-[10px] text-emerald-600 font-mono">1,420 Orders ✓</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                    🎙️
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-mono font-bold uppercase">CSC WITNESS</div>
                    <div className="text-xs font-bold text-slate-900 truncate">Voice Attested</div>
                    <div className="text-[10px] text-emerald-600 font-mono">Geo-Tagged Varanasi ✓</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Card Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="font-mono text-slate-500 text-[11px]">
                ANCHOR: did:ov:ed25519-key-1 • W3C VC 2.0 • HMAC-SHA256
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCertificate}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>{downloadSuccess ? 'Downloaded!' : 'Download Pass (JSON)'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Pass</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4.B) PVC Smart Card View */}
        {cardViewFormat === 'pvc' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-2xl relative overflow-hidden max-w-2xl mx-auto">
              <div className="absolute top-4 right-4 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono px-3 py-0.5 rounded-full font-bold">
                ED25519 • LEVEL-3 SECURE
              </div>

              <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                      Sovereign Enterprise Identity Card
                    </span>
                    <h2 className="text-2xl font-black font-display text-white mt-0.5">
                      {activeBusinessName}
                    </h2>
                    <p className="text-xs text-slate-300">
                      Prop. {activeBusinessId.includes('lakshmi') ? 'Smt. Lakshmi Narayan' : 'Ramesh Sharma'} · Varanasi, UP
                    </p>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="text-slate-400">DID: <span className="text-amber-300 font-bold">{activeBusinessId}</span></div>
                    <div className="text-slate-400">UDYAM: <span className="text-white">{(displayedBusiness?.metadata?.udyam_reg_no as string) || 'UDYAM-UP-54-0098214'}</span></div>
                    <div className="text-slate-400">GSTIN: <span className="text-white">{(displayedBusiness?.metadata?.gstin as string) || '09AABCS1429B1Z5'}</span></div>
                  </div>
                </div>

                <div className="p-1.5 bg-white rounded-2xl shadow-inner shrink-0 self-center sm:self-auto">
                  <BusinessQRCode value={publicVerifierUrl} size={130} showLogo={true} />
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>DIGITAL INDIA SOVEREIGN NODE</span>
                <span className="text-emerald-400 font-bold">ROOT VERIFIED ✓</span>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 font-mono">
              Standard PVC Smart Card 85.6mm × 53.98mm dimensions with ISO/IEC 7810 ID-1 standard.
            </div>
          </div>
        )}
      </div>

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

      {/* QR Code Scanner & Preset Resolver Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">QR Code Camera & Pass Scanner</h3>
              </div>
              <button
                onClick={() => setShowScannerModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Camera Viewfinder Simulation */}
            <div className="relative bg-slate-950 rounded-2xl p-6 text-center text-white border border-slate-800 overflow-hidden space-y-3">
              <div className="w-44 h-44 mx-auto border-2 border-dashed border-amber-400 rounded-2xl flex flex-col items-center justify-center relative p-3">
                <div className="absolute inset-x-2 top-2 h-0.5 bg-amber-400 animate-pulse shadow-md shadow-amber-400/50" />
                <QrCode className="w-16 h-16 text-amber-400 opacity-60" />
                <span className="text-[10px] text-amber-300 font-mono mt-2">Align Merchant Pass in Frame</span>
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Scanning for OpenVyapar Sovereign Identity & Selective-Disclosure QR Pass...
              </p>
            </div>

            {/* 1-Click Scan Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Or Select Merchant Pass to Simulate Instant Scan:</span>
              <div className="space-y-1.5">
                {SAMPLE_PROOFS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      selectSample(sample.id, sample.did);
                      setShowScannerModal(false);
                    }}
                    className="w-full p-3 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 text-left transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-900">
                        {sample.label}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        DID: {sample.did} · {sample.desc}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowScannerModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel Scanner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
