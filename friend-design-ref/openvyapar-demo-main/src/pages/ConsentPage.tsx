import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import { CheckCircle2, Clock, X, Check, Eye } from 'lucide-react';
import { ConsentModal } from '../components/consent/ConsentModal';
import type { Consent } from '../types';

export const ConsentPage = () => {
  const { consents, approveConsent, denyConsent, revokeConsent } = useAppStore();
  const { t } = useTranslation();

  const pendingList = useMemo(() => consents.filter((c) => c.status === 'pending'), [consents]);
  const activeList = useMemo(() => consents.filter((c) => c.status === 'approved'), [consents]);
  const historyList = useMemo(
    () => consents.filter((c) => c.status === 'denied' || c.status === 'revoked'),
    [consents]
  );

  // Tab defaults to pending if there are pending items, else active
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>(() =>
    consents.some((c) => c.status === 'pending') ? 'pending' : 'active'
  );

  const [modalConsent, setModalConsent] = useState<Consent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleOpenReview = (consent: Consent) => {
    setModalConsent(consent);
    setIsModalOpen(true);
  };

  const handleRevoke = (id: string) => {
    setRevokingId(id);
    setTimeout(() => {
      revokeConsent(id);
      setRevokingId(null);
    }, 250);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.consent.title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t.consent.subtitle}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-xs sm:text-sm font-medium overflow-x-auto whitespace-nowrap pb-px">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 relative flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'pending'
              ? 'text-amber-800 font-bold border-b-2 border-amber-500'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>{t.consent.pendingTab}</span>
          {pendingList.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-amber-500 text-slate-950 font-bold rounded-full font-mono">
              {pendingList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 relative flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'active'
              ? 'text-amber-800 font-bold border-b-2 border-amber-500'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>{t.consent.activeTab}</span>
          <span className="text-xs text-slate-400 font-mono">({activeList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 relative flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'history'
              ? 'text-amber-800 font-bold border-b-2 border-amber-500'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>{t.consent.historyTab}</span>
          <span className="text-xs text-slate-400 font-mono">({historyList.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-4">
        {/* PENDING TAB: Primary view */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-2 shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="font-semibold text-slate-900 text-base">
                  {t.consent.noPending}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t.consent.noPendingDesc}
                </p>
              </div>
            ) : (
              pendingList.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border-2 border-amber-400/80 p-5 sm:p-6 shadow-sm space-y-5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-amber-800 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {t.consent.inboundRequest}
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 mt-2 font-display tracking-tight">
                        {c.requestedBy}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t.consent.duration}: {c.expiresAt || '30 days'}</span>
                    </div>
                  </div>

                  {/* Reading order: Requester -> Purpose -> Data Items -> Duration */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                        {t.consent.declaredPurpose}
                      </span>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">
                        {c.purpose}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                        {t.consent.requestedScope}
                      </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {c.dataItems.map((item, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-slate-100 text-slate-800 font-medium rounded-lg text-xs border border-slate-200"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Primary Decision Action Bar */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      onClick={() => handleOpenReview(c)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer self-start sm:self-auto"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span>{t.consent.inspectRules}</span>
                    </button>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                      <button
                        onClick={() => denyConsent(c.id)}
                        className="px-4 py-2.5 sm:py-2 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{t.consent.deny}</span>
                      </button>

                      <button
                        onClick={() => approveConsent(c.id)}
                        className="px-5 py-2.5 sm:py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs w-full sm:w-auto"
                      >
                        <Check className="w-4 h-4" />
                        <span>{t.consent.authorizeWithId}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ACTIVE TAB */}
        {activeTab === 'active' && (
          <div className="divide-y divide-slate-200 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
            {activeList.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                {t.consent.noActive}
              </div>
            ) : (
              activeList.map((c) => (
                <div
                  key={c.id}
                  className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors hover:bg-slate-50/50"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base text-slate-900">
                        {c.requestedBy}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {t.credentials.activeBadge}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-medium">
                      <span className="text-slate-400 font-normal">{t.dashboard.purpose}:</span> {c.purpose}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                      <div>
                        <span className="text-slate-400">{t.dashboard.scope}:</span>{' '}
                        <span className="text-slate-700 font-medium">{c.dataItems.join(', ')}</span>
                      </div>
                      <span className="text-slate-300">·</span>
                      <div>
                        <span className="text-slate-400">{t.consent.grantedAt}:</span>{' '}
                        <span className="font-mono text-slate-600">{c.grantedAt}</span>
                      </div>
                      <span className="text-slate-300">·</span>
                      <div>
                        <span className="text-slate-400">{t.consent.duration}:</span>{' '}
                        <span className="font-mono text-slate-600">{t.consent.until} {c.expiresAt?.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(c.id)}
                    disabled={revokingId === c.id}
                    className="px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer shrink-0 self-start lg:self-auto disabled:opacity-50"
                  >
                    {revokingId === c.id ? t.consent.revoking : t.consent.revokeConsent}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="divide-y divide-slate-200 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
            {historyList.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                {t.consent.noHistory}
              </div>
            ) : (
              historyList.map((c) => (
                <div
                  key={c.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{c.requestedBy}</span>
                      <span
                        className={`font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono text-[10px] ${
                          c.status === 'revoked'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="text-slate-600">{c.purpose}</div>
                    <div className="text-[11px] text-slate-400">
                      {t.dashboard.scope}: {c.dataItems.join(', ')}
                    </div>
                  </div>

                  <div className="text-slate-400 font-mono text-[11px] sm:text-right shrink-0">
                    {t.consent.lifecycleFinalized}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Shared Consent Modal */}
      <ConsentModal
        consent={modalConsent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApprove={(id) => {
          approveConsent(id);
          setActiveTab('active');
        }}
        onDeny={(id) => {
          denyConsent(id);
          setActiveTab('history');
        }}
      />
    </div>
  );
};
