import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import { ShieldCheck, Filter, ArrowUpDown } from 'lucide-react';

export const AuditLogPage = () => {
  const auditLog = useAppStore((state) => state.auditLog);
  const { t } = useTranslation();
  const [filterActor, setFilterActor] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Extract unique actors for the single collapsed dropdown filter
  const uniqueActors = useMemo(() => {
    return Array.from(new Set(auditLog.map((a) => a.actor)));
  }, [auditLog]);

  // Filter and sort audit events
  const displayLogs = useMemo(() => {
    let list = filterActor === 'all' ? [...auditLog] : auditLog.filter((a) => a.actor === filterActor);
    if (sortOrder === 'asc') {
      list = list.reverse();
    }
    return list;
  }, [auditLog, filterActor, sortOrder]);

  return (
    <div className="space-y-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.audit.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.audit.subtitle}
          </p>
        </div>

        {/* Secondary: Service filter dropdown + Sort Order toggle */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-2 bg-white border border-slate-300/90 rounded-xl px-3 py-2 sm:py-1.5 shadow-xs flex-1 sm:flex-initial">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer w-full"
              aria-label="Filter by service or actor"
            >
              <option value="all">{t.audit.allActors} ({auditLog.length})</option>
              {uniqueActors.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-300/90 px-3 py-2 sm:py-1.5 rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
            title={`Order: ${sortOrder === 'desc' ? t.audit.newestFirst : t.audit.oldestFirst}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'desc' ? t.audit.newestFirst : t.audit.oldestFirst}</span>
          </button>
        </div>
      </div>

      {/* Primary: 4-Column Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0a1424] text-slate-300 uppercase tracking-wider font-mono text-[11px] border-b border-slate-800">
                <th className="py-3.5 px-5 font-semibold w-48">{t.audit.colTimestamp}</th>
                <th className="py-3.5 px-5 font-semibold w-64">{t.audit.colActor}</th>
                <th className="py-3.5 px-5 font-semibold">{t.audit.colAction}</th>
                <th className="py-3.5 px-5 font-semibold text-right whitespace-nowrap">{t.audit.colRef}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    {t.audit.noRecords}
                  </td>
                </tr>
              ) : (
                displayLogs.map((log, index) => {
                  const isNewest = index === 0 && sortOrder === 'desc';
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isNewest ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Column 1: Timestamp */}
                      <td className="py-3.5 px-5 font-mono text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isNewest && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                              title="Latest Log Entry"
                            />
                          )}
                          <span>{log.timestamp}</span>
                        </div>
                      </td>

                      {/* Column 2: Actor */}
                      <td className="py-3.5 px-5 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[220px]">{log.actor}</span>
                        </div>
                      </td>

                      {/* Column 3: Action & Purpose */}
                      <td className="py-3.5 px-5 text-slate-700 font-normal leading-relaxed">
                        {log.action}
                      </td>

                      {/* Column 4: Event / Consent Ref */}
                      <td className="py-3.5 px-5 font-mono text-amber-700 text-right font-semibold whitespace-nowrap">
                        <span className="bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 whitespace-nowrap inline-block text-[11px]">
                          {log.consentId}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>{t.audit.totalRecorded} {auditLog.length}</span>
          <span className="font-mono text-slate-600">{t.audit.cryptographicChain}</span>
        </div>
      </div>
    </div>
  );
};
