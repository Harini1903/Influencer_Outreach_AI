import React from 'react';
import { useApp } from '../../context/AppContext';
import { PageView } from '../../types';
import {
  LayoutDashboard,
  Compass,
  Megaphone,
  Cpu,
  Mail,
  BarChart3,
  Bot,
  Settings,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { currentView, setCurrentView, backendConnected, influencers, campaigns } = useApp();

  const navItems: { id: PageView; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'discover',
      label: 'Discover Influencers',
      icon: <Compass className="w-4 h-4" />,
      badge: influencers.length > 0 ? influencers.length : undefined,
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: <Megaphone className="w-4 h-4" />,
      badge: campaigns.length > 0 ? campaigns.length : undefined,
    },
    { id: 'matching', label: 'AI Matching', icon: <Cpu className="w-4 h-4" /> },
    { id: 'outreach', label: 'Outreach', icon: <Mail className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'assistant', label: 'AI Assistant', icon: <Bot className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleNavClick = (view: PageView) => {
    setCurrentView(view);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0d121d] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800/80">
          <button
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white font-['Outfit'] block leading-none">
                Influencer<span className="text-purple-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider block mt-1">
                OUTREACH SUITE
              </span>
            </div>
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Backend Connectivity Status banner */}
        <div className="px-4 py-2 border-b border-slate-800/40 bg-slate-900/40">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Render Backend</span>
            <span
              className={`inline-flex items-center gap-1.5 font-medium ${
                backendConnected === true
                  ? 'text-emerald-400'
                  : backendConnected === false
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendConnected === true
                    ? 'bg-emerald-400 ring-2 ring-emerald-500/30'
                    : backendConnected === false
                    ? 'bg-amber-400 ring-2 ring-amber-500/30'
                    : 'bg-slate-500'
                }`}
              />
              {backendConnected === true
                ? 'Online'
                : backendConnected === false
                ? 'Waking up...'
                : 'Checking'}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-purple-600/15 text-purple-200 border border-purple-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`${
                      isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-200'
                    } transition-colors`}
                  >
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Landing Page Link */}
        <div className="px-4 py-2 border-t border-slate-800/60">
          <button
            onClick={() => handleNavClick('landing')}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-purple-300 py-1.5 transition-colors cursor-pointer"
          >
            <span>Landing Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Profile Section at bottom */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#0a0e17]">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/creator_avatar_female_1794287391339.jpg"
              alt="User Profile"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-purple-500/30 shrink-0"
              onError={(e) => {
                // fallback to colored placeholder
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Elena Vance</p>
              <p className="text-[11px] text-slate-400 truncate">Marketing Director</p>
            </div>
            <button
              onClick={() => handleNavClick('settings')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
