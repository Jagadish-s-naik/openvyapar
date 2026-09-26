import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import { CheckCircle2, Copy, Check, Download, ShieldCheck } from 'lucide-react';
import { BusinessQRCode } from '../components/ui/BusinessQRCode';

export const IdentityPage = () => {
  const { businessId, businessName, tradeName, legalEntity } = useAppStore();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(businessId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.identity.title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t.identity.subtitle}
        </p>
      </div>

      {/* Primary: Business Name, Business ID, and QR Code — Large Visual Anchor */}
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
                {t.identity.operatingAs} <span className="font-semibold text-slate-900">{tradeName}</span> · {legalEntity}
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
                  <span className="text-slate-400 font-sans">{t.identity.jurisdictionLabel}</span>{' '}
                  <span className="text-slate-800 font-medium">{t.identity.jurisdictionValue}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">{t.identity.publicKeyLabel}</span>{' '}
                  <span className="text-slate-800 font-medium">did:ov:29aabcu9603</span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Anchor (Large & High-contrast) */}
          <div className="flex flex-col items-center p-5 sm:p-6 bg-slate-900 rounded-2xl border border-slate-800 text-center shrink-0 w-full sm:w-64 max-w-xs mx-auto lg:mx-0 shadow-md">
            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-inner max-w-full">
              <BusinessQRCode size={180} showLogo={true} />
            </div>
            <div className="mt-4 text-xs font-mono font-bold text-amber-400 tracking-wider">
              {t.identity.scanForProof}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              {t.identity.attestationType}
            </div>
          </div>
        </div>
      </section>

      {/* Secondary: Verification Sources — Short inline list */}
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
              <strong className="font-semibold text-slate-900">{t.identity.udyamRegistry}</strong> ({t.identity.udyamStatus})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="font-semibold text-slate-900">{t.identity.gstnPortal}</strong> ({t.identity.gstnStatus})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="font-semibold text-slate-900">{t.identity.panEntity}</strong> ({t.identity.panStatus})
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
