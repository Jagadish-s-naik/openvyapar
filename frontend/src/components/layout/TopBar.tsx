import { useState } from 'react';
import { Bell, CheckCircle2, Globe, Shield, Menu, Zap, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../types';

interface TopBarProps {
  onToggleMobileMenu?: () => void;
}

export const TopBar = ({ onToggleMobileMenu }: TopBarProps) => {
  const location = useLocation();
  const {
    businessName,
    delegations,
    issueBatchCredentials,
    loadAllData,
    isSyncing,
  } = useAppStore();
  const { t, language, setLanguage } = useTranslation();
  const [isIssuingBatch, setIsIssuingBatch] = useState(false);
  const [batchSuccess, setBatchSuccess] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const activeCount = delegations.filter((d) => d.status === 'active').length;

  const languages: { code: Language; label: string }[] = [
    { code: 'EN', label: 'EN' },
    { code: 'HI', label: 'हिन्दी' },
    { code: 'KN', label: 'ಕನ್ನಡ' },
  ];

  const handleTimeSkip = async () => {
    setIsIssuingBatch(true);
    setBatchSuccess(false);
    try {
      await issueBatchCredentials();
      setBatchSuccess(true);
      setTimeout(() => setBatchSuccess(false), 3000);
    } catch (err) {
      console.error('Batch issue error:', err);
    } finally {
      setIsIssuingBatch(false);
    }
  };

  const isOnboarding = location.pathname === '/onboarding';
  const isVerifier = location.pathname === '/verifier';
  const isOwnerWallet = !isOnboarding && !isVerifier;

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200/90 px-2.5 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-3 shrink-0 sticky top-0 z-30 shadow-xs select-none w-full max-w-full min-w-0">
      {/* LEFT: Mobile Menu + Enterprise Identity Pill */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 md:hidden cursor-pointer transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Enterprise Identity Badge */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-900 text-white px-2 sm:px-3 py-1.5 rounded-xl border border-slate-800 shadow-xs shrink min-w-0 max-w-[120px] xs:max-w-[160px] sm:max-w-[240px]">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] sm:text-xs font-bold text-slate-100 truncate">
            {businessName}
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 hidden xs:block" />
        </div>
      </div>

      {/* CENTER: Unified 3-Step Demo Pipeline */}
      <div className="hidden lg:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-semibold shrink-0 whitespace-nowrap">
        <Link
          to="/onboarding"
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            isOnboarding
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
          title={t.topbar.step1Title}
        >
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
            isOnboarding ? 'bg-slate-950 text-emerald-300' : 'bg-slate-200 text-slate-700'
          }`}>1</span>
          <span>{t.topbar.step1Label}</span>
        </Link>

        <span className="text-slate-300 font-mono px-1">→</span>

        <Link
          to="/"
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            isOwnerWallet
              ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
          title={t.topbar.step2Title}
        >
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
            isOwnerWallet ? 'bg-slate-950 text-amber-300' : 'bg-slate-200 text-slate-700'
          }`}>2</span>
          <span>{t.topbar.step2Label}</span>
        </Link>

        <span className="text-slate-300 font-mono px-1">→</span>

        <Link
          to="/verifier"
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            isVerifier
              ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
          title={t.topbar.step3Title}
        >
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
            isVerifier ? 'bg-slate-950 text-amber-300' : 'bg-slate-200 text-slate-700'
          }`}>3</span>
          <span>{t.topbar.step3Label}</span>
        </Link>
      </div>

      {/* RIGHT: Quick Actions & Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Time-Skip Button */}
        <button
          onClick={handleTimeSkip}
          disabled={isIssuingBatch}
          className={`h-8 sm:h-9 flex items-center gap-1 px-2 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-xs border whitespace-nowrap shrink-0 ${
            batchSuccess
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500/50'
          } disabled:opacity-50`}
          title={t.topbar.timeSkipTitle}
        >
          <Zap className={`w-3.5 h-3.5 ${isIssuingBatch ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {batchSuccess ? t.topbar.timeSkipIssued : isIssuingBatch ? t.topbar.timeSkipIssuing : t.topbar.timeSkipBtn}
          </span>
          <span className="hidden md:inline">
            {!batchSuccess && !isIssuingBatch ? t.topbar.timeSkipIssueBatch : ''}
          </span>
        </button>

        {/* Sync / Refresh */}
        <button
          onClick={() => loadAllData()}
          disabled={isSyncing}
          className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80 shrink-0"
          title={t.topbar.refreshTitle}
          aria-label={t.topbar.refreshTitle}
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSyncing ? 'animate-spin text-amber-600' : ''}`} />
        </button>

        {/* Language Selector */}
        <div className="h-8 sm:h-9 flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200 shrink-0">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-1 mr-0.5 hidden sm:block" />
          <div className="flex gap-0.5">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  language === lang.code
                    ? 'bg-white text-slate-950 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={lang.label}
              >
                {lang.code}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Bell */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200/80 cursor-pointer relative"
            title={t.topbar.notificationsTitle}
            aria-label={t.topbar.notificationsTitle}
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3.5 h-3.5 bg-amber-500 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center font-mono ring-2 ring-white">
              {activeCount || 2}
            </span>
          </button>

          {/* Notification Popover Dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] xs:w-80 sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 sm:p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                    <Bell className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.topbar.inboundNotifications}</h4>
                    <p className="text-[10px] text-slate-500">{t.topbar.fromOwnerAndIssuers}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNotificationOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 sm:max-h-80 overflow-y-auto">
                {/* 1. Owner to Employee Delegation Notification */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                      <span>📩</span>
                      <span>{t.topbar.ownerDelegationTag}</span>
                    </span>
                    <span className="text-[9px] font-mono text-amber-700 font-semibold">{t.topbar.justNow}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    {t.topbar.ownerDelegationTitle}
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {t.topbar.ownerDelegationDesc}
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <Link
                      to="/consents"
                      onClick={() => setIsNotificationOpen(false)}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-bold rounded-md transition-all shadow-xs"
                    >
                      {t.topbar.acceptViewScope}
                    </Link>
                    <span className="text-[10px] text-slate-500 font-mono">did:token:del-001</span>
                  </div>
                </div>

                {/* 2. OCEN Pre-Approval Notification */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <span>⚡</span>
                      <span>{t.topbar.creditTag}</span>
                    </span>
                    <span className="text-[9px] font-mono text-emerald-700 font-semibold">10m ago</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    {t.topbar.ocenApprovalTitle}
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {t.topbar.ocenApprovalDesc}
                  </p>
                  <Link
                    to="/verifier"
                    onClick={() => setIsNotificationOpen(false)}
                    className="inline-block text-[10px] font-bold text-emerald-700 hover:underline pt-0.5"
                  >
                    {t.topbar.inspectOffer} →
                  </Link>
                </div>

                {/* 3. Anti-Scam Guardrail Notification */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                      <span>🛡️</span>
                      <span>Anti-Scam Guardrail</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">1h ago</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Blocked unauthorized loan application attempt by accountant persona (Scope violation: <code className="font-mono text-[10px]">LOAN_APPLY_NOT_PERMITTED</code>).
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                <Link
                  to="/consents"
                  onClick={() => setIsNotificationOpen(false)}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800"
                >
                  Manage All Active Delegations & Tokens →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

  );
};
