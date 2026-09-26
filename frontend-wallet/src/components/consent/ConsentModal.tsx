import { useState } from 'react';
import { ShieldCheck, X, Check, Lock, Clock, FileText } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Consent } from '../../types';

interface ConsentModalProps {
  consent: Consent | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

export const ConsentModal = ({
  consent,
  isOpen,
  onClose,
  onApprove,
  onDeny,
}: ConsentModalProps) => {
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  if (!isOpen || !consent) return null;

  const handleApprove = () => {
    setSubmitting(true);
    setTimeout(() => {
      onApprove(consent.id);
      setSubmitting(false);
      onClose();
    }, 400);
  };

  const handleDeny = () => {
    setSubmitting(true);
    setTimeout(() => {
      onDeny(consent.id);
      setSubmitting(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0a1424] text-white p-5 sm:p-6 flex items-start justify-between border-b border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              <Lock className="w-3 h-3 text-amber-400" />
              {t.consent.modalTag}
            </div>
            <h2 className="font-display text-xl font-bold text-white tracking-tight leading-snug pt-1">
              {consent.requestedBy}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close consent dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs text-slate-700 overflow-y-auto flex-1">
          {/* 1. Purpose */}
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
              {t.consent.modalPurposeHeader}
            </span>
            <p className="text-sm font-medium text-slate-900 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              {consent.purpose}
            </p>
          </div>

          {/* 2. Requested Data Items */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {t.consent.modalScopeHeader}
            </span>
            <div className="space-y-1.5">
              {consent.dataItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200/70"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-800 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Duration & Revocation Guarantee */}
          <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200/80 flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 space-y-0.5">
              <div className="font-semibold">
                {t.consent.duration}: {consent.expiresAt || '30 days'}
              </div>
              <p className="text-amber-800/90">{t.consent.modalGuarantee}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDeny}
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer text-center"
          >
            {t.consent.modalDenyBtn}
          </button>

          <button
            type="button"
            onClick={handleApprove}
            disabled={submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{submitting ? t.consent.modalSigningBtn : t.consent.modalAuthorizeBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
