import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0b0f17]/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <div
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-['Outfit']">
            Influencer<span className="text-purple-400">Outreach</span>
          </span>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#discovery" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
            Discovery
          </a>
          <a href="#matching" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
            AI Matching
          </a>
          <a href="#outreach" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
            Outreach
          </a>
          <a href="#analytics" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
            Analytics
          </a>
          <a href="#preview" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
            Platform
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg shadow-md shadow-purple-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Launch Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
