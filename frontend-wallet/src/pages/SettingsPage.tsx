import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import type { Language } from '../types';
import { Globe, Shield, Check } from 'lucide-react';

export const SettingsPage = () => {
  const { language, setLanguage, businessId } = useAppStore();
  const { t } = useTranslation();

  const languageOptions: { code: Language; name: string; nativeName: string; note: string }[] = [
    { code: 'EN', name: 'English', nativeName: 'English', note: 'Standard official terminology' },
    { code: 'HI', name: 'Hindi', nativeName: 'हिन्दी', note: 'व्यापार पहचान एवं सहमति प्रणाली' },
    { code: 'KN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', note: 'ವ್ಯಾಪಾರ ಗುರುತು ಮತ್ತು ಸಮ್ಮತಿ ವ್ಯವಸ್ಥೆ' },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.settings.title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Primary: Language Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
          <Globe className="w-4 h-4 text-amber-600" />
          <span>{t.settings.interfaceLanguage}</span>
        </div>
        <p className="text-xs text-slate-500">
          {t.settings.languageDesc}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {languageOptions.map((opt) => (
            <button
              key={opt.code}
              onClick={() => setLanguage(opt.code)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                language === opt.code
                  ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{opt.name}</span>
                  {language === opt.code && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="text-sm font-display font-medium text-slate-700">{opt.nativeName}</div>
              </div>
              <div className="text-[11px] text-slate-500 mt-3">{opt.note}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Node Details (Read-only plumbing info) */}
      <div className="bg-slate-900 text-slate-300 rounded-xl p-6 space-y-3 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 font-mono text-amber-400 font-semibold uppercase tracking-wider text-[11px]">
          <Shield className="w-3.5 h-3.5" />
          {t.settings.nodeDetailsTitle}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400 font-mono">
          <div>
            <span className="text-slate-400">{t.settings.nodeId}</span>{' '}
            <span className="text-white font-semibold">{businessId}.node.openvyapar.in</span>
          </div>
          <div>
            <span className="text-slate-400">{t.settings.protocolSpec}</span>{' '}
            <span className="text-white font-semibold">Beckn/DPI-MSME v1.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};
