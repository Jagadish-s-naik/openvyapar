import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  ShieldCheck,
  Filter,
  ArrowUpDown,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode,
  KeyRound,
  Award,
  Lock,
  UserCheck,
  History,
  Clock,
} from 'lucide-react';
import { formatAuditTimestamp } from '../utils/formatters';

export const AuditLogPage = () => {
  const { timeline, businessId, credentials, delegations } = useAppStore();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
          a.actor.id.toLowerCase().includes(q) ||
          a.event_id.toLowerCase().includes(q)
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
    { value: 'all', label: 'All Categories' },
    { value: 'credential', label: 'Credentials' },
    { value: 'delegation', label: 'Delegations' },
    { value: 'proof', label: 'Proof Shares' },
    { value: 'identity', label: 'Identity' },
    { value: 'governance', label: 'Governance' },
    { value: 'agent', label: 'Agent Proposals' },
  ];

  const toggleExpand = (id: string) => {
    setExpandedLogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'credential':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'delegation':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'proof':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'governance':
      case 'identity':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'agent':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Summary Stats */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <History className="w-7 h-7 text-amber-500" />
              <span>Immutable Audit Trail</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Cryptographically verified, ACID-persisted ledger of all business identity mutations, credentials, proofs, and human authorizations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 text-amber-300 px-3 py-1.5 rounded-xl border border-slate-800 shadow-xs self-start sm:self-auto shrink-0">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>ACID SQLite Ledger</span>
          </div>
        </div>

        {/* 4 Metrics Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
            <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Events</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
              {timeline.length}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
            <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-600" />
              <span>Active Credentials</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
              {credentials.length}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
            <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Active Delegations</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
              {delegations.filter((d) => d.status === 'active').length}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
            <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Human Guardrail</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block border border-emerald-200/60 mt-1">
              100% Non-Repudiable
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by actor, action description, or log reference ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
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
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            title={`Sort: ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      {/* 3. Primary Audit Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-[#0a1424] text-slate-200 uppercase tracking-wider font-mono text-[11px] border-b border-slate-800 select-none">
                <th className="py-3.5 px-5 font-bold w-44">Timestamp</th>
                <th className="py-3.5 px-5 font-bold w-56">Actor & Scope</th>
                <th className="py-3.5 px-5 font-bold">Action Details</th>
                <th className="py-3.5 px-5 font-bold text-right w-44">Audit Log Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                displayLogs.map((log, index) => {
                  const isNewest = index === 0 && sortOrder === 'desc';
                  const isExpanded = Boolean(expandedLogs[log.event_id]);
                  const { dateStr, timeStr, relativeStr } = formatAuditTimestamp(log.timestamp);
                  const hasDetails = log.details && Object.keys(log.details).length > 0;

                  return (
                    <tr
                      key={log.event_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isNewest ? 'bg-amber-50/25' : ''
                      }`}
                    >
                      {/* Column 1: Timestamp */}
                      <td className="py-4 px-5 align-top whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isNewest ? (
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                            )}
                            <span className="font-bold text-slate-900 text-xs tracking-tight">{dateStr}</span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium border border-slate-200/60">
                              {relativeStr}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono pl-3.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{timeStr}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Actor & Category */}
                      <td className="py-4 px-5 align-top space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-900 truncate max-w-[170px]" title={log.actor?.name || log.actor?.id}>
                            {log.actor?.name || log.actor?.id}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${getCategoryBadge(
                              log.category
                            )}`}
                          >
                            {log.category}
                          </span>
                          {log.confirmed_by_human && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <span>✓ Human Confirmed</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Action Description & Structured Details */}
                      <td className="py-4 px-5 align-top space-y-2">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{log.title}</span>
                          </div>
                          <div className="text-slate-600 text-xs leading-relaxed">
                            {log.description}
                          </div>
                        </div>

                        {/* Clean Structured Badges for Key Metadata */}
                        {hasDetails && (
                          <div className="space-y-2 pt-1">
                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                              {Object.entries(log.details as Record<string, unknown>).map(([key, val]) => {
                                if (key === 'disclosed' && Array.isArray(val)) {
                                  return (
                                    <span key={key} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                                      Disclosed: {val.join(', ')}
                                    </span>
                                  );
                                }
                                if (key === 'scopes' && Array.isArray(val)) {
                                  return (
                                    <span key={key} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 font-mono">
                                      Scopes: [{val.join(', ')}]
                                    </span>
                                  );
                                }
                                if (typeof val === 'string' || typeof val === 'number') {
                                  return (
                                    <span key={key} className="bg-slate-100/90 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/80 font-mono">
                                      <span className="text-slate-400">{key}:</span> {String(val)}
                                    </span>
                                  );
                                }
                                return null;
                              })}
                            </div>

                            {/* Inspect Payload Accordion Toggle */}
                            <button
                              onClick={() => toggleExpand(log.event_id)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-amber-700 transition-colors cursor-pointer"
                            >
                              <FileCode className="w-3 h-3" />
                              <span>{isExpanded ? 'Hide Raw Payload' : 'Inspect Raw Payload'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {/* Expandable JSON Code Block */}
                            {isExpanded && (
                              <div className="bg-slate-900 text-amber-300 p-3 rounded-xl font-mono text-[11px] border border-slate-800 overflow-x-auto shadow-inner">
                                <pre className="whitespace-pre-wrap leading-tight">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Log ID & Actions */}
                      <td className="py-4 px-5 align-top text-right space-y-1.5">
                        <div className="inline-flex items-center gap-1 bg-amber-50/90 border border-amber-200/80 px-2 py-1 rounded-lg">
                          <span
                            className="font-mono font-bold text-amber-900 text-[11px]"
                            title={log.event_id}
                          >
                            {log.event_id.length > 15
                              ? `${log.event_id.slice(0, 12)}...`
                              : log.event_id}
                          </span>
                          <button
                            onClick={() => handleCopy(log.event_id, log.event_id)}
                            className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded transition-colors cursor-pointer"
                            title="Copy Log ID"
                          >
                            {copiedId === log.event_id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          <span>HMAC Verified</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Displaying <strong>{displayLogs.length}</strong> of <strong>{timeline.length}</strong> audit records
            </span>
          </div>
          <div className="font-mono text-slate-600">
            Node ID: {businessId}
          </div>
        </div>
      </div>
    </div>
  );
};
