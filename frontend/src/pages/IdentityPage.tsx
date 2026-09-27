import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import {
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Users,
  Printer,
  Shield,
  ExternalLink,
  Smartphone,
  QrCode,
} from 'lucide-react';
import { BusinessQRCode } from '../components/ui/BusinessQRCode';
import { SovereignPassModal } from '../components/identity/SovereignPassModal';

export const IdentityPage = () => {
  const {
    businessId,
    businessName,
    business,
    ownerPersonId,
    transferRole,
    credentials,
  } = useAppStore();
  const { t } = useTranslation();

  const [copied, setCopied] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  // Beat 5 Succession Transfer State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [successorPersonId, setSuccessorPersonId] = useState('did:person:priya001');
  const [successorName, setSuccessorName] = useState('Priya Sharma (Daughter / Successor)');
  const [isTransferring, setIsTransferring] = useState(false);
  const [successionSuccess, setSuccessionSuccess] = useState<string | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const getProofIdForBusiness = (bId: string) => {
    if (bId === 'did:biz:sharma001') return 'proof-loan-001';
    if (bId === 'OV-4471' || bId === 'did:biz:lakshmi002') return 'proof-gst-002';
    if (bId === 'did:biz:anand002' || bId === 'did:biz:anand003') return 'proof-mkt-003';
    return 'proof-loan-001';
  };
  const defaultProofId = getProofIdForBusiness(businessId);
  const qrVerifierUrl = `${origin}/verifier?did=${encodeURIComponent(businessId)}&proof_id=${defaultProofId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(businessId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyQrLink = () => {
    navigator.clipboard.writeText(qrVerifierUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleTransferSuccession = async () => {
    setIsTransferring(true);
    try {
      await transferRole({
        personId: successorPersonId,
        roleType: 'owner',
      });
      setSuccessionSuccess(
        t.identity.transferSuccess
      );
      setTimeout(() => {
        setIsTransferModalOpen(false);
      }, 3000);
    } catch (err: unknown) {
      console.error('Transfer error:', err);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.identity.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.identity.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsPassModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer"
            title={t.identity.downloadPass}
          >
            <Printer className="w-4 h-4" />
            <span>{t.identity.downloadPass}</span>
          </button>

          <button
            onClick={() => {
              setSuccessionSuccess(null);
              setIsTransferModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-600" />
            <span>{t.identity.successionTitle}</span>
          </button>
        </div>
      </div>

      {/* Succession Banner if completed */}
      {successionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold">{t.identity.successionTitle}</div>
            <div>{successionSuccess}</div>
          </div>
        </div>
      )}

      {/* Primary: Business Name, Business ID, and QR Code */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 md:p-10 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-10">
          {/* Identity Information */}
          <div className="space-y-5 sm:space-y-6 flex-1 min-w-0">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.identity.verifiedEntityBadge}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {businessName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                {t.identity.operatingAs} <span className="font-semibold text-slate-900">{typeof business?.metadata?.location === 'string' ? business.metadata.location : 'Varanasi, UP'}</span> · {typeof business?.metadata?.sector === 'string' ? business.metadata.sector : 'Retail Grocery & Essentials'}
              </p>
            </div>

            {/* Business ID Badge & Copy */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
              <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 bg-slate-900 text-white px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-800 shadow-xs w-full sm:w-auto">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-mono shrink-0">
                  {t.identity.businessId}
                </span>
                <span className="font-mono text-sm sm:text-base font-bold text-amber-400 tracking-wide break-all">
                  {businessId}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                  title={t.common.copy}
                  aria-label="Copy Business ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <button
                onClick={() => setIsPassModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer w-full sm:w-auto"
                title={t.identity.downloadPass}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.identity.downloadPass}</span>
              </button>

              <button
                onClick={() => setIsPassModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
              >
                <Shield className="w-3.5 h-3.5 text-slate-600" />
                <span>{t.identity.attestationType}</span>
              </button>

              {copied && <span className="text-xs text-emerald-600 font-medium w-full sm:w-auto text-center sm:text-left">{t.identity.copied}</span>}
            </div>

            {/* Sovereign Registry Attributes */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 font-mono text-slate-600">
                <div className="truncate">
                  <span className="text-slate-400 font-sans">{t.identity.currentProprietor}:</span>{' '}
                  <span className="text-slate-800 font-bold">{ownerPersonId}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">{t.identity.publicKeyLabel}:</span>{' '}
                  <span className="text-slate-800 font-medium">did:ov:ed25519-key-1</span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Anchor & Mobile Scan Launcher */}
          <div className="flex flex-col items-center p-4 sm:p-6 bg-slate-900 rounded-2xl border border-slate-800 text-center shrink-0 w-full sm:w-72 max-w-xs mx-auto lg:mx-0 shadow-md">
            <div
              onClick={() => setIsPassModalOpen(true)}
              className="p-1.5 rounded-2xl bg-white/5 border border-white/10 shadow-inner max-w-full cursor-pointer hover:border-amber-400/50 transition-colors group"
              title={t.identity.scanForProof}
            >
              <BusinessQRCode value={qrVerifierUrl} size={170} showLogo={true} />
            </div>
            
            <div className="mt-3 text-xs font-mono font-bold text-amber-400 tracking-wider flex items-center justify-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              <span>{t.identity.scanForProof}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate max-w-full px-2">
              {businessId}
            </div>

            {/* Quick Actions for Scan / Test Experience */}
            <div className="w-full mt-3.5 pt-3 border-t border-slate-800 space-y-1.5">
              <a
                href={qrVerifierUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                title={t.identity.scanForProof}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{t.dashboard.scanForProof}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyQrLink}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? t.pass.passCopied : t.pass.copyLinkBtn}</span>
                </button>
                <button
                  onClick={() => setIsPassModalOpen(true)}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
                  title="Enlarge Pass"
                >
                  {t.common.view}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Verification Sources */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
            {t.identity.rootSources}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-slate-700 py-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="font-semibold text-slate-900">{t.identity.gstnPortal}</strong> ({t.identity.gstnStatus})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="font-semibold text-slate-900">{t.identity.udyamRegistry}</strong> ({t.identity.udyamStatus})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="font-semibold text-slate-900">{t.identity.panEntity}</strong> ({t.identity.panStatus})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="font-semibold text-slate-900">{t.identity.bankEntity}</strong> ({t.identity.bankStatus})
            </span>
          </div>
        </div>
      </section>

      {/* OWNERSHIP SUCCESSION MODAL (Beat 5) */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-7 shadow-2xl border border-slate-200 space-y-4 sm:space-y-5 max-h-[90dvh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-900 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{t.identity.successionTitle}</span>
                </div>
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  {t.identity.successionModalTitle}
                </h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                {t.identity.successionModalDesc}
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">{t.identity.transferTo}</label>
                <input
                  type="text"
                  value={successorName}
                  onChange={(e) => setSuccessorName(e.target.value)}
                  placeholder={t.identity.successorNamePlaceholder}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Successor DID</label>
                <input
                  type="text"
                  value={successorPersonId}
                  onChange={(e) => setSuccessorPersonId(e.target.value)}
                  placeholder={t.identity.successorPersonIdPlaceholder}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  Continuous Reputation Guarantee
                </div>
                <div className="truncate">
                  • {t.identity.businessId}: <span className="font-mono font-semibold">{businessId}</span> (Unchanged)
                </div>
                <div>
                  • {t.credentials.title}: <span className="font-mono font-semibold">{credentials.length} credentials</span> (Preserved)
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-center"
              >
                {t.common.cancel}
              </button>

              <button
                onClick={handleTransferSuccession}
                disabled={isTransferring}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isTransferring ? t.identity.transferring : t.identity.confirmTransferBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Sovereign Vyapar Pass Modal */}
      <SovereignPassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
      />
    </div>
  );
};
