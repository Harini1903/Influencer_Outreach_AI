import React from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, Plus, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TopHeaderProps {
  onToggleMobileMenu: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    currentView,
    backendConnected,
    backendError,
    refreshData,
    loadingData,
    setOpenCreateCampaignModal,
  } = useApp();

  const getBreadcrumb = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Overview';
      case 'discover':
        return 'Influencer Discovery';
      case 'campaigns':
        return 'Campaign Management';
      case 'matching':
        return 'AI Match Engine';
      case 'outreach':
        return 'Personalized Outreach';
      case 'analytics':
        return 'Performance Analytics';
      case 'assistant':
        return 'AI Outreach Copilot';
      case 'settings':
        return 'Configuration & API';
      default:
        return 'App';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0b0f17]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
          <span className="text-slate-400 hidden sm:inline">Workspace</span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-white font-semibold">{getBreadcrumb()}</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Status indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs">
          {backendConnected ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Backend Connected</span>
            </span>
          ) : (
            <span
              className="flex items-center gap-1.5 text-amber-400"
              title={backendError || 'Connecting to Render backend...'}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Connecting to Render...</span>
            </span>
          )}
        </div>

        {/* Refresh data button */}
        <button
          onClick={() => refreshData()}
          disabled={loadingData}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors border border-slate-800/60 cursor-pointer disabled:opacity-50"
          title="Refresh Backend Data"
        >
          <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-purple-400' : ''}`} />
        </button>

        {/* Primary CTA: + Create Campaign */}
        <button
          onClick={() => setOpenCreateCampaignModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>
    </header>
  );
};
