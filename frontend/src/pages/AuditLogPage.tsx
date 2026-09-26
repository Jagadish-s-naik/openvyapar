import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ShieldCheck, Filter, ArrowUpDown, Search } from 'lucide-react';

export const AuditLogPage = () => {
  const { timeline, businessId } = useAppStore();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const displayLogs = useMemo(() => {
    let list = [...timeline];

    if (categoryFilter !== 'all') {
      list = list.filter((a) => a.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          (a.actor?.name && a.actor.name.toLowerCase().includes(q)) ||
          a.actor.id.toLowerCase().includes(q)
      );
    }

    if (sortOrder === 'asc') {
      list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else {
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return list;
  }, [timeline, categoryFilter, sortOrder, searchQuery]);

  const categories = [
    { value: 'all', label: 'All Event Categories' },
    { value: 'delegation', label: 'Delegations & Scopes' },
    { value: 'proof', label: 'Proof Shares' },
    { value: 'credential', label: 'Credential Issuance' },
    { value: 'identity', label: 'Identity & Onboarding' },
    { value: 'agent', label: 'Agent Proposals' },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Immutable Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ACID persisted record of all credential grants, proofs, agent proposals, and human confirmations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-xs"
            title={`Sort: ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by actor, action description, or reference ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-amber-500 shadow-xs"
        />
      </div>

      {/* Primary: 4-Column Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0a1424] text-slate-300 uppercase tracking-wider font-mono text-[11px] border-b border-slate-800">
                <th className="py-3.5 px-5 font-semibold w-44">Timestamp</th>
                <th className="py-3.5 px-5 font-semibold w-60">Actor & Category</th>
                <th className="py-3.5 px-5 font-semibold">Action Description</th>
                <th className="py-3.5 px-5 font-semibold text-right whitespace-nowrap">Audit Log Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                displayLogs.map((log, index) => {
                  const isNewest = index === 0 && sortOrder === 'desc';
                  return (
                    <tr
                      key={log.event_id}
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
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Column 2: Actor & Category */}
                      <td className="py-3.5 px-5 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div className="truncate max-w-[200px]">
                            <div>{log.actor?.name || log.actor?.id}</div>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {log.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Action & Human Confirmation */}
                      <td className="py-3.5 px-5 text-slate-700 font-normal leading-relaxed">
                        <div>{log.title} — {log.description}</div>
                        {log.details && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Log ID */}
                      <td className="py-3.5 px-5 font-mono text-amber-700 text-right font-semibold whitespace-nowrap">
                        <span className="bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 whitespace-nowrap inline-block text-[11px]">
                          {log.event_id.slice(0, 14)}...
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
          <span>Total Recorded Events: {timeline.length}</span>
          <span className="font-mono text-slate-600">ACID SQLite Persistence · {businessId}</span>
        </div>
      </div>
    </div>
  );
};
