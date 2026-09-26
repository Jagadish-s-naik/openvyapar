import { useState } from 'react';
import { Bell, CheckCircle2, Globe, Shield, Menu, Zap, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../types';

interface TopBarProps {
  onToggleMobileMenu?: () => void;
}

export const TopBar = ({ onToggleMobileMenu }: TopBarProps) => {
  const {
    businessName,
    delegations,
    issueBatchCredentials,
    loadAllData,
    isSyncing,
    isMobileSimulator,
    toggleMobileSimulator,
  } = useAppStore();
  const { language, setLanguage } = useTranslation();
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

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-30 shadow-xs select-none">
      {/* LEFT: Mobile Menu + Enterprise Identity Pill + Live Node */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 md:hidden cursor-pointer transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Enterprise Identity Badge */}
        <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-800 shadow-xs shrink-0">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-slate-100 truncate max-w-[160px] md:max-w-[220px] whitespace-nowrap">
            {businessName}
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        </div>

        {/* Live Node Badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>DPI Live Node</span>
        </div>
      </div>

      {/* CENTER: Unified 3-Step Demo Pipeline */}
      <div className="hidden lg:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-semibold shrink-0 whitespace-nowrap">
        <Link
          to="/onboarding"
          className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all flex items-center gap-1.5 whitespace-nowrap"
          title="Step 1: Rural Assisted Voice Onboarding in CSC Center"
        >
          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold font-mono">1</span>
          <span>CSC Kiosk</span>
        </Link>

        <span className="text-slate-300 font-mono px-1">→</span>

        <Link
          to="/"
          className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 shadow-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
          title="Step 2: Business Owner Credential Wallet"
        >
          <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-300 flex items-center justify-center text-[10px] font-bold font-mono">2</span>
          <span>Owner Wallet</span>
        </Link>

        <span className="text-slate-300 font-mono px-1">→</span>

        <Link
          to="/verifier"
          className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all flex items-center gap-1.5 whitespace-nowrap"
          title="Step 3: Bank Officer Zero-Knowledge Desk Handoff"
        >
          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold font-mono">3</span>
          <span>Bank Desk</span>
        </Link>
      </div>

      {/* RIGHT: Quick Actions & Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Time-Skip Button */}
        <button
          onClick={handleTimeSkip}
          disabled={isIssuingBatch}
          className={`h-9 flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border whitespace-nowrap shrink-0 ${
            batchSuccess
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500/50'
          } disabled:opacity-50`}
          title="Simulate 1 year of verified GST, Bank & ONDC credentials"
        >
          <Zap className={`w-3.5 h-3.5 ${isIssuingBatch ? 'animate-spin' : ''}`} />
          <span>
            {batchSuccess ? '✓ Issued' : isIssuingBatch ? 'Issuing...' : 'Time-Skip (Issue Batch)'}
          </span>
        </button>

        {/* Sync / Refresh */}
        <button
          onClick={() => loadAllData()}
          disabled={isSyncing}
          className="h-9 w-9 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80 shrink-0"
          title="Refresh Data from Backend"
          aria-label="Refresh Data from Backend"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-600' : ''}`} />
        </button>

        {/* Mobile Device Simulator Toggle */}
        <button
          onClick={toggleMobileSimulator}
          className={`h-9 flex items-center gap-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
            isMobileSimulator
              ? 'bg-slate-900 text-amber-400 border-slate-800 shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80'
          }`}
          title={isMobileSimulator ? 'Switch to Desktop Full View' : 'Simulate ₹7,000 Android Phone View'}
        >
          {isMobileSimulator ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Desktop</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Phone Frame</span>
            </>
          )}
        </button>

        {/* Language Selector */}
        <div className="h-9 flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200 shrink-0">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
          <div className="flex gap-0.5">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-2 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
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
            className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200/80 cursor-pointer relative"
            title="Notifications & Inbound Owner Dispatches"
            aria-label="Toggle notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-amber-500 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center font-mono ring-2 ring-white">
              {activeCount || 2}
            </span>
          </button>

          {/* Notification Popover Dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                    <Bell className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Inbound Notifications & Dispatches</h4>
                    <p className="text-[10px] text-slate-500">From Business Owner & Institutional Issuers</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNotificationOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {/* 1. Owner to Employee Delegation Notification */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                      <span>📩</span>
                      <span>Owner Scoped Delegation</span>
                    </span>
                    <span className="text-[9px] font-mono text-amber-700 font-semibold">Just now</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    Ramesh Sharma (Owner) sent you a Scoped Token
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Granted authority: <span className="font-mono font-bold text-slate-800">file_returns</span> (GST Returns Filing). Restricted to ₹50,000 invoice limit.
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <Link
                      to="/consents"
                      onClick={() => setIsNotificationOpen(false)}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-bold rounded-md transition-all shadow-xs"
                    >
                      Accept & View Scope
                    </Link>
                    <span className="text-[10px] text-slate-500 font-mono">did:token:del-001</span>
                  </div>
                </div>

                {/* 2. OCEN Pre-Approval Notification */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <span>⚡</span>
                      <span>Institutional Credit</span>
                    </span>
                    <span className="text-[9px] font-mono text-emerald-700 font-semibold">10m ago</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    SBI Sahay: ₹5,00,000 Working Capital Pre-Approved
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Cryptographic compliance check verified. Ready for zero-knowledge desk handoff.
                  </p>
                  <Link
                    to="/credentials"
                    onClick={() => setIsNotificationOpen(false)}
                    className="inline-block text-[10px] font-bold text-emerald-700 hover:underline pt-0.5"
                  >
                    Open Selective Proof Builder →
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
<<<<<<< HEAD:frontend/src/components/layout/TopBar.tsx

      {/* 🎙️ 2-Minute Judge Pitch Cheat Sheet Modal */}
      {isPitchGuideOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0a1424] p-4 text-white flex items-center justify-between border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-sm">🎙️</span>
                <div>
                  <h3 className="text-sm font-bold text-amber-400">OpenVyapar 2-Minute Judge Pitch Script</h3>
                  <p className="text-[11px] text-slate-400">Verifiable DPI Architecture & Anti-Scam Narrative</p>
                </div>
              </div>
              <button
                onClick={() => setIsPitchGuideOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
              {/* Beat 1 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-mono text-[10px]">1</span>
                    <span>Beat 1: Informal to Verifiable (CSC Field Onboard · /onboarding)</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">0:00 – 0:30</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  "63 million Indian micro-enterprises operate informally without audited financials. In Beat 1, a rural merchant speaks in Hindi or Kannada at a CSC kiosk. Our agent extracts structured metadata, captures GPS-tagged field witnessing, and creates a sovereign Enterprise DID."
                </p>
              </div>

              {/* Beat 2 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-mono text-[10px]">2</span>
                    <span>Beat 2: Verifiable Track Record & Time-Skip (Owner Wallet · /)</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">0:30 – 0:50</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  "Over time, institutions like GSTN, SBI, and ONDC issue tamper-evident credentials directly into the merchant's hardware wallet. Click 'Time-Skip' to simulate 1 year of verified compliance."
                </p>
              </div>

              {/* Beat 3 & 4 */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-mono text-[10px]">3</span>
                    <span>Beat 3 & 4: Zero-Knowledge Desk Handoff & Sanction (/verifier)</span>
                  </span>
                  <span className="font-mono text-amber-800 font-bold text-[10px]">0:50 – 1:30</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  "The merchant applies for credit using Zero-Knowledge Selective Proofs. Notice we share turnover without disclosing personal PAN or bank accounts. Transmitting to Desk PIN 'SBI-DESK-7492' auto-populates the loan officer's screen instantly for a ₹5L credit sanction."
                </p>
              </div>

              {/* Beat 5 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-mono text-[10px]">4</span>
                    <span>Beat 5: Scoped Delegations & Anti-Scam Guardrails</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">1:30 – 2:00</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  "Instead of sharing passwords with accountants, the owner issues a cryptographic scoped token (file_returns only). If the accountant tries to take a loan, the cryptographic engine mathematically rejects it."
                </p>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsPitchGuideOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Got It, Ready to Pitch!
              </button>
            </div>
          </div>
        </div>
      )}
=======
>>>>>>> 5b5ad97 (feat: add printable sovereign vyapar pass and mobile device simulator):frontend-wallet/src/components/layout/TopBar.tsx
    </header>
  );
};
