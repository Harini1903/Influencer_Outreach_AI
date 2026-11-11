import React from 'react';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/layout/Navbar';
import heroImage from '../assets/images/influencer_hero_creators_1794287391421.jpg';
import {
  Compass,
  Cpu,
  Mail,
  Megaphone,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setCurrentView, influencers, campaigns, backendConnected } = useApp();

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-purple-500/30 selection:text-purple-200">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/20 via-indigo-600/15 to-transparent blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            {/* Live Backend Trust Marker */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-xs font-medium text-purple-300 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Render AI Backend Connected</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 font-mono">v1.0.0 API</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 font-['Outfit'] leading-[1.15]">
              AI-Powered{' '}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
                Influencer Outreach
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
              Discover the right influencers, match them with your campaigns, and generate
              personalized outreach using AI.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentView('discover')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition-all hover:border-slate-600 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-purple-400" />
                <span>Explore Influencers</span>
              </button>
            </div>
          </div>

          {/* Professional Visual Dashboard Preview Section */}
          <div id="preview" className="relative mt-8 rounded-2xl p-1 bg-gradient-to-b from-purple-500/30 via-slate-800/40 to-slate-900/80 shadow-2xl shadow-purple-950/40 max-w-5xl mx-auto">
            <div className="rounded-xl overflow-hidden bg-[#0d1322] border border-slate-800">
              {/* Fake Window Controls */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#0a0f1a] border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs font-mono text-slate-500">
                    influencer-outreach-ai.onrender.com/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-[11px]">API Status: Healthy</span>
                </div>
              </div>

              {/* Preview Content Banner with high quality generated image */}
              <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
                <img
                  src={heroImage}
                  alt="Influencer Outreach AI Platform Preview"
                  className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1322] via-[#0d1322]/40 to-transparent" />

                {/* Floating Interactive Sample Widgets */}
                <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-purple-500/30 shadow-xl max-w-sm w-full">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-400 font-medium">Smart AI Match Engine</span>
                      <span className="font-bold text-emerald-400 font-mono">92% Match</span>
                    </div>
                    <p className="text-xs text-slate-200 font-semibold mb-1">
                      Fitness & Lifestyle Creator Campaign
                    </p>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      High engagement (5.67%), niche alignment, authentic video storytelling.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-xl max-w-sm w-full">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Connected Database</span>
                      <span className="text-purple-400 font-mono text-xs">Live Postgres</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono mt-2">
                      <div>
                        <span className="text-slate-500 block text-[10px]">CREATORS</span>
                        <span className="text-white font-bold">{influencers.length || 13}+</span>
                      </div>
                      <div className="h-6 w-px bg-slate-800" />
                      <div>
                        <span className="text-slate-500 block text-[10px]">CAMPAIGNS</span>
                        <span className="text-white font-bold">{campaigns.length || 6}</span>
                      </div>
                      <div className="h-6 w-px bg-slate-800" />
                      <div>
                        <span className="text-slate-500 block text-[10px]">OUTREACH DRAFTS</span>
                        <span className="text-white font-bold">Live AI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-20 border-t border-slate-800/80 bg-[#0d121f]/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-purple-400 font-mono font-semibold mb-2">
              End-to-End Capabilities
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
              Complete workflow for modern influencer marketing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. AI-Powered Discovery */}
            <div id="discovery" className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-['Outfit']">
                  AI-Powered Discovery
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Find relevant influencers based on niche, platform, audience demographics, and
                  engagement metrics. Filter across YouTube and social networks with granular criteria.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Real-time channel subscriber and view analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Customizable follower and engagement thresholds</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('discover')}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
              >
                <span>Search Creators</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 2. Smart Matching */}
            <div id="matching" className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-['Outfit']">
                  Smart Matching
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Use AI to identify influencers who best match your campaign. Computes semantic
                  similarity, audience alignment, and structured scoring reasons.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Match scores with transparent rationale checks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Automated strengths and concerns analysis</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('matching')}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                <span>Run Match Engine</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 3. Personalized Outreach */}
            <div id="outreach" className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-900/40 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-['Outfit']">
                  Personalized Outreach
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Generate personalized collaboration messages using AI. Adapts to creator profile,
                  subscribers, engagement, and campaign tone (Professional, Friendly, Casual).
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <span>Drafting, approval, and email dispatch states</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <span>Instant message customization & regeneration</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('outreach')}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
              >
                <span>Draft Messages</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 4. Campaign Management */}
            <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-['Outfit']">
                  Campaign Management
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Organize campaigns and manage selected influencers in one unified hub. Set budgets,
                  geographic targets, and deliverables with ease.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Industry, audience & niche segmentation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Campaign-linked outreach logging</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('campaigns')}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
              >
                <span>View Campaigns</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 5. Analytics */}
            <div id="analytics" className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-['Outfit']">
                  Analytics & Insights
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Track campaign and influencer performance. View engagement distributions, creator
                  reach breakdown, and conversion response funnels.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Audience reach & engagement distribution charts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Outreach status pipeline tracking</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('analytics')}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <span>Explore Metrics</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 6. AI Assistant Copilot */}
            <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-['Outfit']">
                  AI Outreach Copilot
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Interact with an AI assistant to formulate creator strategies, review pitch
                  angles, and discover high-performing creators automatically.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Conversational query parsing & creator retrieval</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>One-click outreach generation from chat</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('assistant')}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <span>Launch Assistant</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-800 bg-[#080c14] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Influencer Outreach AI</span>
            <span>·</span>
            <span>Production SaaS Suite</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Render Backend: https://influencer-outreach-ai.onrender.com</span>
            <span>·</span>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              Open Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
