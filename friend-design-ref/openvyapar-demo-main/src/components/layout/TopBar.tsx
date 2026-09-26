import { Bell, CheckCircle2, Globe, Shield, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../types';

interface TopBarProps {
  onToggleMobileMenu?: () => void;
}

export const TopBar = ({ onToggleMobileMenu }: TopBarProps) => {
  const { businessId, businessName, consents } = useAppStore();
  const { t, language, setLanguage } = useTranslation();
  const pendingCount = consents.filter((c) => c.status === 'pending').length;

  const languages: { code: Language; label: string }[] = [
    { code: 'EN', label: 'EN' },
    { code: 'HI', label: 'हिन्दी' },
    { code: 'KN', label: 'ಕನ್ನಡ' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Menu Button + Business ID Badge */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 md:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 text-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 shadow-xs">
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">
            {businessId}
          </span>
          <span className="text-slate-500 text-xs hidden sm:inline">|</span>
          <span className="text-xs font-medium text-slate-200 truncate hidden sm:inline max-w-[140px] md:max-w-xs">
            {businessName}
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-0.5 shrink-0" />
        </div>

        <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {t.topbar.liveNode}
        </span>
      </div>

      {/* Right Controls: Language & Notification */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Language Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-1 mr-0.5" />
          <div className="flex gap-0.5">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  language === lang.code
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={lang.label}
              >
                {lang.code}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Bell */}
        <Link
          to="/consents"
          className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
          title={`${pendingCount} ${t.topbar.pendingAlert}`}
        >
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center font-mono ring-2 ring-white">
              {pendingCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};
