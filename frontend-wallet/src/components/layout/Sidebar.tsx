import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Fingerprint,
  Award,
  KeyRound,
  History,
  Radio,
  Settings,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import { OpenVyaparLogo } from '../ui/OpenVyaparLogo';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const delegations = useAppStore((state) => state.delegations);
  const activeCount = delegations.filter((d) => d.status === 'active').length;
  const { t } = useTranslation();

  const navItems = [
    { name: t.nav.dashboard, path: '/', icon: LayoutDashboard },
    { name: t.nav.identity, path: '/identity', icon: Fingerprint },
    { name: t.nav.credentials, path: '/credentials', icon: Award },
    { name: t.nav.consent, path: '/consents', icon: KeyRound, badgeKey: 'consents' },
    { name: t.nav.audit, path: '/audit', icon: History },
    { name: t.nav.connected, path: '/services', icon: Radio },
    { name: t.nav.settings, path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0a1424] text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 min-h-screen transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <OpenVyaparLogo variant="full" size={38} theme="dark" />

          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg md:hidden cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t.nav.coreRegistry}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const showBadge = item.badgeKey === 'consents' && activeCount > 0;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
                  <span>{item.name}</span>
                </div>
                {showBadge && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500 text-slate-950 rounded-full font-mono">
                    {activeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Infrastructure Stamp */}
        <div className="p-4 border-t border-slate-800/80 bg-[#08101e]">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t.nav.liveDpiNode} · v1.4</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {t.nav.cryptoVerified}
          </div>
        </div>
      </aside>
    </>
  );
};
