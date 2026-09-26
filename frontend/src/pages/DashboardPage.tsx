import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import { CheckCircle2, QrCode, ArrowRight, ShieldCheck, KeyRound, History, ArrowUpRight, Award, TrendingUp, Sparkles, ShoppingBag } from 'lucide-react';

export const DashboardPage = () => {
  const {
    businessId,
    businessName,
    business,
    credentials,
    delegations,
    timeline,
  } = useAppStore();
  const { t } = useTranslation();

  const [repaidAmount, setRepaidAmount] = useState(42850);
  const [recentSplitToast, setRecentSplitToast] = useState<string | null>(null);

  const totalLoan = 500000;
  const remainingLoan = Math.max(0, totalLoan - repaidAmount);
  const progressPercent = Math.min(100, Math.round((repaidAmount / totalLoan) * 100));

  const handleSimulateUpiPayment = () => {
    const payment = 1000;
    const splitDeduction = 50; // 5%
    const merchantNet = 950;
    setRepaidAmount((prev) => Math.min(totalLoan, prev + splitDeduction));
    setRecentSplitToast(
      `✓ ₹${payment} UPI Customer Order Received: ₹${merchantNet} credited to your wallet, ₹${splitDeduction} (5%) auto-settled SBI loan!`
    );
    setTimeout(() => setRecentSplitToast(null), 5000);
  };

  const activeDelegations = delegations.filter((d) => d.status === 'active');
  const recentEvents = timeline.slice(0, 3);

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* 1. PRIMARY: Identity Status Line & Hero Banner */}
      <section className="bg-gradient-to-br from-[#0a1424] via-[#0e1d35] to-[#122442] text-white rounded-2xl p-6 sm:p-8 border border-slate-800/80 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {t.dashboard.verifiedBadge}
              </span>
              <span className="text-xs text-slate-400 font-mono">{t.dashboard.liveNode}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              {businessName}
            </h1>

            <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-300 pt-1">
              <span className="font-mono text-amber-300 font-bold bg-amber-400/15 px-2.5 py-1 rounded-md border border-amber-400/30">
                {t.identity.businessId}: {businessId}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">{business?.metadata?.sector || 'Retail Grocery & Essentials'}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">{business?.metadata?.location || 'Varanasi, UP'}</span>
            </div>
          </div>

          {/* QR Thumbnail & Direct Action */}
          <Link
            to="/identity"
            className="flex items-center gap-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/50 p-3.5 rounded-xl text-slate-200 transition-all group shrink-0 w-full sm:w-auto self-stretch sm:self-auto shadow-inner"
            title={t.dashboard.businessQrPass}
          >
            <div className="bg-white p-2 rounded-lg shrink-0 shadow-sm flex items-center justify-center">
              <QrCode className="w-7 h-7 text-slate-950" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-100 group-hover:text-amber-300 flex items-center gap-1">
                {t.dashboard.businessQrPass}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-amber-400" />
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {t.dashboard.scanForProof}
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 🌟 SMART CASH-FLOW PROGRAMMABLE REPAYMENT STREAM CARD */}
      <section className="bg-white rounded-2xl border-2 border-emerald-500/80 p-6 shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
              <TrendingUp className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                  OCEN PROGRAMMABLE CASH-FLOW REPAYMENT
                </span>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ZERO-DEFAULT STREAM
                </span>
              </div>
              <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                SBI Working Capital (₹5,00,000) · 5% Daily UPI Auto-Split Active
              </h3>
            </div>
          </div>

          <button
            onClick={handleSimulateUpiPayment}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            title="Simulate a customer purchasing ₹1,000 via UPI to demonstrate 5% auto-split loan repayment"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Simulate ₹1,000 Customer UPI Order</span>
          </button>
        </div>

        {/* Live Simulation Toast */}
        {recentSplitToast && (
          <div className="p-3 rounded-xl bg-emerald-900 text-emerald-100 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
            <span>{recentSplitToast}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Credit Facility</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">₹5,00,000</div>
            <span className="text-[10px] text-slate-400">SBI MSME Sahay Priority Limit</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Auto-Repaid via UPI Stream</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">₹{repaidAmount.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-600 font-medium">From daily digital sales splits ({progressPercent}%)</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Remaining Balance</span>
            <div className="text-xl font-bold font-mono text-amber-900 mt-1">₹{remainingLoan.toLocaleString()}</div>
            <span className="text-[10px] text-amber-700 font-medium">0 fixed EMI pressure · Cash-flow synced</span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Repayment Progress: <strong className="text-emerald-700">{progressPercent}% Settled</strong></span>
            <span className="text-slate-500 font-mono text-[11px]">₹{repaidAmount.toLocaleString()} / ₹5,00,000</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Proactive Pre-Approved Working Capital Credit Discovery Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-[#0a1424] border border-emerald-500/40 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wide">
              ⚡ OCEN / MSME-DPI Pre-Approved
            </span>
            <span className="text-xs text-slate-400 font-mono">State Bank of India — MSME Sahay</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>₹5,00,000 Working Capital Pre-Sanctioned at 8.45%</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Based on your accumulated cryptographic GST compliance and consistent banking velocity, you qualify for instant collateral-free credit without sharing raw bank accounts or passwords.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <Link
            to="/credentials"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 group cursor-pointer"
          >
            <span>Claim via Zero-Knowledge Proof</span>
            <ArrowRight className="w-4 h-4 text-slate-950 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Link
          to="/credentials"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-400/80 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-semibold text-slate-400">Verifiable Credentials</span>
            <Award className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
              {credentials.length}
            </span>
            <span className="text-xs text-emerald-600 font-semibold font-mono">HMAC Valid</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            GSTN, SBI, ONDC, Self-Attested
          </p>
        </Link>

        <Link
          to="/consents"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-400/80 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-semibold text-slate-400">Active Delegations</span>
            <KeyRound className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
              {activeDelegations.length}
            </span>
            <span className="text-xs text-slate-500 font-mono">Least-Privilege</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Scoped tokens with revocability
          </p>
        </Link>

        <Link
          to="/audit"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-400/80 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-semibold text-slate-400">Immutable Audit Trail</span>
            <History className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
              {timeline.length}
            </span>
            <span className="text-xs text-slate-500 font-mono">Logged Events</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            ACID persisted in SQLite registry
          </p>
        </Link>
      </div>

      {/* 3. ACTIVE DELEGATIONS SECTION */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
              Active Scoped Delegations ({activeDelegations.length})
            </h2>
          </div>
          <Link
            to="/consents"
            className="text-xs font-medium text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-1 group"
          >
            <span>Manage Delegations & Scopes</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-200 bg-white rounded-2xl border border-slate-200 shadow-xs">
          {activeDelegations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No active delegations. Grant least-privilege access to your CA or staff on the Delegations tab.
            </div>
          ) : (
            activeDelegations.map((token) => (
              <div
                key={token.token_id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span>Delegate: {token.delegate_person_id}</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-slate-600">
                    <span className="text-slate-400">Granted Scopes:</span>{' '}
                    <span className="font-mono text-slate-800 font-medium">
                      {token.scopes.join(', ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Token ID: {token.token_id} · Created: {new Date(token.created_at).toLocaleString()}
                  </div>
                </div>
                <Link
                  to="/consents"
                  className="text-xs text-red-600 hover:text-red-700 font-semibold self-start sm:self-auto hover:underline"
                >
                  Revoke
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 4. RECENT VERIFIER & AUDIT ACTIVITY */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
              {t.dashboard.recentVerifierActivity}
            </h2>
          </div>
          <Link
            to="/audit"
            className="text-xs font-medium text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-1 group"
          >
            <span>{t.dashboard.viewFullAudit}</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-200 bg-white rounded-2xl border border-slate-200 shadow-xs">
          {recentEvents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">{t.dashboard.noRecentAudit}</div>
          ) : (
            recentEvents.map((event) => (
              <div
                key={event.event_id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-medium text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{event.actor?.name || event.actor?.id}</span>
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {event.category}
                    </span>
                  </div>
                  <div className="text-slate-600 font-normal">
                    {event.title} — {event.description}
                  </div>
                </div>
                <div className="text-slate-400 font-mono text-[11px] sm:text-right shrink-0">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
