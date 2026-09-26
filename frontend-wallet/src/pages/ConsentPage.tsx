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
  const { language } = useTranslation();

  const [activeTab, setActiveTab] = useState<'active' | 'grant' | 'history'>('active');

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

      setGrantSuccessMsg(`Successfully granted scoped access to ${delegateName}!`);
      setTimeout(() => {
        setGrantSuccessMsg(null);
        setActiveTab('active');
      }, 1500);
    } catch (err: any) {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Scoped Access & Delegations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Grant least-privilege, revocable permissions to accountants and staff without sharing passwords.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('grant')}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Scoped Delegation (Beat 4)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-xs sm:text-sm font-medium overflow-x-auto whitespace-nowrap pb-px">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 relative flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'active'
              ? 'text-amber-800 font-bold border-b-2 border-amber-500'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Active Delegations</span>
          <span className="px-2 py-0.5 text-xs bg-amber-500 text-slate-950 font-bold rounded-full font-mono">
            {activeList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('grant')}
          className={`pb-3 relative flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'grant'
              ? 'text-amber-800 font-bold border-b-2 border-amber-500'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>AI Delegation Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 relative flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'history'
              ? 'text-amber-800 font-bold border-b-2 border-amber-500'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Revoked History ({historyList.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-4">
        {/* ACTIVE DELEGATIONS TAB */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="font-semibold text-slate-900 text-base">No Active Delegations</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All systems operating under direct owner control. Use the AI builder to delegate tasks.
                </p>
                <button
                  onClick={() => setActiveTab('grant')}
                  className="mt-2 px-4 py-2 bg-amber-400 font-bold text-slate-950 text-xs rounded-xl hover:bg-amber-300 transition-all cursor-pointer"
                >
                  Create CA Delegation
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
                          SCOPED DELEGATION TOKEN
                        </span>
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-1 font-display">
                        Delegate: {token.delegate_person_id}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Issued: {new Date(token.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <span className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
                      Authorized Scopes
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {token.scopes.map((scope, idx) => (
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
                        {revokingId === token.token_id ? 'Revoking Access...' : 'Revoke Delegation Instantly'}
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* AI DELEGATION BUILDER TAB (Beat 4) */}
        {activeTab === 'grant' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-900 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Beat 4: Scoped AI Delegation with Least-Privilege
              </div>
              <h2 className="text-xl font-bold font-display text-slate-900">
                Grant Task-Specific Permissions
              </h2>
              <p className="text-xs text-slate-500">
                Describe the role or task in plain language. The AI agent will propose minimal scopes and block banking/loan access.
              </p>
            </div>

            {grantSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{grantSuccessMsg}</span>
              </div>
            )}

            {/* Sample Chips */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
                Quick Demo Presets
              </span>
              <div className="flex flex-wrap gap-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Delegate Name / Role</label>
                  <input
                    type="text"
                    value={delegateName}
                    onChange={(e) => setDelegateName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Delegate Person DID</label>
                  <input
                    type="text"
                    value={delegatePersonId}
                    onChange={(e) => setDelegatePersonId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">
                  Natural Language Intent (Hindi, Kannada, or English)
                </label>
                <textarea
                  rows={2}
                  value={naturalPrompt}
                  onChange={(e) => setNaturalPrompt(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <button
                onClick={handleSuggestScopes}
                disabled={isSuggesting || !naturalPrompt.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isSuggesting ? 'Analyzing Intent...' : '🤖 AI: Propose Minimal Scopes'}</span>
              </button>
            </div>

            {/* AI Scoping Proposal Result */}
            {scopeSuggestion && (
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 animate-in fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Least-Privilege Scoping Recommendation
                    </div>
                    <p className="text-xs text-slate-200">
                      {scopeSuggestion.explanation}
                    </p>
                  </div>
                </div>

                {/* Scopes checklist */}
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                    Proposed Minimal Scopes
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
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleScope(scope)}
                              className="rounded text-amber-500 focus:ring-amber-500"
                            />
                            <span className="font-mono text-xs">{scope}</span>
                          </div>
                          {isHighRisk && (
                            <span className="text-[10px] text-red-400 font-bold bg-red-950 px-1.5 py-0.5 rounded border border-red-800">
                              HIGH RISK
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Explicit Guardrail Callout */}
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center gap-2 text-[11px] text-amber-300">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Least-Privilege Protection:</strong> Bank account statements and loan permissions are excluded.
                  </span>
                </div>

                {/* Confirm Grant Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleGrantDelegation}
                    disabled={isGranting || selectedScopes.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isGranting ? 'Signing Token...' : 'Confirm & Grant Delegation'}</span>
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
              <div className="p-12 text-center text-xs text-slate-500">
                No revoked or expired delegation records.
              </div>
            ) : (
              historyList.map((token) => (
                <div
                  key={token.token_id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {token.delegate_person_id}
                      </span>
                      <span className="font-semibold uppercase tracking-wider px-2 py-0.5 rounded font-mono text-[10px] bg-red-100 text-red-800 border border-red-200">
                        {token.status}
                      </span>
                    </div>
                    <div className="text-slate-600 font-mono">
                      Scopes: {token.scopes.join(', ')}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Token ID: {token.token_id} · Revoked
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
