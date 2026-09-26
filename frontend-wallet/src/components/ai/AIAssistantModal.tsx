import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ArrowRight, CornerDownLeft, CheckCircle2, Bot } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import * as api from '../../api/client';

export const AIAssistantModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [handoffTarget, setHandoffTarget] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);

  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { businessId, credentials, delegations } = useAppStore();

  const suggestedPrompts = [
    {
      label: 'Grant Scoped CA Access (Beat 4)',
      targetPath: '/consents',
      targetName: 'Delegation Builder',
      description: 'Propose minimal scopes for CA Vikas Mehta without banking access',
    },
    {
      label: 'Generate Selective Loan Proof (Beat 3)',
      targetPath: '/credentials',
      targetName: 'Verifiable Credentials',
      description: 'Disclose GST & ONDC track record while withholding bank statements',
    },
    {
      label: 'Inspect Generational Succession (Beat 5)',
      targetPath: '/identity',
      targetName: 'Business Identity & QR',
      description: 'Transfer ownership to Priya Sharma with unbroken DID continuity',
    },
    {
      label: 'View Immutable Audit Timeline',
      targetPath: '/audit',
      targetName: 'Audit Trail',
      description: 'Cryptographic ledger of all verified actions and agent proposals',
    },
  ];

  const executeHandoff = (path: string, targetName: string) => {
    setHandoffTarget(targetName);
    setTimeout(() => {
      setHandoffTarget(null);
      setIsOpen(false);
      navigate(path);
    }, 400);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    setIsAsking(true);
    setAssistantReply(null);

    try {
      const res = await api.askAssistant({
        message: query,
        language: language.toLowerCase(),
        context: {
          business_id: businessId,
          active_credentials: credentials.length,
          active_delegations: delegations.filter((d) => d.status === 'active').length,
        },
      });

      if (res.success) {
        setAssistantReply(res.answer);
        if (res.suggested_action?.route) {
          executeHandoff(res.suggested_action.route, res.suggested_action.label || 'Destination');
        }
      }
    } catch {
      // Fallback to keyword matching if agent is unreachable
      const lower = query.toLowerCase();
      if (lower.includes('consent') || lower.includes('delegat') || lower.includes('ca')) {
        executeHandoff('/consents', 'Delegations');
      } else if (lower.includes('proof') || lower.includes('loan') || lower.includes('cred')) {
        executeHandoff('/credentials', 'Credentials');
      } else if (lower.includes('succession') || lower.includes('owner') || lower.includes('priya')) {
        executeHandoff('/identity', 'Identity');
      } else {
        executeHandoff('/audit', 'Audit Log');
      }
    } finally {
      setIsAsking(false);
      setInputValue('');
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center p-3 sm:px-4 sm:py-3 sm:gap-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-full shadow-xl border border-amber-500/40 hover:border-amber-400 transition-all group cursor-pointer"
          title={t.ai.buttonLabel}
          aria-label={t.ai.buttonLabel}
        >
          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-slate-100 hidden sm:inline">
            OpenVyapar AI Assistant
          </span>
        </button>
      </div>

      {/* Slide-in Overlay Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-6 bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[88vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Panel Header */}
            <div className="p-4 bg-[#0a1424] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">OpenVyapar AI Assistant</h2>
                  <p className="text-[11px] text-slate-400">DPI Navigation & Plain Language Explanations</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close AI panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Handoff Status Notice */}
            {handoffTarget && (
              <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center gap-2 text-xs font-medium text-amber-900 animate-in fade-in shrink-0">
                <CheckCircle2 className="w-4 h-4 text-amber-700 animate-spin shrink-0" />
                <span>Navigating to {handoffTarget}...</span>
              </div>
            )}

            {/* Content Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <form onSubmit={handleCustomSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Ask anything (e.g. How do I delegate tax filing?)..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isAsking}
                  className="absolute right-2 top-2 p-1 text-slate-500 hover:text-slate-900 cursor-pointer disabled:opacity-50"
                  aria-label="Submit query"
                >
                  <CornerDownLeft className="w-4 h-4" />
                </button>
              </form>

              {assistantReply && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <Sparkles className="w-3.5 h-3.5" /> AI Response:
                  </div>
                  <p className="leading-relaxed">{assistantReply}</p>
                </div>
              )}

              {/* Suggested Handoff Prompts */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Quick Demo Flows
                </div>
                <div className="space-y-1.5">
                  {suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => executeHandoff(p.targetPath, p.targetName)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200/90 hover:border-amber-500/60 hover:bg-amber-50/40 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-slate-800 group-hover:text-amber-900">
                          {p.label}
                        </div>
                        <div className="text-[11px] text-slate-500">{p.description}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Architectural Discipline Note Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Guardrail 1: Propose only; human confirms</span>
              <span className="font-mono text-slate-600 font-semibold">Zero Custody</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
