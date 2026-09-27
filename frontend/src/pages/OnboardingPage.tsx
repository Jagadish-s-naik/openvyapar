import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  Sparkles,
  ShieldCheck,
  Building2,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Award,
} from 'lucide-react';
import { extractOnboarding, createBusiness } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';

const SAMPLE_TRANSCRIPTS = {
  'hi-kirana': {
    label: 'शर्मा जनरल स्टोर (Hindi Kirana)',
    text: 'नमस्ते, मेरा नाम रमेश शर्मा है। गोदौलिया वाराणसी में "शर्मा जनरल स्टोर" नाम से 2018 से किराना की दुकान है। महीने का टर्नओवर लगभग 2 लाख रुपये है। फ़ोन नंबर 9876543210 है।',
  },
  'hi-vegetable': {
    label: 'सुनीता ताज़ा सब्ज़ी (Hindi Vendor)',
    text: 'प्रणाम बाबूजी, मेरा नाम सुनीता देवी है। अस्सी घाट पर 10 साल से "सुनीता ताज़ा सब्ज़ी" का ठेला लगाती हूँ। महीने की आमदनी लगभग 45,000 रुपये है। आधार नहीं है, लेकिन साथ वाले दुकानदार गवाह हैं। फ़ोन 9811122233 है।',
  },
  'kn-tea': {
    label: 'ಶ್ರೀ ಮಂಜುನಾಥ ಟೀ ಸ್ಟಾಲ್ (Kannada Tea)',
    text: 'ನಮಸ್ಕಾರ, ನನ್ನ ಹೆಸರು ಮಂಜುನಾಥ್. ಬೆಂಗಳೂರಿನ ಜಯನಗರದಲ್ಲಿ "ಶ್ರೀ ಮಂಜುನಾಥ ಟೀ ಸ್ಟಾಲ್" ಅನ್ನು 2019 ರಿಂದ ನಡೆಸುತ್ತಿದ್ದೇನೆ. ಮಾಸಿಕ ಆದಾಯ 80,000 ರೂ. ಫೋನ್ 9844455566.',
  },
  'en-handloom': {
    label: 'Anand Silk Weaving (English Handloom)',
    text: 'Hello, I am Anand Ansari. I run "Anand Silk Weaving" at Chowk Varanasi since 2015 with monthly sales around 3 Lakhs. Phone number is 9899988877.',
  },
};

import type { OnboardExtractResponse, Business, Credential } from '@openvyapar/shared';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { setBusinessId, loadAllData } = useAppStore();
  const { t } = useTranslation();

  const [activeSampleKey, setActiveSampleKey] = useState<keyof typeof SAMPLE_TRANSCRIPTS>('hi-kirana');
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPTS['hi-kirana'].text);
  const [isExtracting, setIsExtracting] = useState(false);
  const [proposal, setProposal] = useState<OnboardExtractResponse | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ business: Business; starter_credential?: Credential } | null>(null);

  const handleSelectSample = (key: keyof typeof SAMPLE_TRANSCRIPTS) => {
    setActiveSampleKey(key);
    setTranscript(SAMPLE_TRANSCRIPTS[key].text);
    setProposal(null);
    setCreatedResult(null);
  };

  const handleExtract = async () => {
    if (!transcript.trim()) return;
    setIsExtracting(true);
    setCreatedResult(null);
    try {
      const res = await extractOnboarding({
        raw_transcript_or_text: transcript.trim(),
        csc_agent_id: 'did:person:csc001',
      });
      if (res.success) {
        setProposal(res);
      }
    } catch (err) {
      console.error('Extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmRegistration = async () => {
    if (!proposal) return;
    setIsRegistering(true);
    try {
      const b = proposal.proposed_business;
      const res = await createBusiness({
        name: b.name,
        primary_language: b.primary_language || 'hi',
        owner_person_id: 'did:person:ramesh001',
        agent_action_id: proposal.agent_action_id,
        confirmed_by_human: true,
        starter_credential: {
          type: 'self_attested',
          claim: {
            ...proposal.proposed_starter_credential.claim,
            witness_notes: 'Community-witnessed by CSC Agent did:person:csc001 (Field Verified)',
          },
        },
      });

      if (res.success) {
        setCreatedResult(res);
        // Switch store to this new business
        setBusinessId(res.business.business_id);
        await loadAllData();
      }
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {t.onboarding.agentBadge}
              </span>
              <span className="text-xs font-mono text-slate-400">Zero-Footprint Protocol (Beat 1)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.onboarding.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              {t.onboarding.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700">
              <User className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">Agent: Rajesh Kumar (CSC-UP-0842)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Transcript -> Right Column Proposal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Conversational Input (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900">{t.onboarding.speechToTextHeader}</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">{t.onboarding.speechToTextInput}</span>
            </div>

            {/* Sample Chips */}
            <div>
              <span className="text-xs font-semibold text-slate-600 block mb-2">{t.onboarding.selectSample}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(SAMPLE_TRANSCRIPTS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => handleSelectSample(key as keyof typeof SAMPLE_TRANSCRIPTS)}
                    className={`p-2.5 rounded-xl text-left text-xs transition-all border cursor-pointer ${
                      activeSampleKey === key
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Transcript Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">{t.onboarding.rawTranscript}</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={5}
                placeholder={t.onboarding.transcriptPlaceholder}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Extraction Action Button */}
            <button
              onClick={handleExtract}
              disabled={isExtracting || !transcript.trim()}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>{t.onboarding.extracting}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{t.onboarding.extractButton}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Extraction Preview & Human Confirmation (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {createdResult ? (
            /* Success Screen */
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 text-emerald-950 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-900">{t.onboarding.successTitle}</h3>
                  <p className="text-xs text-emerald-700">
                    {t.onboarding.successSubtitle}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t.onboarding.businessNameLabel}</span>
                  <span className="font-bold text-slate-900">{createdResult.business.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t.onboarding.issuedDidLabel}</span>
                  <span className="font-mono font-bold text-amber-700">{createdResult.business.business_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t.onboarding.starterCredLabel}</span>
                  <span className="text-emerald-700 font-semibold">{t.onboarding.selfAttestedWitness}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>{t.onboarding.openWallet}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : proposal ? (
            /* Proposal Preview Card */
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">{t.onboarding.claimsPreview}</h2>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  {t.onboarding.pendingHuman}
                </span>
              </div>

              {/* Business Entity Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">{proposal.proposed_business.name}</h3>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800">
                    {proposal.proposed_business.sector || 'Retail'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{proposal.proposed_business.location || 'Varanasi, UP'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{proposal.proposed_business.contact_phone || '9876543210'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Proprietor: {proposal.proposed_business.owner_name || 'Ramesh Sharma'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Est. Revenue: {proposal.proposed_starter_credential?.claim?.approx_monthly_revenue || '₹25L - ₹50L'}</span>
                  </div>
                </div>
              </div>

              {/* Starter Credential Proposal */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold text-amber-950">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{t.onboarding.starterCredTitle}</span>
                  </span>
                  <span className="text-[11px] font-mono text-amber-700 break-all">did:person:csc001</span>
                </div>
                <div className="text-xs text-amber-900 space-y-1 font-mono bg-white p-2.5 rounded-lg border border-amber-200/60">
                  <div>• Nature: {proposal.proposed_starter_credential.claim.business_nature}</div>
                  <div>• Established: {proposal.proposed_starter_credential.claim.established_year}</div>
                  <div>• Monthly Sales: {proposal.proposed_starter_credential.claim.approx_monthly_revenue}</div>
                  <div>• Witness: CSC Field Geotag Verified</div>
                </div>
              </div>

              {/* Confirmation Action */}
              <div className="pt-2">
                <button
                  onClick={handleConfirmRegistration}
                  disabled={isRegistering}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isRegistering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t.onboarding.creatingBusiness}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.onboarding.confirmButton}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Empty Placeholder */
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{t.onboarding.noClaimsYetTitle}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {t.onboarding.noClaimsYetDesc}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
