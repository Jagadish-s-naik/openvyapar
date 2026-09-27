import { useState } from 'react';
import {
  Shield,
  Printer,
  Download,
  X,
  CheckCircle2,
  Sparkles,
  Award,
  Lock,
  Building2,
  Copy,
  Check,
} from 'lucide-react';
import { BusinessQRCode } from '../ui/BusinessQRCode';
import { useAppStore } from '../../store/useAppStore';

interface SovereignPassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SovereignPassModal = ({ isOpen, onClose }: SovereignPassModalProps) => {
  const { businessId, businessName, ownerPersonId, credentials } = useAppStore();
  const [passFormat, setPassFormat] = useState<'standee' | 'pvc'>('standee');
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const verifierUrl = `${origin}/verifier?proof_id=proof-loan-001&did=${encodeURIComponent(businessId)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifierUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      title: "OpenVyapar Sovereign Enterprise Pass",
      businessName,
      businessId,
      ownerPersonId,
      issuer: "did:ov:gov:msme-dpi",
      keyType: "Ed25519VerificationKey2020",
      verificationUrl: verifierUrl,
      credentialsCount: credentials.length,
      issuedAt: new Date().toISOString(),
      cryptographicSignature: "0x7f9a2c...ed25519...openvyapar...verified"
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `OpenVyapar_Sovereign_Pass_${businessId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      {/* Print specific CSS injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #sovereign-printable-pass, #sovereign-printable-pass * {
            visibility: visible;
          }
          #sovereign-printable-pass {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 24px;
            background: white !important;
            color: black !important;
            z-index: 999999;
            box-shadow: none !important;
            border: 2px solid #0a1424 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400/20 text-amber-400 rounded-xl border border-amber-400/30">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                  OpenVyapar Sovereign Enterprise Pass
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                  OFFICIAL DPI ARTIFACT
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Printable laminated counter standee & PVC identity card for offline cryptographic verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close pass modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Toolbar & Format Switcher */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 no-print">
          {/* Format Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl self-stretch sm:self-auto overflow-x-auto">
            <button
              onClick={() => setPassFormat('standee')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                passFormat === 'standee'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Standee (A4)</span>
            </button>
            <button
              onClick={() => setPassFormat('pvc')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                passFormat === 'pvc'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>PVC Smart Card</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? 'Copied' : 'Copy URL'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{downloadSuccess ? 'Downloaded!' : 'JSON'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Standee</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 flex items-center justify-center">
          {/* PRINTABLE PASS CONTAINER */}
          <div
            id="sovereign-printable-pass"
            className={`w-full bg-white transition-all ${
              passFormat === 'standee'
                ? 'max-w-2xl rounded-3xl border-2 border-slate-900 p-6 sm:p-8 shadow-xl'
                : 'max-w-xl rounded-2xl border-2 border-slate-900 p-6 shadow-xl'
            }`}
          >
            {/* Top Emblem & Govt / MSME Header */}
            <div className="text-center border-b-2 border-slate-900 pb-5 mb-5 relative">
              <div className="flex items-center justify-center gap-3 mb-2">
                {/* Ashoka / Security Emblem */}
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-amber-400 shadow-md">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-800 font-mono">
                    GOVERNMENT OF INDIA • DIGITAL PUBLIC INFRASTRUCTURE
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wider font-display">
                    MINISTRY OF MSME & SOVEREIGN COMMERCE
                  </div>
                </div>
              </div>

              <div className="inline-block bg-slate-900 text-amber-400 px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase font-mono mt-1 shadow-xs">
                ★ MSME SOVEREIGN VERIFIABLE VYAPAR PASS ★
              </div>
            </div>

            {/* Pass Body */}
            {passFormat === 'standee' ? (
              /* STANDEE LAYOUT (Counter Stand Format) */
              <div className="space-y-6">
                {/* Merchant Primary Identity Details & QR in Horizontal / Vertical Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50/80 rounded-2xl p-5 border border-slate-200">
                  {/* Left: Merchant Credentials & Metadata */}
                  <div className="md:col-span-7 space-y-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>VERIFIED SOVEREIGN ENTERPRISE</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-display tracking-tight">
                        {businessName}
                      </h1>
                      <p className="text-xs font-medium text-slate-600 mt-0.5">
                        Proprietor: <strong className="text-slate-900">{ownerPersonId === 'did:person:ramesh001' ? 'Ramesh Sharma' : 'Priya Sharma'}</strong> · Micro Retail Enterprise
                      </p>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-sans font-bold">
                          Sovereign Business DID
                        </div>
                        <div className="font-bold text-slate-950 text-sm truncate">
                          {businessId}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-slate-400 block text-[9px] font-sans font-bold">UDYAM REGISTRATION</span>
                          <span className="font-bold text-slate-800">UDYAM-UP-54-0098214</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-slate-400 block text-[9px] font-sans font-bold">GSTIN ID</span>
                          <span className="font-bold text-slate-800">09AABCS1429B1Z5</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: High-Resolution Cryptographic QR */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-3 bg-white rounded-2xl border-2 border-slate-900 shadow-md">
                    <BusinessQRCode value={verifierUrl} size={160} showLogo={true} />
                    <div className="mt-2 text-[10px] font-mono font-black text-slate-950 tracking-wider">
                      SCAN FOR ZERO-KNOWLEDGE PROOF
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      Offline Cryptographic Verification
                    </div>
                  </div>
                </div>

                {/* 4 Multi-Authority Root Attestation Badges */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Cryptographically Anchored Institutional Attestations</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center space-y-1">
                      <div className="w-6 h-6 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div className="font-bold text-[11px] text-slate-900">GSTN Gateway</div>
                      <div className="text-[9px] text-slate-500">100% On-Time HMAC</div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center space-y-1">
                      <div className="w-6 h-6 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div className="font-bold text-[11px] text-slate-900">State Bank of India</div>
                      <div className="text-[9px] text-slate-500">Verified Current A/C</div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center space-y-1">
                      <div className="w-6 h-6 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div className="font-bold text-[11px] text-slate-900">ONDC Protocol</div>
                      <div className="text-[9px] text-slate-500">4.8★ Seller Score</div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center space-y-1">
                      <div className="w-6 h-6 mx-auto rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div className="font-bold text-[11px] text-slate-900">CSC Field Network</div>
                      <div className="text-[9px] text-slate-500">Agent Biometric Match</div>
                    </div>
                  </div>
                </div>

                {/* Verification Notice for Bank Officers & Tax Authorities */}
                <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-300 text-[11px] text-amber-950 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Instructions for Bank Officers & Inspectors:</strong> Scan the QR code above with any OpenVyapar verifier or camera to cryptographically verify authenticated tax compliance, bank turnover, and ONDC order volume without asking the merchant for passwords or raw statements.
                  </div>
                </div>
              </div>
            ) : (
              /* PVC SMART CARD FORMAT (Credit Card Dimensions) */
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl p-5 border-2 border-amber-400 shadow-lg relative overflow-hidden">
                  {/* Hologram Badge */}
                  <div className="absolute top-4 right-4 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                    ED25519 • LEVEL-3 SECURE
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                          Sovereign Enterprise Identity
                        </span>
                        <h2 className="text-xl font-black font-display text-white">
                          {businessName}
                        </h2>
                        <p className="text-xs text-slate-300">
                          Prop. Ramesh Sharma · Varanasi, UP
                        </p>
                      </div>

                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="text-slate-400">DID: <span className="text-amber-300 font-bold">{businessId}</span></div>
                        <div className="text-slate-400">UDYAM: <span className="text-white">UDYAM-UP-54-0098214</span></div>
                      </div>
                    </div>

                    <div className="p-1 bg-white rounded-xl shadow-inner shrink-0">
                      <BusinessQRCode value={verifierUrl} size={110} showLogo={true} />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>DIGITAL INDIA SOVEREIGN NODE</span>
                    <span className="text-emerald-400 font-bold">ROOT VERIFIED ✓</span>
                  </div>
                </div>

                <div className="text-center text-xs text-slate-500">
                  Standard PVC Smart Card 85.6mm × 53.98mm dimensions with ISO/IEC 7810 ID-1 standard.
                </div>
              </div>
            )}

            {/* Bottom Footer / Cryptographic Seal */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-mono gap-2">
              <div>ANCHOR: did:ov:ed25519-key-1 • W3C VC 2.0</div>
              <div className="flex items-center gap-1 text-slate-800 font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>OPENIYAPAR CRYPTOGRAPHIC STANDING CONFIRMED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 no-print">
          <div className="text-xs text-slate-500 hidden sm:block">
            Tip: Laminate and mount this pass at your shop billing counter.
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sovereign Pass</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
