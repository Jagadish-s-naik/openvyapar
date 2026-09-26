import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AIAssistantModal } from '../ai/AIAssistantModal';
import { useAppStore } from '../../store/useAppStore';
import { Smartphone, Monitor, Wifi, Signal } from 'lucide-react';

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loadAllData, isMobileSimulator, toggleMobileSimulator } = useAppStore();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Standard Desktop Layout
  if (!isMobileSimulator) {
    return (
      <div className="min-h-screen flex bg-slate-50 text-slate-900">
        {/* Sidebar Navigation */}
        <Sidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
          {/* Persistent Top Bar */}
          <TopBar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

          {/* Page Viewport */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto animate-in fade-in duration-150">
            <Outlet />
          </main>

          {/* Global Floating AI Interface */}
          <AIAssistantModal />
        </div>
      </div>
    );
  }

  // Simulated Android Smartphone Frame (₹7,000 Budget Device PWA)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 select-none relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Simulator Control Floating Pill */}
      <div className="z-20 mb-3 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 shadow-xl max-w-[420px] w-full text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-amber-400 text-slate-950">
            <Smartphone className="w-3.5 h-3.5" />
          </span>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>Android Smartphone Simulator</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono">PWA</span>
            </div>
            <div className="text-[10px] text-slate-400">Simulating ₹7,000 Rural Merchant Phone (390×844)</div>
          </div>
        </div>

        <button
          onClick={toggleMobileSimulator}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-700"
        >
          <Monitor className="w-3 h-3 text-amber-400" />
          <span>Exit</span>
        </button>
      </div>

      {/* Android Device Chassis Frame */}
      <div className="w-full max-w-[400px] h-[860px] max-h-[88vh] bg-slate-900 rounded-[48px] p-2.5 shadow-2xl border-4 border-slate-700 flex flex-col relative overflow-hidden ring-1 ring-white/10 z-10 animate-in zoom-in-95 duration-200">
        {/* Device Top Bezel & Camera */}
        <div className="h-6 w-full flex items-center justify-between px-6 text-slate-400 text-[10px] font-mono shrink-0 select-none">
          <span>10:42</span>
          {/* Camera Punch Hole */}
          <div className="w-3.5 h-3.5 bg-black rounded-full ring-1 ring-slate-700" />
          <div className="flex items-center gap-1 text-[10px]">
            <Signal className="w-3 h-3 text-slate-400" />
            <Wifi className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] font-bold">95%</span>
          </div>
        </div>

        {/* Inner Smartphone Screen Viewport */}
        <div className="flex-1 bg-slate-50 text-slate-900 rounded-[36px] overflow-y-auto overflow-x-hidden relative flex flex-col scroll-smooth shadow-inner border border-slate-200/50">
          {/* Sidebar Drawer inside phone */}
          <Sidebar
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          />

          {/* TopBar inside phone */}
          <TopBar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

          {/* Page Content Viewport */}
          <main className="flex-1 p-3 sm:p-4 w-full mx-auto animate-in fade-in duration-150">
            <Outlet />
          </main>

          {/* Embedded AI Assistant */}
          <AIAssistantModal />
        </div>

        {/* Bottom Android Gesture Pill */}
        <div className="h-4 w-full flex items-center justify-center shrink-0">
          <div className="w-28 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};
