import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import { CheckCircle2, QrCode, ArrowRight, ShieldCheck, KeyRound, History, ArrowUpRight } from 'lucide-react';

export const DashboardPage = () => {
  const { businessId, businessName, consents, auditLog } = useAppStore();
  const { t } = useTranslation();
  const activeConsents = consents.filter((c) => c.status === 'approved');
  const pendingConsents = consents.filter((c) => c.status === 'pending');
  const recentEvents = auditLog.slice(0, 2);

  return (
    <div className="space-y-10">
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
              <span className="text-slate-300">{t.dashboard.proprietorship}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">{t.dashboard.jurisdiction}</span>
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

      {/* Pending Consent Notification Banner (if any pending) */}
      {pendingConsents.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {t.dashboard.inboundPendingAlert} ({pendingConsents.length})
              </p>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                {pendingConsents[0].requestedBy}: {pendingConsents[0].purpose}
              </p>
            </div>
          </div>
          <Link
            to="/consents"
            className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shrink-0 self-start sm:self-auto text-center"
          >
            {t.dashboard.reviewConsent}
          </Link>
        </div>
      )}

      {/* 2. SECONDARY: Active Consents (Plain Rows, Generous Spacing) */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
              {t.dashboard.activeConsents} ({activeConsents.length})
            </h2>
          </div>
          <Link
            to="/consents"
            className="text-xs font-medium text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-1 group"
          >
            <span>{t.dashboard.viewAllConsents}</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-200">
          {activeConsents.length === 0 ? (
            <div className="py-6 text-xs text-slate-500">{t.dashboard.noActiveConsents}</div>
          ) : (
            activeConsents.slice(0, 3).map((consent) => (
              <div
                key={consent.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-900">
                    {consent.requestedBy}
                  </div>
                  <div className="text-slate-600">
                    <span className="text-slate-500">{t.dashboard.purpose}:</span> {consent.purpose}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <span className="font-medium text-slate-600">{t.dashboard.scope}:</span>{' '}
                    {consent.dataItems.join(', ')}
                  </div>
                </div>
                <div className="text-slate-500 font-mono text-[11px] sm:text-right shrink-0">
                  {t.dashboard.expires} {consent.expiresAt?.split(' ')[0]}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 3. SECONDARY: Recent Audit Events (Plain Rows, 2 Most Recent) */}
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

        <div className="divide-y divide-slate-200">
          {recentEvents.length === 0 ? (
            <div className="py-6 text-xs text-slate-500">{t.dashboard.noRecentAudit}</div>
          ) : (
            recentEvents.map((event) => (
              <div
                key={event.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-medium text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{event.actor}</span>
                  </div>
                  <div className="text-slate-600">{event.action}</div>
                </div>
                <div className="text-slate-500 font-mono text-[11px] sm:text-right shrink-0">
                  {event.timestamp}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
