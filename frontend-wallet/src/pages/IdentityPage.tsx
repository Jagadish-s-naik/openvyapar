import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import {
  CheckCircle2,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { BusinessQRCode } from '../components/ui/BusinessQRCode';

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
  const [downloaded, setDownloaded] = useState(false);

  // Beat 5 Succession Transfer State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [successorPersonId, setSuccessorPersonId] = useState('did:person:priya001');
  const [successorName, setSuccessorName] = useState('Priya Sharma (Daughter / Successor)');
  const [isTransferring, setIsTransferring] = useState(false);
  const [successionSuccess, setSuccessionSuccess] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(businessId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleTransferSuccession = async () => {
    setIsTransferring(true);
    try {
      await transferRole({
        personId: successorPersonId,
        roleType: 'owner',
      });
      setSuccessionSuccess(
        `Ownership role transferred to ${successorName}. Business DID ${businessId} and all ${credentials.length} credentials persist intact!`
      );
      setTimeout(() => {
        setIsTransferModalOpen(false);
      }, 3000);
    } catch (err: any) {
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

        <button
          onClick={() => {
            setSuccessionSuccess(null);
            setIsTransferModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Users className="w-4 h-4" />
          <span>Ownership Succession (Beat 5)</span>
        </button>
      </div>

      {/* Succession Banner if completed */}
      {successionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold">Generational Succession Recorded</div>
            <div>{successionSuccess}</div>
          </div>
        </div>
      )}

      {/* Primary: Business Name, Business ID, and QR Code */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          {/* Identity Information */}
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.identity.verifiedEntityBadge}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {businessName}
              </h2>
              <p className="text-sm text-slate-600">
                Operating in <span className="font-semibold text-slate-900">{typeof business?.metadata?.location === 'string' ? business.metadata.location : 'Varanasi, UP'}</span> · {typeof business?.metadata?.sector === 'string' ? business.metadata.sector : 'Retail Grocery & Essentials'}
              </p>
            </div>

            {/* Business ID Badge & Copy */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-xl border border-slate-800 shadow-xs w-full sm:w-auto">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">
                  {t.identity.businessId}
                </span>
                <span className="font-mono text-base font-bold text-amber-400 tracking-wide">
                  {businessId}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Business ID"
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
                onClick={handleDownload}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                {downloaded ? t.identity.passDownloaded : t.identity.downloadPass}
              </button>

              {copied && <span className="text-xs text-emerald-600 font-medium w-full sm:w-auto text-center sm:text-left">{t.identity.copied}</span>}
            </div>

            {/* Sovereign Registry Attributes */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-slate-600">
                <div>
                  <span className="text-slate-400 font-sans">Primary Owner:</span>{' '}
                  <span className="text-slate-800 font-bold">{ownerPersonId}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Public Key Method:</span>{' '}
                  <span className="text-slate-800 font-medium">did:ov:ed25519-key-1</span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Anchor */}
          <div className="flex flex-col items-center p-5 sm:p-6 bg-slate-900 rounded-2xl border border-slate-800 text-center shrink-0 w-full sm:w-64 max-w-xs mx-auto lg:mx-0 shadow-md">
            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-inner max-w-full">
              <BusinessQRCode size={180} showLogo={true} />
            </div>
            <div className="mt-4 text-xs font-mono font-bold text-amber-400 tracking-wider">
              {t.identity.scanForProof}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              {businessId}
            </div>
          </div>
        </div>
      </section>

      {/* Verification Sources */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
            Registered Root Issuers & Attestation Authorities
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-slate-700 py-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="font-semibold text-slate-900">GSTN Gateway</strong> (HMAC Attested)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="font-semibold text-slate-900">State Bank of India</strong> (Account Verification)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="font-semibold text-slate-900">ONDC Protocol</strong> (Order Fulfillment Record)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="font-semibold text-slate-900">CSC Field Network</strong> (Agent Witnessed)
            </span>
          </div>
        </div>
      </section>

      {/* OWNERSHIP SUCCESSION MODAL (Beat 5) */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-900 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Beat 5: Unbroken Business Identity Across Generations
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Transfer Business Ownership
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
                When Ramesh Sharma transfers shop ownership to daughter Priya Sharma, the business DID and all accumulated reputation credentials persist intact without losing digital standing.
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Successor Name & Relationship</label>
                <input
                  type="text"
                  value={successorName}
                  onChange={(e) => setSuccessorName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Successor DID</label>
                <input
                  type="text"
                  value={successorPersonId}
                  onChange={(e) => setSuccessorPersonId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Continuous Reputation Guarantee
                </div>
                <div>
                  • Business DID: <span className="font-mono font-semibold">{businessId}</span> (Unchanged)
                </div>
                <div>
                  • Active Credentials: <span className="font-mono font-semibold">{credentials.length} credentials</span> (Preserved)
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={handleTransferSuccession}
                disabled={isTransferring}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isTransferring ? 'Recording Succession...' : 'Confirm Ownership Transfer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
