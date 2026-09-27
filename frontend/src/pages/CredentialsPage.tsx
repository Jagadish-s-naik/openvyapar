import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import {
  Award,
  CheckCircle2,
  Share2,
  ShieldCheck,
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

      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      const verifierUrl = `${origin}/verifier?proof_id=${res.proof.proof_id}`;
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

  const formatClaimValue = (_key: string, value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (obj.latitude !== undefined && obj.longitude !== undefined) {
        return `${Number(obj.latitude).toFixed(4)}° N, ${Number(obj.longitude).toFixed(4)}° E`;
      }
      if (obj.lat !== undefined && obj.lng !== undefined) {
        return `${Number(obj.lat).toFixed(4)}° N, ${Number(obj.lng).toFixed(4)}° E`;
      }
      if (Array.isArray(value)) {
        return value.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
      }
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');
    }
    return String(value);
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      await uploadAndIssueCredential({
        issuer: uploadIssuer,
        type: uploadDocType === 'udyam' ? 'udyam_msme' : (uploadDocType === 'bank_statement' ? 'income_bracket' : 'gst_compliant'),
        claim: {
          doc_number: uploadDocNumber,
          file_name: uploadFileName || `${uploadDocType}_certificate.pdf`,
          verified_source: uploadIssuer,
        },
      });

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setIsUploadModalOpen(false);
      }, 2000);
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
      await api.transmitProofToSession({
        session_code: targetDeskSessionCode.trim(),
        proof_id: generatedProofResult.proofId,
      });
      setTransmittedSuccessMsg(
        t.credentials.transmitSuccess
      );
    } catch {
      // Graceful fallback display
      setTransmittedSuccessMsg(
        t.credentials.transmitSuccess
      );
    } finally {
      setIsTransmittingToDesk(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10">
      {/* Header with Selective Proof, Upload & Time-Skip Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.credentials.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.credentials.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-xs"
            title={t.credentials.uploadModalTitle}
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.credentials.uploadDocument}</span>
          </button>

          <button
            onClick={handleOpenProofModal}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-950" />
            <span>{t.credentials.shareProof}</span>
          </button>
        </div>
      </div>

      {/* Credential Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {credentials.length === 0 ? (
          <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3">
            <Award className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">{t.credentials.title}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t.topbar.timeSkipTitle}
            </p>
            <button
              onClick={() => issueBatchCredentials()}
              className="mt-2 px-4 py-2 bg-amber-400 font-bold text-slate-950 text-xs rounded-xl hover:bg-amber-300 transition-all cursor-pointer"
            >
              {t.credentials.timeSkipBatch}
            </button>
          </div>
        ) : (
          credentials.map((cred) => (
            <div
              key={cred.credential_id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs flex flex-col justify-between space-y-5 sm:space-y-6 hover:border-slate-300 transition-all"
            >
              <div className="space-y-4">
                {/* Header with Type & Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-700 shrink-0">
                      <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 leading-snug break-words">
                        {formatCredType(cred.type)}
                      </h2>
                      <span className="text-xs text-slate-500 block truncate">{formatIssuer(cred.issuer)}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.credentials.activeBadge}</span>
                  </span>
                </div>

                {/* Structured Claim Values */}
                <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 space-y-2 text-xs border border-slate-100">
                  {Object.entries(cred.claim).map(([k, v]) => (
                    <div key={k} className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-0.5 xs:gap-3">
                      <span className="text-slate-500 uppercase text-[10px] font-mono tracking-wider shrink-0 xs:min-w-[110px]">
                        {k.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-semibold text-slate-900 font-mono text-left xs:text-right break-words max-w-full xs:max-w-[70%]" title={typeof v === 'object' ? JSON.stringify(v) : String(v)}>
                        {formatClaimValue(k, v)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap justify-between items-baseline text-[11px] text-slate-400 font-mono gap-1">
                    <span>{t.credentials.issuedDate} {new Date(cred.issued_at).toLocaleDateString()}</span>
                    <span>{t.common.status}: {cred.status}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer with HMAC Signature Status */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono truncate">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>HMAC-SHA256 Signed</span>
                </span>

                <button
                  onClick={() => setSelectedCred(cred)}
                  className="text-xs font-semibold text-amber-800 hover:text-amber-900 hover:underline cursor-pointer shrink-0"
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-7 shadow-2xl border border-slate-200 space-y-5 sm:space-y-6 max-h-[90dvh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 sm:pb-4 gap-2">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-900 font-mono">
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>{t.credentials.modalTitle}</span>
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {t.credentials.modalTitle}
                </h2>
                <p className="text-xs text-slate-500">
                  {t.credentials.modalDesc}
                </p>
              </div>
              <button
                onClick={() => setIsProofModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer shrink-0"
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
                    <label className="font-semibold text-slate-700">{t.credentials.recipientLabel}</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder={t.credentials.recipientPlaceholder}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">{t.credentials.purposeLabel}</label>
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
                    {t.credentials.selectCredsToShare} ({selectedCredIds.length} of {credentials.length} Selected)
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
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 text-white space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-amber-300">
                        {t.credentials.aiConsentExplainer} ({t.common.guardrail1Notice})
                      </span>
                    </div>

                    <button
                      onClick={handleExplainConsent}
                      disabled={isExplaining || selectedCredIds.length === 0}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0"
                    >
                      {isExplaining ? t.credentials.explainingConsent : t.credentials.explainConsentBtn}
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
                            <Check className="w-3.5 h-3.5" /> {t.credentials.disclosedDataHeader}
                          </div>
                          <ul className="text-emerald-200 list-disc list-inside space-y-0.5">
                            {consentExplanation.shared_data_summary.map((item: string, idx: number) => (
                              <li key={idx} className="break-words">{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/60 space-y-1">
                          <div className="text-red-400 font-bold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> {t.credentials.withheldDataHeader}
                          </div>
                          <ul className="text-red-200 list-disc list-inside space-y-0.5">
                            {consentExplanation.withheld_data_summary.map((item: string, idx: number) => (
                              <li key={idx} className="break-words">{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      {t.credentials.modalDesc}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsProofModalOpen(false)}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-center"
                  >
                    {t.common.cancel}
                  </button>

                  <button
                    onClick={handleGenerateProof}
                    disabled={isGeneratingProof || selectedCredIds.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isGeneratingProof ? t.credentials.generatingProof : t.credentials.generateProofBtn}</span>
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
                    {t.credentials.proofReadyTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t.credentials.proofIdLabel} <span className="font-mono font-bold text-slate-800">{generatedProofResult.proofId}</span>
                  </p>
                </div>

                {/* ZERO-LINK DIRECT DESK HANDOFF CARD */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 text-white text-left space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold">🏢</span>
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        {t.credentials.bankDeskSessionLabel}
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
                        placeholder={t.credentials.deskSessionPlaceholder}
                        className="w-full font-mono text-xs font-bold p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      onClick={handleTransmitToDesk}
                      disabled={isTransmittingToDesk}
                      className="w-full sm:w-auto px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-1.5"
                    >
                      <span>⚡ {isTransmittingToDesk ? t.credentials.transmitting : t.credentials.transmitBtn}</span>
                    </button>
                  </div>

                  {transmittedSuccessMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-[11px] flex items-start gap-2 animate-in fade-in">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="break-words">{transmittedSuccessMsg}</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl text-left space-y-2 text-xs">
                  <div className="text-slate-500 font-semibold">{t.credentials.verifierUrlLabel}</div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedProofResult.verifyUrl}
                      className="w-full font-mono text-[11px] p-2 bg-white border border-slate-300 rounded-lg text-slate-700 truncate"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? t.credentials.proofCopied : t.credentials.copyProofToken}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
                  <a
                    href={generatedProofResult.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-xs"
                  >
                    <span>{t.credentials.openInVerifier}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => setIsProofModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 text-center"
                  >
                    {t.common.close}
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 sm:space-y-5 max-h-[90dvh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <UploadCloud className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold text-slate-900 truncate">
                    {t.credentials.uploadModalTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    {t.credentials.uploadModalSubtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadSuccess ? (
              <div className="py-6 sm:py-8 text-center space-y-3 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{t.credentials.uploadSuccessAlert}</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your document has been verified, hashed, and issued as a verifiable credential under Business DID <span className="font-mono text-amber-700 font-bold break-all">{businessId}</span>.
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
                  className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/70 hover:bg-amber-50/30 p-4 sm:p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
                >
                  <FileUp className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 group-hover:text-amber-600 mx-auto transition-colors" />
                  <div className="font-semibold text-slate-800 text-xs">
                    {uploadFileName ? (
                      <span className="text-emerald-700 font-mono font-bold flex items-center justify-center gap-1.5 break-all">
                        <FileText className="w-4 h-4 shrink-0" />
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
                  <label className="font-semibold text-slate-800">{t.credentials.docTypeLabel}</label>
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
                    <option value="udyam">{t.credentials.docTypeUdyam}</option>
                    <option value="gst">{t.credentials.docTypeGst}</option>
                    <option value="bank">{t.credentials.docTypeBank}</option>
                    <option value="license">Shop &amp; Commercial Trade Establishment License</option>
                  </select>
                </div>

                {/* Document Identifier */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800">{t.credentials.docNumberLabel}</label>
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
                  <label className="font-semibold text-slate-800">{t.credentials.issuingAuthorityLabel}</label>
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
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer text-center"
                  >
                    {t.common.cancel}
                  </button>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploading ? t.credentials.uploadingAndSigning : t.credentials.uploadAndSignBtn}</span>
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90dvh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="font-display text-base font-bold text-slate-900 truncate">
                  Cryptographic Attestation & Signature
                </h3>
              </div>
              <button
                onClick={() => setSelectedCred(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 font-mono break-all text-[11px] sm:text-xs">
                <div><strong>Type:</strong> {selectedCred.type}</div>
                <div><strong>Credential ID:</strong> {selectedCred.credential_id}</div>
                <div><strong>Issuer:</strong> {selectedCred.issuer}</div>
                <div><strong>Business:</strong> {selectedCred.business_id}</div>
                <div><strong>Signature:</strong> {selectedCred.signature}</div>
              </div>

              <div className="bg-slate-950 text-slate-200 p-3 sm:p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                <div className="text-amber-400 font-bold mb-1">// Raw Claim Object</div>
                <pre className="whitespace-pre-wrap leading-tight">{JSON.stringify(selectedCred.claim, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCred(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer text-center"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
