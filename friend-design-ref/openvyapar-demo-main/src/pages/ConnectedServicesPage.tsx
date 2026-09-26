import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import { Plus, CheckCircle2, ShieldCheck, X, ArrowRight, Radio } from 'lucide-react';

export const ConnectedServicesPage = () => {
  const { connectedServices, connectService } = useAppStore();
  const { t } = useTranslation();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Public Scheme / Portal');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['GST Compliance Credential']);

  const availableScopes = [
    'GST Compliance Credential',
    'Udyam MSME Registration Certificate',
    'PAN Entity Verification',
    'Bank Account Aggregator Financial Summary',
  ];

  const handleToggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      if (selectedScopes.length > 1) {
        setSelectedScopes(selectedScopes.filter((s) => s !== scope));
      }
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleCreateConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    connectService({
      name: serviceName.trim(),
      category: selectedCategory,
      accessScope: selectedScopes,
      accentColor: '#6366f1',
    });

    setServiceName('');
    setShowConnectModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.services.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.services.subtitle}
          </p>
        </div>

        {/* Secondary: Connect a new service action (visually quieter than existing cards) */}
        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/90 rounded-xl transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500" />
          <span>{t.services.authorizeNewNode}</span>
        </button>
      </div>

      {/* Primary: 2–3 Service Cards with Distinct Accents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {connectedServices.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between overflow-hidden hover:border-slate-300 transition-all group"
          >
            {/* Top Accent Stripe - Unique Per Service Context */}
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: service.accentColor }}
            />

            <div className="p-6 space-y-4 flex-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
                    {service.category || 'External Participant'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    {t.services.interoperating}
                  </span>
                </div>
                <h2 className="font-display text-lg font-bold text-slate-900 leading-snug">
                  {service.name}
                </h2>
              </div>

              {/* Plain Language Access Statement */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {t.services.activeAccessScope}
                </div>
                <ul className="space-y-1.5 text-slate-700">
                  {service.accessScope.map((scope, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-tight">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{t.services.canView} {scope}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>{t.services.since} {service.connectedSince}</span>
              <span className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {t.services.zeroCustody}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Authorize New External DPI Node Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-600 shrink-0" />
                <h3 className="font-display text-base font-bold text-slate-900">
                  {t.services.modalTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateConnection} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">
                  {t.services.entityNameLabel}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.services.entityNamePlaceholder}
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white text-slate-900 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">
                  {t.services.categoryLabel}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 text-slate-900 text-xs cursor-pointer"
                >
                  <option value="Institutional Lender">Institutional Lender (Credit)</option>
                  <option value="Digital Commerce Network">Digital Commerce Network (ONDC / GeM)</option>
                  <option value="Government Scheme / Subsidy">Government Scheme / Subsidy</option>
                  <option value="Tax & Compliance Gateway">Tax & Compliance Gateway</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-slate-800">
                  {t.services.scopeLabel}
                </label>
                <div className="space-y-1.5">
                  {availableScopes.map((scope) => (
                    <label
                      key={scope}
                      className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/70"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope)}
                        onChange={() => handleToggleScope(scope)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-slate-700">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {t.services.cancel}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <span>{t.services.authorizeAndConnect}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
