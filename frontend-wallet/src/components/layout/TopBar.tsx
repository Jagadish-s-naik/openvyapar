import { useState } from 'react';
import { Bell, CheckCircle2, Globe, Shield, Menu, Zap, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../types';

interface TopBarProps {
  onToggleMobileMenu?: () => void;
}

export const TopBar = ({ onToggleMobileMenu }: TopBarProps) => {
  const {
    businessId,
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
  const [isPitchGuideOpen, setIsPitchGuideOpen] = useState(false);

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
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Menu Button + Business ID Badge */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 md:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 text-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 shadow-xs">
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">
            {businessId}
          </span>
          <span className="text-slate-500 text-xs hidden sm:inline">|</span>
          <span className="text-xs font-medium text-slate-200 truncate hidden sm:inline max-w-[140px] md:max-w-xs">
            {businessName}
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-0.5 shrink-0" />
        </div>

        {/* 3-Step Demo Navigator Bar */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[11px] font-semibold">
          <a
            href="http://localhost:5175"
            className="px-2 py-0.5 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-all flex items-center gap-1"
            title="Step 1: Assisted Voice Onboarding in Rural CSC Center"
          >
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">1</span>
            <span>CSC Onboarding</span>
          </a>
          <span className="text-slate-400 font-mono">→</span>
          <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-900 border border-amber-400/40 flex items-center gap-1 shadow-xs font-bold">
            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">2</span>
            <span>Owner Wallet</span>
          </span>
          <span className="text-slate-400 font-mono">→</span>
          <a
            href="http://localhost:5174"
            className="px-2 py-0.5 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-all flex items-center gap-1"
            title="Step 3: Bank Officer Zero-Knowledge Desk Handoff"
          >
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">3</span>
            <span>Bank Verifier</span>
          </a>
        </div>

        <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {t.topbar.liveNode}
        </span>
      </div>

      {/* Right Controls: Fast Forward Button, Refresh, Language & Notification */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Beat 2 Fast-Forward / Issue Batch Quick Action */}
        <button
          onClick={handleTimeSkip}
          disabled={isIssuingBatch}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs border ${
            batchSuccess
              ? 'bg-emerald-500 text-white border-emerald-600'
              : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500/50'
          } disabled:opacity-50`}
          title="Beat 2: Issue Institutional Credentials (GSTN, Bank, ONDC)"
        >
          <Zap className={`w-3.5 h-3.5 ${isIssuingBatch ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {batchSuccess ? '✓ Credentials Issued' : isIssuingBatch ? 'Issuing...' : 'Time-Skip (Issue Batch)'}
          </span>
          <span className="sm:hidden">⚡ Time-Skip</span>
        </button>

        {/* Pitch Guide / Presentation Mode Button */}
        <button
          onClick={() => setIsPitchGuideOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-amber-300 hover:bg-slate-800 border border-amber-400/30 transition-all cursor-pointer shadow-xs"
          title="Open 2-Minute Judge Pitch Cheat Sheet"
        >
          <span>🎙️</span>
          <span>Pitch Guide</span>
        </button>

        {/* Refresh / Sync Button */}
        <button
          onClick={() => loadAllData()}
          disabled={isSyncing}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refresh Data from Backend"
          aria-label="Refresh Data from Backend"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-600' : ''}`} />
        </button>

        {/* Language Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-1 mr-0.5" />
          <div className="flex gap-0.5">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  language === lang.code
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={lang.label}
              >
                {lang.code}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Bell with Inbound Dispatch Drawer */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
            title="Notifications & Inbound Owner Dispatches"
            aria-label="Toggle notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center font-mono ring-2 ring-white animate-pulse">
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
                    <span>Beat 1: Informal to Verifiable (CSC Field Onboard · Port 5175)</span>
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
                    <span>Beat 2: Verifiable Track Record & Time-Skip (Port 5173)</span>
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
                    <span>Beat 3 & 4: Zero-Knowledge Desk Handoff & Sanction (Port 5174)</span>
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
    </header>
  );
};
