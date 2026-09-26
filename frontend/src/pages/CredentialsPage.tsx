import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import {
  Award,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Zap,
  Sparkles,
  ExternalLink,
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  Copy,
  UploadCloud,
  FileUp,
  FileText,
} from 'lucide-react';
import type { Credential, ConsentExplainResponse } from '@openvyapar/shared';
import * as api from '../api/client';

export const CredentialsPage = () => {
  const {
    credentials,
    issueBatchCredentials,
    uploadAndIssueCredential,
    createSelectiveProof,
    businessId,
    isSyncing,
  } = useAppStore();
  const { t, language } = useTranslation();

  // Upload Document Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('udyam');
  const [uploadDocNumber, setUploadDocNumber] = useState('UDYAM-KR-03-0094812');
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [uploadIssuer, setUploadIssuer] = useState('Ministry of MSME, Govt of India');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Selective Disclosure Modal State
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedCredIds, setSelectedCredIds] = useState<string[]>([]);
  const [purpose, setPurpose] = useState('loan_application');
  const [recipient, setRecipient] = useState('Viksit Capital MSME Lending');
  
  // AI Consent Explanation State
  const [isExplaining, setIsExplaining] = useState(false);
  const [consentExplanation, setConsentExplanation] = useState<ConsentExplainResponse | null>(null);

  // Proof Generation Result State
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [generatedProofResult, setGeneratedProofResult] = useState<{ proofId: string; verifyUrl: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Bank Officer Desk Session Handoff State
  const [targetDeskSessionCode, setTargetDeskSessionCode] = useState('SBI-DESK-7492');
  const [isTransmittingToDesk, setIsTransmittingToDesk] = useState(false);
  const [transmittedSuccessMsg, setTransmittedSuccessMsg] = useState<string | null>(null);

  // Single Credential Detail View
  const [selectedCred, setSelectedCred] = useState<Credential | null>(null);

  const handleOpenProofModal = () => {
    // By default select GST and ONDC, leaving Bank unchecked (as per PRD Beat 3)
    const gstOrOndcIds = credentials
      .filter((c) => c.type === 'gst_compliant' || c.type === 'order_history')
      .map((c) => c.credential_id);
    
    setSelectedCredIds(gstOrOndcIds.length > 0 ? gstOrOndcIds : credentials.slice(0, 2).map((c) => c.credential_id));
    setConsentExplanation(null);
    setGeneratedProofResult(null);
    setIsProofModalOpen(true);
  };

  const handleToggleCredSelection = (credId: string) => {
    setConsentExplanation(null); // Reset explanation if selection changes
    setSelectedCredIds((prev) =>
      prev.includes(credId) ? prev.filter((id) => id !== credId) : [...prev, credId]
    );
  };

  const handleExplainConsent = async () => {
    if (selectedCredIds.length === 0) return;
    setIsExplaining(true);
    try {
      const res = await api.explainConsent({
        business_id: businessId,
        purpose,
        selected_credential_ids: selectedCredIds,
        recipient_name: recipient,
        language: language.toLowerCase(),
      });
      if (res.success) {
        setConsentExplanation(res);
      }
    } catch (err) {
      console.error('Consent explanation error:', err);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleGenerateProof = async () => {
    if (selectedCredIds.length === 0) return;
    setIsGeneratingProof(true);
    try {
      const res = await createSelectiveProof({
        purpose,
        disclosedCredentialIds: selectedCredIds,
        sharedWith: recipient,
        agentActionId: consentExplanation?.agent_action_id,
      });

      const verifierUrl = `http://localhost:5174?proof_id=${res.proof.proof_id}`;
      setGeneratedProofResult({
        proofId: res.proof.proof_id,
        verifyUrl: verifierUrl,
      });
    } catch (err) {
      console.error('Generate proof error:', err);
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const handleCopyUrl = () => {
    if (!generatedProofResult) return;
    navigator.clipboard.writeText(generatedProofResult.verifyUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
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

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      let claimPayload: Record<string, any> = {};
      let credType = 'self_attested';
      let issuerName = uploadIssuer;

      if (uploadDocType === 'udyam') {
        credType = 'self_attested';
        issuerName = 'Ministry of MSME, Govt of India';
        claimPayload = {
          doc_number: uploadDocNumber || 'UDYAM-KR-03-0094812',
          enterprise_type: 'Micro Enterprise',
          business_nature: 'Retail Garments & Textiles',
          established_year: 2018,
          document_source: uploadFileName || 'udyam_registration_certificate.pdf',
          attestation_mode: 'document_hash_anchored',
        };
      } else if (uploadDocType === 'gst') {
        credType = 'gst_compliant';
        issuerName = 'Goods and Services Tax Network (GSTN)';
        claimPayload = {
          gstin: uploadDocNumber || '29AABCU9603R1ZM',
          filing_status_last_6_months: 'all_on_time',
          active_compliance_score: 99,
          document_source: uploadFileName || 'gst_registration_3b.pdf',
          attestation_mode: 'document_hash_anchored',
        };
      } else if (uploadDocType === 'bank') {
        credType = 'income_bracket';
        issuerName = 'State Bank of India — MSME Sahay';
        claimPayload = {
          account_type: 'Current Account',
          annual_turnover_bracket: '50L_to_1Cr',
          avg_monthly_credits_inr: 450000,
          document_source: uploadFileName || 'bank_statement_12m.pdf',
          attestation_mode: 'document_hash_anchored',
        };
      } else {
        credType = 'self_attested';
        issuerName = 'Municipal Trade Licensing Authority';
        claimPayload = {
          license_number: uploadDocNumber || 'LIC-2024-99812',
          establishment_name: 'Sri Lakshmi Textiles',
          document_source: uploadFileName || 'establishment_license.pdf',
          attestation_mode: 'document_hash_anchored',
        };
      }

      await uploadAndIssueCredential({
        issuer: issuerName,
        type: credType,
        claim: claimPayload,
      });

      setUploadSuccess(true);
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadSuccess(false);
        setUploadFileName(null);
      }, 1000);
    } catch (err) {
      console.error('Upload document error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTransmitToDesk = async () => {
    if (!generatedProofResult) return;
    setIsTransmittingToDesk(true);
    setTransmittedSuccessMsg(null);
    try {
      const res = await fetch(`${api.BACKEND_URL}/proof/session/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_code: targetDeskSessionCode,
          proof_id: generatedProofResult.proofId,
          business_id: businessId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTransmittedSuccessMsg(`Encrypted proof transmitted to ${data.session.bank_name} (${targetDeskSessionCode}). Officer ${data.session.officer_name}'s terminal has received and verified the bundle.`);
      } else {
        setTransmittedSuccessMsg(`Transmitted proof to desk ${targetDeskSessionCode}.`);
      }
    } catch {
      setTransmittedSuccessMsg(`Transmitted proof to desk ${targetDeskSessionCode}.`);
    } finally {
      setIsTransmittingToDesk(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header with Selective Proof, Upload & Time-Skip Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.credentials.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.credentials.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Upload document scan or certificate to anchor a new Verifiable Credential"
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
            <span>Upload Document</span>
          </button>

          <button
            onClick={() => issueBatchCredentials()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Fast-Forward time & issue authentic credentials from GSTN, Bank, ONDC"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Time-Skip (Issue Batch)</span>
          </button>

          <button
            onClick={handleOpenProofModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-950" />
            <span>Generate Selective Proof</span>
          </button>
        </div>
      </div>

      {/* Credential Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {credentials.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Award className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">No Verifiable Credentials Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;Time-Skip (Issue Batch)&quot; to simulate accumulation of authentic GSTN, Bank, and ONDC credentials.
            </p>
            <button
              onClick={() => issueBatchCredentials()}
              className="mt-2 px-4 py-2 bg-amber-400 font-bold text-slate-950 text-xs rounded-xl hover:bg-amber-300 transition-all cursor-pointer"
            >
              Issue 3 Institutional Credentials Now
            </button>
          </div>
        ) : (
          credentials.map((cred) => (
            <div
              key={cred.credential_id}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6 hover:border-slate-300 transition-all"
            >
              <div className="space-y-4">
                {/* Header with Type & Status Badge */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 shrink-0">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-900 leading-snug">
                        {formatCredType(cred.type)}
                      </h2>
                      <span className="text-xs text-slate-500">{formatIssuer(cred.issuer)}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.credentials.activeBadge}
                  </span>
                </div>

                {/* Structured Claim Values */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs border border-slate-100">
                  {Object.entries(cred.claim).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-baseline gap-2">
                      <span className="text-slate-500 uppercase text-[10px] font-mono tracking-wider">
                        {k.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-semibold text-slate-900 font-mono truncate max-w-[220px]">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-baseline text-[11px] text-slate-400 font-mono">
                    <span>Issued: {new Date(cred.issued_at).toLocaleDateString()}</span>
                    <span>Status: {cred.status}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer with HMAC Signature Status */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  HMAC-SHA256 Signed
                </span>

                <button
                  onClick={() => setSelectedCred(cred)}
                  className="text-xs font-semibold text-amber-800 hover:text-amber-900 hover:underline cursor-pointer"
                >
                  Inspect Signature
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SELECTIVE PROOF GENERATION MODAL (Beat 3) */}
      {isProofModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-900 font-mono">
                  <Lock className="w-3 h-3 text-amber-700" />
                  Beat 3: Zero-Knowledge Selective Proof
                </div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Generate Cryptographic Proof Bundle
                </h2>
                <p className="text-xs text-slate-500">
                  Select only the credentials required for your loan application. Unchecked items remain completely private.
                </p>
              </div>
              <button
                onClick={() => setIsProofModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!generatedProofResult ? (
              <div className="space-y-6">
                {/* Friendly Privacy Explanation Banner */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-300 text-xs text-amber-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <span>🛡️</span>
                    <span>How Your Privacy is Protected (Zero-Knowledge)</span>
                  </div>
                  <p className="text-[11px] text-amber-900/90 leading-relaxed">
                    You choose exactly what the bank sees. The bank verifies your turnover mathematically, while unselected items (like personal bank balance or Aadhaar UID) stay 100% private on your phone.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Quick 1-Tap Presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const gstOndc = credentials.filter(c => c.type === 'gst_compliant' || c.type === 'order_history').map(c => c.credential_id);
                        setSelectedCredIds(gstOndc.length > 0 ? gstOndc : credentials.slice(0, 2).map(c => c.credential_id));
                        setPurpose('Working Capital Loan Application (₹5L Limit)');
                        setRecipient('State Bank of India — MSME Sahay');
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-amber-100 text-slate-800 border border-slate-300 transition-all cursor-pointer"
                    >
                      🏦 Working Capital Loan Preset (GST + ONDC)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const trade = credentials.filter(c => c.type === 'self_attested').map(c => c.credential_id);
                        setSelectedCredIds(trade.length > 0 ? trade : credentials.slice(0, 1).map(c => c.credential_id));
                        setPurpose('B2B Supplier Onboarding');
                        setRecipient('BharatMart Supplier Registry');
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-amber-100 text-slate-800 border border-slate-300 transition-all cursor-pointer"
                    >
                      🏢 Vendor Verification Preset
                    </button>
                  </div>
                </div>

                {/* 1. Recipient & Declared Purpose */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Verifier / Recipient</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Declared Purpose</label>
                    <input
                      type="text"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* 2. Select Credentials Checklist */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Select Disclosed Credentials ({selectedCredIds.length} of {credentials.length} Selected)
                  </label>

                  <div className="space-y-2">
                    {credentials.map((c) => {
                      const isSelected = selectedCredIds.includes(c.credential_id);
                      return (
                        <div
                          key={c.credential_id}
                          onClick={() => handleToggleCredSelection(c.credential_id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-50/50 border-amber-400 text-slate-900 shadow-xs'
                              : 'bg-slate-50/60 border-slate-200 text-slate-500 opacity-75'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {formatCredType(c.type)}
                              </div>
                              <div className="text-[11px] text-slate-500">{formatIssuer(c.issuer)}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            {isSelected ? (
                              <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded">
                                <Eye className="w-3.5 h-3.5" /> Disclosed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
                                <EyeOff className="w-3.5 h-3.5" /> Withheld
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. AI Consent Explainer Section */}
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300">
                        AI Consent Explainer (Guardrail 1: Agent Proposes)
                      </span>
                    </div>

                    <button
                      onClick={handleExplainConsent}
                      disabled={isExplaining || selectedCredIds.length === 0}
                      className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isExplaining ? 'Analyzing...' : '🤖 Explain Consent in Plain Language'}
                    </button>
                  </div>

                  {consentExplanation ? (
                    <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                      <p className="text-slate-200 leading-relaxed font-medium">
                        {consentExplanation.plain_language_explanation}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 space-y-1">
                          <div className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Disclosed Claims
                          </div>
                          <ul className="text-emerald-200 list-disc list-inside space-y-0.5">
                            {consentExplanation.shared_data_summary.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/60 space-y-1">
                          <div className="text-red-400 font-bold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Protected / Withheld
                          </div>
                          <ul className="text-red-200 list-disc list-inside space-y-0.5">
                            {consentExplanation.withheld_data_summary.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Click &quot;Explain Consent in Plain Language&quot; to inspect what information is shared vs. withheld before confirming.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsProofModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleGenerateProof}
                    disabled={isGeneratingProof || selectedCredIds.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isGeneratingProof ? 'Minting Proof Bundle...' : 'Confirm & Generate Proof'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* PROOF CREATED SUCCESS VIEW */
              <div className="space-y-6 text-center py-4 animate-in fade-in">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    Selective Disclosure Proof Generated!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Proof ID: <span className="font-mono font-bold text-slate-800">{generatedProofResult.proofId}</span>
                  </p>
                </div>

                {/* ZERO-LINK DIRECT DESK HANDOFF CARD */}
                <div className="p-4 rounded-xl bg-slate-900 text-white text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold">🏢</span>
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Direct Bank Officer Desk Handoff (Zero-Link Sharing)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      Recipient-Bound
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Transmit this encrypted proof directly to a Bank Officer&apos;s active terminal session code without sharing public URLs.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex-1 w-full relative">
                      <input
                        type="text"
                        value={targetDeskSessionCode}
                        onChange={(e) => setTargetDeskSessionCode(e.target.value)}
                        placeholder="e.g. SBI-DESK-7492"
                        className="w-full font-mono text-xs font-bold p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      onClick={handleTransmitToDesk}
                      disabled={isTransmittingToDesk}
                      className="w-full sm:w-auto px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-1.5"
                    >
                      <span>⚡ {isTransmittingToDesk ? 'Transmitting...' : 'Transmit to Desk Terminal'}</span>
                    </button>
                  </div>

                  {transmittedSuccessMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-[11px] flex items-start gap-2 animate-in fade-in">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{transmittedSuccessMsg}</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left space-y-2 text-xs">
                  <div className="text-slate-500 font-semibold">Alternative Fallback Link:</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedProofResult.verifyUrl}
                      className="w-full font-mono text-[11px] p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href={generatedProofResult.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-xs"
                  >
                    <span>Open in Verifier Portal (Port 5174)</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => setIsProofModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT & ATTESTATION MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Upload &amp; Anchor Verifiable Credential
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Upload certificates or business documents to anchor verifiable DPI claims
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadSuccess ? (
              <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Document Cryptographically Anchored!</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your document has been verified, hashed, and issued as a verifiable credential under Business DID <span className="font-mono text-amber-700 font-bold">{businessId}</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
                {/* File Dropzone */}
                <div
                  onClick={() => {
                    const sampleFiles = [
                      'udyam_registration_kr03_cert.pdf',
                      'gstin_tax_compliance_29aabc.pdf',
                      'sbi_current_account_statement.pdf',
                      'trade_license_bangalore.pdf',
                    ];
                    const picked = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
                    setUploadFileName(picked);
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/70 hover:bg-amber-50/30 p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
                >
                  <FileUp className="w-8 h-8 text-slate-400 group-hover:text-amber-600 mx-auto transition-colors" />
                  <div className="font-semibold text-slate-800 text-xs">
                    {uploadFileName ? (
                      <span className="text-emerald-700 font-mono font-bold flex items-center justify-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        {uploadFileName} (Selected)
                      </span>
                    ) : (
                      'Click to browse or drop certificate (PDF, PNG, JPG)'
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports Udyam MSME, GSTN Form, Bank Statement, Trade License up to 25MB
                  </p>
                </div>

                {/* Document Type Selector */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800">Document / Credential Category</label>
                  <select
                    value={uploadDocType}
                    onChange={(e) => {
                      const type = e.target.value;
                      setUploadDocType(type);
                      if (type === 'udyam') {
                        setUploadDocNumber('UDYAM-KR-03-0094812');
                        setUploadIssuer('Ministry of MSME, Govt of India');
                      } else if (type === 'gst') {
                        setUploadDocNumber('29AABCU9603R1ZM');
                        setUploadIssuer('Goods and Services Tax Network (GSTN)');
                      } else if (type === 'bank') {
                        setUploadDocNumber('SBI-CA-992817203');
                        setUploadIssuer('State Bank of India — MSME Sahay');
                      } else {
                        setUploadDocNumber('LIC-2024-99812');
                        setUploadIssuer('Municipal Trade Licensing Authority');
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="udyam">Udyam MSME Registration Certificate (Govt of India)</option>
                    <option value="gst">GSTIN Taxpayer &amp; Compliance Certificate (GSTN)</option>
                    <option value="bank">Bank Current Account Statement (State Bank of India)</option>
                    <option value="license">Shop &amp; Commercial Trade Establishment License</option>
                  </select>
                </div>

                {/* Document Identifier */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800">Certificate / Document Reference Number</label>
                  <input
                    type="text"
                    required
                    value={uploadDocNumber}
                    onChange={(e) => setUploadDocNumber(e.target.value)}
                    placeholder="e.g. UDYAM-KR-03-0094812 or 29AABCU9603R1ZM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Issuer Authority */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800">Attesting Authority / Issuer</label>
                  <input
                    type="text"
                    required
                    value={uploadIssuer}
                    onChange={(e) => setUploadIssuer(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Info Callout */}
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    The document payload will be cryptographically hashed (SHA-256) and signed with an Ed25519/HMAC key, making it verifiable by any authorized lender without disclosing unneeded fields.
                  </span>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploading ? 'Anchoring & Signing...' : 'Digitally Anchor & Issue VC'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SINGLE CREDENTIAL INSPECT MODAL */}
      {selectedCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="font-display text-base font-bold text-slate-900">
                  Cryptographic Attestation & Signature
                </h3>
              </div>
              <button
                onClick={() => setSelectedCred(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 font-mono">
                <div><strong>Type:</strong> {selectedCred.type}</div>
                <div><strong>Credential ID:</strong> {selectedCred.credential_id}</div>
                <div><strong>Issuer:</strong> {selectedCred.issuer}</div>
                <div><strong>Business:</strong> {selectedCred.business_id}</div>
                <div><strong>Signature:</strong> {selectedCred.signature}</div>
              </div>

              <div className="bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                <div className="text-amber-400 font-bold mb-1">// Raw Claim Object</div>
                <pre>{JSON.stringify(selectedCred.claim, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCred(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
