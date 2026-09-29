import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  Check,
  Sparkles,
  Lock,
  Plus,
  Clock,
  Briefcase,
  UserCheck,
  KeyRound,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import type { ScopeSuggestResponse } from '@openvyapar/shared';
import * as api from '../api/client';

export const ConsentPage = () => {
  const {
    delegations,
    grantScopedDelegation,
    revokeDelegationToken,
    businessId,
  } = useAppStore();
  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<'active' | 'inbound' | 'grant' | 'history'>('active');
  const [inboundSelectedTask, setInboundSelectedTask] = useState<'gstr3b' | 'gstr1' | 'itc'>('gstr3b');
  const [isInboundExecuting, setIsInboundExecuting] = useState(false);
  const [inboundExecutionLog, setInboundExecutionLog] = useState<{
    success: boolean;
    txId: string;
    message: string;
    timestamp: string;
  } | null>(null);

  // New Delegation Form & AI Scoping State
  const [naturalPrompt, setNaturalPrompt] = useState(
    'I want my CA Vikas Mehta to file my taxes and GST returns'
  );
  const [delegateName, setDelegateName] = useState('Vikas Mehta CA');
  const [delegatePersonId, setDelegatePersonId] = useState('did:person:ca001');

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [scopeSuggestion, setScopeSuggestion] = useState<ScopeSuggestResponse | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['file_returns', 'view_compliance']);

  const [isGranting, setIsGranting] = useState(false);
  const [grantSuccessMsg, setGrantSuccessMsg] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const activeList = delegations.filter((d) => d.status === 'active');
  const historyList = delegations.filter((d) => d.status === 'revoked');

  const samplePrompts = [
    {
      label: 'CA Tax Filing (Beat 4)',
      text: 'I want my CA Vikas Mehta to file my taxes and GST returns',
      name: 'Vikas Mehta CA',
      id: 'did:person:ca001',
    },
    {
      label: 'Staff Order Management',
      text: 'Allow my store staff Priya to manage ONDC catalogue and orders',
      name: 'Priya Sharma (Staff)',
      id: 'did:person:priya001',
    },
    {
      label: 'Auditor View Compliance',
      text: 'Give read-only access to my GST compliance certificates to Auditor Sharma',
      name: 'Auditor Sharma',
      id: 'did:person:auditor001',
    },
  ];

  const handleSuggestScopes = async () => {
    if (!naturalPrompt.trim()) return;
    setIsSuggesting(true);
    setScopeSuggestion(null);

    try {
      const res = await api.suggestScopes({
        business_id: businessId,
        natural_language_prompt: naturalPrompt,
        delegate_info: { name: delegateName },
        language: language.toLowerCase(),
      });

      if (res.success) {
        setScopeSuggestion(res);
        setSelectedScopes(res.proposed_scopes);
      }
    } catch (err) {
      console.error('Scope suggestion error:', err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleToggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleGrantDelegation = async () => {
    if (selectedScopes.length === 0) return;
    setIsGranting(true);
    try {
      await grantScopedDelegation({
        delegatePersonId,
        scopes: selectedScopes,
        agentActionId: scopeSuggestion?.agent_action_id,
      });

      setGrantSuccessMsg(`${t.consent.grantSuccess} (${delegateName})`);
      setTimeout(() => {
        setGrantSuccessMsg(null);
        setActiveTab('active');
      }, 1500);
    } catch (err: unknown) {
      console.error('Grant delegation error:', err);
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevoke = async (tokenId: string) => {
    setRevokingId(tokenId);
    try {
      await revokeDelegationToken(tokenId);
    } catch (err) {
      console.error('Revoke error:', err);
    } finally {
      setRevokingId(null);
    }
  };

  const handleExecuteInboundAction = async () => {
    setIsInboundExecuting(true);
    setInboundExecutionLog(null);

    // Simulated cryptographic delegated task execution
    setTimeout(() => {
      setIsInboundExecuting(false);
      const txHash = '0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 6);
      const taskNames = {
        gstr3b: t.consent.taskGstr3b,
        gstr1: t.consent.taskGstr1,
        itc: t.consent.taskItc,
      };
      setInboundExecutionLog({
        success: true,
        txId: txHash,
        message: `${taskNames[inboundSelectedTask]} signed and submitted successfully under delegation token did:token:del-001. Master password and bank credentials remained 100% hidden.`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 1200);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.consent.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.consent.subtitle}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('grant')}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.consent.grantTab}</span>
        </button>
      </div>

      {/* Clean 4-Tab Navigation Bar */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 text-xs sm:text-sm font-medium overflow-x-auto whitespace-nowrap pb-px no-scrollbar touch-scroll">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-1 relative flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'active'
              ? 'text-amber-900 font-bold border-b-2 border-amber-500'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>{t.consent.activeTab}</span>
          <span className="px-2 py-0.5 text-xs bg-amber-400 text-slate-950 font-bold rounded-full font-mono">
            {activeList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('inbound')}
          className={`pb-3 px-1 relative flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'inbound'
              ? 'text-amber-900 font-bold border-b-2 border-amber-500'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>{t.consent.inboundTab}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>

        <button
          onClick={() => setActiveTab('grant')}
          className={`pb-3 px-1 relative flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'grant'
              ? 'text-amber-900 font-bold border-b-2 border-amber-500'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{t.consent.grantTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-1 relative flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'history'
              ? 'text-amber-900 font-bold border-b-2 border-amber-500'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>{t.consent.historyTab} ({historyList.length})</span>
        </button>
      </div>


      {/* Tab Panels */}
      <div className="space-y-4">
        {/* TAB 1: GRANTED DELEGATIONS (ACTIVE LIST) */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="font-semibold text-slate-900 text-base">{t.consent.noActive}</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t.consent.noActiveDesc}
                </p>
                <button
                  onClick={() => setActiveTab('grant')}
                  className="mt-2 px-4 py-2 bg-amber-400 font-bold text-slate-950 text-xs rounded-xl hover:bg-amber-300 transition-all cursor-pointer"
                >
                  {t.consent.grantTab}
                </button>
              </div>
            ) : (
              activeList.map((token) => (
                <div
                  key={token.token_id}
                  className="bg-white rounded-2xl border-2 border-amber-400/80 p-5 sm:p-6 shadow-xs space-y-4 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-900 font-semibold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                          {t.consent.statusActive}
                        </span>
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t.common.active}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-1 font-display">
                        {t.consent.delegateTo}: {token.delegate_person_id}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t.consent.createdDate}: {new Date(token.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <span className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
                      {t.consent.scopesGranted}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {token.scopes.map((scope: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-amber-50 text-amber-900 font-medium rounded-lg text-xs border border-amber-200/80 font-mono"
                        >
                          ✓ {scope}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Revoke Action Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      Token ID: {token.token_id}
                    </span>

                    <button
                      onClick={() => handleRevoke(token.token_id)}
                      disabled={revokingId === token.token_id}
                      className="px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>
                        {revokingId === token.token_id ? t.consent.revoking : t.consent.revokeBtn}
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: INBOUND WORK DESK (EMPLOYEE / CA VIEW) */}
        {activeTab === 'inbound' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Executive Status Header */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 md:p-7 border border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        {t.consent.inboundDeskTitle}
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        SESSION ACTIVE
                      </span>
                    </div>
                    <h2 className="text-base sm:text-xl font-bold font-display text-white mt-0.5">
                      Vikas Mehta, CA <span className="text-slate-400 font-normal text-xs sm:text-sm font-sans block xs:inline">(Chartered Accountant)</span>
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-slate-400 self-start sm:self-auto bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>TTL: 23h 48m remaining</span>
                </div>
              </div>

              {/* Target Enterprise Metadata Line */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Enterprise Principal</span>
                  <span className="text-white font-semibold mt-0.5 block font-display">Sharma General Store</span>
                  <span className="text-amber-400/90 font-mono text-[11px] truncate block">did:biz:sharma001</span>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Active Token ID</span>
                  <span className="text-white font-semibold mt-0.5 block font-mono text-xs truncate">did:token:del-001</span>
                  <span className="text-emerald-400 font-mono text-[11px] block">Ed25519 Verified</span>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Zero-Password Protocol</span>
                  <span className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> No Password Needed
                  </span>
                  <span className="text-slate-400 text-[11px] block">Least-Privilege Cryptography</span>
                </div>
              </div>
            </div>

            {/* 3 Structured Boundary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Card 1: Permitted Scopes */}
              <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <UserCheck className="w-4 h-4" />
                  <span>{t.consent.proposedScopesHeader}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 font-medium">
                    <div className="font-mono font-bold text-[11px] text-emerald-800">✓ file_returns</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">GST & Tax filing submission allowed</div>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 font-medium">
                    <div className="font-mono font-bold text-[11px] text-emerald-800">✓ view_compliance</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">Tax compliance certificates & proofs</div>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 font-medium">
                    <div className="font-mono font-bold text-[11px] text-emerald-800">✓ max_invoice: ₹50,000</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">Safety ceiling on invoice generation</div>
                  </div>
                </div>
              </div>

              {/* Card 2: Cryptographic Guardrails */}
              <div className="bg-white rounded-2xl border-2 border-red-500/30 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{t.consent.excludedScopesHeader}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 text-red-900 font-medium">
                    <div className="font-mono font-bold text-[11px] text-red-800">🛑 apply_loans</div>
                    <div className="text-[11px] text-red-700 mt-0.5">OCEN Lending & Credit access denied</div>
                  </div>
                  <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 text-red-900 font-medium">
                    <div className="font-mono font-bold text-[11px] text-red-800">🛑 view_bank_statements</div>
                    <div className="text-[11px] text-red-700 mt-0.5">Bank ledger & balances 100% hidden</div>
                  </div>
                  <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 text-red-900 font-medium">
                    <div className="font-mono font-bold text-[11px] text-red-800">🛑 export_private_keys</div>
                    <div className="text-[11px] text-red-700 mt-0.5">Owner key pair immutable & locked</div>
                  </div>
                </div>
              </div>

              {/* Card 3: Cryptographic Proof */}
              <div className="bg-white rounded-2xl border-2 border-indigo-500/30 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <KeyRound className="w-4 h-4" />
                  <span>Security & Proof Details</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-indigo-900 uppercase font-mono font-semibold block">Issuer Identity</span>
                    <span className="font-mono text-[11px] text-slate-800 truncate block">did:biz:sharma001</span>
                  </div>
                  <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-indigo-900 uppercase font-mono font-semibold block">Verification Method</span>
                    <span className="font-mono text-[11px] text-slate-800 block">HMAC-SHA256 / Ed25519</span>
                  </div>
                  <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-indigo-900 uppercase font-mono font-semibold block">Revocation Heartbeat</span>
                    <span className="font-mono text-[11px] text-emerald-700 font-semibold block">Active · 3s Polling</span>
                  </div>
                </div>
              </div>
            </div>


            {/* Interactive Execution Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-7 shadow-xs space-y-4 sm:space-y-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-900 font-mono">
                  <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Authorized Execution Console</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold font-display text-slate-900">
                  {t.consent.selectDelegatedTask}
                </h3>
                <p className="text-xs text-slate-500">
                  {t.consent.inboundDeskSubtitle}
                </p>
              </div>

              {/* Task Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setInboundSelectedTask('gstr3b')}
                  className={`p-3.5 sm:p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    inboundSelectedTask === 'gstr3b'
                      ? 'bg-amber-50/80 border-amber-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{t.consent.taskGstr3b}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Monthly tax return liability for Q3 FY2025-26.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setInboundSelectedTask('gstr1')}
                  className={`p-3.5 sm:p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    inboundSelectedTask === 'gstr1'
                      ? 'bg-amber-50/80 border-amber-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{t.consent.taskGstr1}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Outward B2B and B2C supply statement.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setInboundSelectedTask('itc')}
                  className={`p-3.5 sm:p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    inboundSelectedTask === 'itc'
                      ? 'bg-amber-50/80 border-amber-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{t.consent.taskItc}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Auto-reconcile supplier input credits.
                  </p>
                </button>
              </div>

              {/* Execution Feedback / Banner */}
              {inboundExecutionLog && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1.5 animate-in fade-in">
                  <div className="flex flex-wrap items-center gap-2 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.consent.executionSuccessTitle}</span>
                    <span className="ml-auto text-[10px] font-mono text-emerald-700">{inboundExecutionLog.timestamp}</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {inboundExecutionLog.message}
                  </p>
                  <div className="text-[11px] font-mono text-emerald-700 pt-1 truncate">
                    Tx ID: {inboundExecutionLog.txId} · Signed by: did:person:ca001
                  </div>
                </div>
              )}

              {/* Action Trigger Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{t.common.guardrail1Notice}</span>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteInboundAction}
                  disabled={isInboundExecuting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{isInboundExecuting ? t.consent.executingTask : t.consent.executeTaskBtn}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI DELEGATION BUILDER TAB (Beat 4) */}
        {activeTab === 'grant' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-xs space-y-5 sm:space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-900 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.consent.aiBuilderTitle}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900">
                {t.consent.aiBuilderTitle}
              </h2>
              <p className="text-xs text-slate-500">
                {t.consent.aiBuilderSubtitle}
              </p>
            </div>

            {grantSuccessMsg && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{grantSuccessMsg}</span>
              </div>
            )}

            {/* Sample Chips */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
                {t.consent.sampleIntentsLabel}
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setNaturalPrompt(p.text);
                      setDelegateName(p.name);
                      setDelegatePersonId(p.id);
                      setScopeSuggestion(null);
                    }}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded-lg text-xs text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">{t.consent.delegateNameLabel}</label>
                  <input
                    type="text"
                    value={delegateName}
                    onChange={(e) => setDelegateName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 text-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">{t.consent.delegateIdLabel}</label>
                  <input
                    type="text"
                    value={delegatePersonId}
                    onChange={(e) => setDelegatePersonId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-amber-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">
                  {t.consent.naturalIntentLabel}
                </label>
                <textarea
                  rows={2}
                  value={naturalPrompt}
                  onChange={(e) => setNaturalPrompt(e.target.value)}
                  placeholder={t.consent.naturalIntentPlaceholder}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 text-xs text-slate-900"
                />
              </div>

              <button
                onClick={handleSuggestScopes}
                disabled={isSuggesting || !naturalPrompt.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isSuggesting ? t.consent.analyzingScopes : t.consent.suggestScopesBtn}</span>
              </button>
            </div>


            {/* AI Scoping Proposal Result */}
            {scopeSuggestion && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-4 animate-in fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>{t.consent.proposedScopesHeader}</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {scopeSuggestion.explanation}
                    </p>
                  </div>
                </div>

                {/* Scopes checklist */}
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                    {t.consent.proposedScopesHeader}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {['file_returns', 'view_compliance', 'manage_catalogue', 'view_bank_statements', 'apply_loans'].map((scope) => {
                      const isChecked = selectedScopes.includes(scope);
                      const isHighRisk = scope === 'view_bank_statements' || scope === 'apply_loans';
                      return (
                        <label
                          key={scope}
                          className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-amber-500/20 border-amber-500/50 text-white'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleScope(scope)}
                              className="rounded text-amber-500 focus:ring-amber-500 shrink-0"
                            />
                            <span className="font-mono text-xs truncate">{scope}</span>
                          </div>
                          {isHighRisk && (
                            <span className="text-[10px] text-red-400 font-bold bg-red-950 px-1.5 py-0.5 rounded border border-red-800 shrink-0">
                              HIGH RISK
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Explicit Guardrail Callout */}
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-start sm:items-center gap-2 text-[11px] text-amber-300">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    {t.consent.guardrailNotice}
                  </span>
                </div>

                {/* Confirm Grant Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleGrantDelegation}
                    disabled={isGranting || selectedScopes.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isGranting ? t.consent.grantingDelegation : t.consent.confirmGrantBtn}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="divide-y divide-slate-200 bg-white rounded-2xl border border-slate-200 shadow-xs">
            {historyList.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-xs text-slate-500">
                {t.consent.noHistory}
              </div>
            ) : (
              historyList.map((token) => (
                <div
                  key={token.token_id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm truncate">
                        {token.delegate_person_id}
                      </span>
                      <span className="font-semibold uppercase tracking-wider px-2 py-0.5 rounded font-mono text-[10px] bg-red-100 text-red-800 border border-red-200">
                        {token.status}
                      </span>
                    </div>
                    <div className="text-slate-600 font-mono break-all">
                      Scopes: {token.scopes.join(', ')}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Token ID: {token.token_id} · {t.common.revoked}
                    </div>
                  </div>

                  <div className="text-slate-400 font-mono text-[11px] sm:text-right shrink-0">
                    Cryptographic access invalidated
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
