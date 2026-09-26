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

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { setBusinessId, loadAllData } = useAppStore();

  const [activeSampleKey, setActiveSampleKey] = useState<keyof typeof SAMPLE_TRANSCRIPTS>('hi-kirana');
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPTS['hi-kirana'].text);
  const [isExtracting, setIsExtracting] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);

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
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                CSC VLE Assisted Flow
              </span>
              <span className="text-xs font-mono text-slate-400">Zero-Footprint Protocol (Beat 1)</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Zero-Footprint Business Onboarding
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Onboard informal micro-enterprises with zero prior formal digital footprint using natural speech transcripts and community-witnessed starter credentials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Agent: Rajesh Kumar (CSC-UP-0842)</span>
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
                <h2 className="text-sm font-bold text-slate-900">Conversational Voice & Audio Transcript</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">Speech-to-Text Input</span>
            </div>

            {/* Sample Chips */}
            <div>
              <span className="text-xs font-semibold text-slate-600 block mb-2">Select a Sample Transcript:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(SAMPLE_TRANSCRIPTS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => handleSelectSample(key as any)}
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
              <label className="text-xs font-semibold text-slate-700">Raw Spoken Dialogue / Voice Transcript:</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={5}
                placeholder="Type or paste unstructured dialogue spoken in Hindi, Kannada, or English..."
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
                  <span>Extracting Structured Metadata with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Extract Structured Business Claims (AI Agent)</span>
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
                  <h3 className="text-base font-bold text-emerald-900">Sovereign Business Registered!</h3>
                  <p className="text-xs text-emerald-700">
                    Sovereign DID issued and starter credential cryptographically signed by CSC Agent.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Business Name:</span>
                  <span className="font-bold text-slate-900">{createdResult.business.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Issued Sovereign DID:</span>
                  <span className="font-mono font-bold text-amber-700">{createdResult.business.business_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Starter Credential:</span>
                  <span className="text-emerald-700 font-semibold">Self-Attested (CSC Witnessed)</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>Open in Business Owner Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : proposal ? (
            /* Proposal Preview Card */
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">Structured Claims Preview</h2>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Guardrail 1: Pending Human Confirmation
                </span>
              </div>

              {/* Business Entity Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">{proposal.proposed_business.name}</h3>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800">
                    {proposal.proposed_business.sector || 'Retail'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{proposal.proposed_business.location || 'Varanasi, UP'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{proposal.proposed_business.contact_phone || '9876543210'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Proprietor: {proposal.proposed_business.owner_name || 'Ramesh Sharma'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>Est. Revenue: {proposal.estimated_revenue_bracket || '₹25L - ₹50L'}</span>
                  </div>
                </div>
              </div>

              {/* Starter Credential Proposal */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Proposed Starter Credential (Self-Attested)</span>
                  </span>
                  <span className="text-[11px] font-mono text-amber-700">did:person:csc001</span>
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
                      <span>Creating Sovereign Business DID...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Register Business (Human Sign-off)</span>
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
                <h3 className="text-sm font-bold text-slate-800">No Claims Extracted Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Select a sample transcript on the left or type spoken shop details, then click "Extract Structured Business Claims" to see AI extraction.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
