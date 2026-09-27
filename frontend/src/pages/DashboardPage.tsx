import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import { CheckCircle2, QrCode, ArrowRight, ShieldCheck, KeyRound, History, ArrowUpRight, Award, Clock } from 'lucide-react';
import { formatDate, formatRelativeTime } from '../utils/formatters';

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

  const activeDelegations = delegations.filter((d) => d.status === 'active');
  const recentEvents = timeline.slice(0, 3);

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10">
      {/* 1. PRIMARY: Identity Status Line & Hero Banner */}
      <section className="bg-gradient-to-br from-[#0a1424] via-[#0e1d35] to-[#122442] text-white rounded-2xl p-5 sm:p-7 md:p-8 border border-slate-800/80 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {t.dashboard.verifiedBadge}
              </span>
              <span className="text-xs text-slate-400 font-mono">{t.dashboard.liveNode}</span>
            </div>

            <h1 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {businessName}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-300 pt-0.5">
              <span className="font-mono text-amber-300 font-bold bg-amber-400/15 px-2.5 py-1 rounded-md border border-amber-400/30 max-w-full truncate">
                {t.identity.businessId}: {businessId}
              </span>
              <span className="text-slate-500 hidden xs:inline">·</span>
              <span className="text-slate-300">{business?.metadata?.sector || 'Retail Grocery & Essentials'}</span>
              <span className="text-slate-500 hidden xs:inline">·</span>
              <span className="text-slate-300">{business?.metadata?.location || 'Varanasi, UP'}</span>
            </div>
          </div>

          {/* QR Thumbnail & Direct Action */}
          <Link
            to="/identity"
            className="flex items-center gap-3.5 sm:gap-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/50 p-3 sm:p-3.5 rounded-xl text-slate-200 transition-all group shrink-0 w-full md:w-auto shadow-inner"
            title={t.dashboard.businessQrPass}
          >
            <div className="bg-white p-2 rounded-lg shrink-0 shadow-sm flex items-center justify-center">
              <QrCode className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-100 group-hover:text-amber-300 flex items-center gap-1">
                <span>{t.dashboard.businessQrPass}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-amber-400 shrink-0" />
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                {t.dashboard.scanForProof}
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6">
        <Link
          to="/credentials"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-400/80 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-semibold text-slate-400">Verifiable Credentials</span>
            <Award className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2">
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
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-400/80 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-semibold text-slate-400">Active Delegations</span>
            <KeyRound className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2">
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
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-400/80 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-semibold text-slate-400">Immutable Audit Trail</span>
            <History className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2">
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
      <section className="space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 sm:gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-500 shrink-0" />
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-800">
              Active Scoped Delegations ({activeDelegations.length})
            </h2>
          </div>
          <Link
            to="/consents"
            className="text-xs font-medium text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-1 group self-start sm:self-auto"
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
                <div className="space-y-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 flex flex-wrap items-center gap-2">
                    <span className="truncate">Delegate: {token.delegate_person_id}</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-slate-600">
                    <span className="text-slate-400">Granted Scopes:</span>{' '}
                    <span className="font-mono text-slate-800 font-medium break-all">
                      {token.scopes.join(', ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Token ID: {token.token_id} · Created: {formatDate(token.created_at)} ({formatRelativeTime(token.created_at)})
                  </div>
                </div>
                <Link
                  to="/consents"
                  className="text-xs text-red-600 hover:text-red-700 font-semibold self-start sm:self-auto hover:underline shrink-0"
                >
                  Revoke
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 4. RECENT VERIFIER & AUDIT ACTIVITY */}
      <section className="space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 sm:gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500 shrink-0" />
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-800">
              {t.dashboard.recentVerifierActivity}
            </h2>
          </div>
          <Link
            to="/audit"
            className="text-xs font-medium text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-1 group self-start sm:self-auto"
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
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2.5 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="font-medium text-slate-900 flex flex-wrap items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{event.actor?.name || event.actor?.id}</span>
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {event.category}
                    </span>
                  </div>
                  <div className="text-slate-600 font-normal leading-relaxed">
                    {event.title} — {event.description}
                  </div>
                </div>
                <div className="text-slate-500 text-xs sm:text-right shrink-0 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">{formatDate(event.timestamp)}</span>
                  <span className="text-[11px] text-slate-400">({formatRelativeTime(event.timestamp)})</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>

  );
};
