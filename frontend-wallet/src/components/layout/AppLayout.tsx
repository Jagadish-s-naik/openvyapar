import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AIAssistantModal } from '../ai/AIAssistantModal';

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
};
