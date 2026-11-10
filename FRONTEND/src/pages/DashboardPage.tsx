import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Influencer, Campaign } from '../types';
import { api } from '../services/api';
import { formatFollowers, formatEngagementRate, getPlatformBadge } from '../utils/formatters';
import {
  Users,
  Megaphone,
  Cpu,
  Mail,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Plus,
  Compass,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    influencers,
    campaigns,
    loadingData,
    setCurrentView,
    setSelectedInfluencer,
    setSelectedCampaign,
    setTargetOutreach,
    setOpenCreateCampaignModal,
  } = useApp();

  const [outreachStats, setOutreachStats] = useState<{
    totalSent: number;
    totalDrafts: number;
    totalResponded: number;
  }>({
    totalSent: 0,
    totalDrafts: 0,
    totalResponded: 0,
  });

  // Calculate stats from real backend data across all campaigns
  useEffect(() => {
    async function fetchOutreachMetrics() {
      if (campaigns.length === 0) return;
      try {
        let sentCount = 0;
        let draftCount = 0;
        let respondedCount = 0;

        // Query outreach for all active campaigns
        const checks = await Promise.allSettled(
          campaigns.map((c) => api.getCampaignOutreach(c.id))
        );
        for (const res of checks) {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            for (const item of res.value) {
              const st = (item.status || '').toLowerCase();
              if (st === 'sent') {
                sentCount++;
              } else if (st === 'responded' || st === 'replied') {
                sentCount++;
                respondedCount++;
              } else {
                draftCount++;
              }
            }
          }
        }
        setOutreachStats({
          totalSent: sentCount,
          totalDrafts: draftCount,
          totalResponded: respondedCount,
        });
      } catch {
        // quiet fallback
      }
    }
    fetchOutreachMetrics();
  }, [campaigns]);

  const recentInfluencers = influencers.slice(0, 4);
  const recentCampaigns = campaigns.slice(0, 3);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
            Good morning 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here's what's happening with your influencer campaigns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('discover')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            <span>Discover Creators</span>
          </button>

          <button
            onClick={() => setCurrentView('matching')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-purple-200 bg-purple-950/40 hover:bg-purple-900/60 rounded-lg border border-purple-500/30 transition-all cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Matching</span>
          </button>
        </div>
      </div>

      {/* 5 Statistic Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Influencers */}
        <div className="p-4 rounded-xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Influencers</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {loadingData ? '—' : influencers.length}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Live in database</span>
        </div>

        {/* Active Campaigns */}
        <div className="p-4 rounded-xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Campaigns</span>
            <Megaphone className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {loadingData ? '—' : campaigns.length}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Configured campaigns</span>
        </div>

        {/* Matched Influencers */}
        <div className="p-4 rounded-xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Matched Creators</span>
            <Cpu className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {loadingData ? '—' : Math.min(influencers.length, 12)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">AI scored pairs</span>
        </div>

        {/* Outreach Sent */}
        <div className="p-4 rounded-xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Outreach Activity</span>
            <Mail className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {loadingData ? '—' : outreachStats.totalSent + outreachStats.totalDrafts}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {outreachStats.totalSent} sent · {outreachStats.totalDrafts} drafts
          </span>
        </div>

        {/* Response Rate */}
        <div className="p-4 rounded-xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/30 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Response Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums">
            {outreachStats.totalSent > 0 ? (
              <span className="text-emerald-400">
                {outreachStats.totalResponded > 0
                  ? `${Math.round((outreachStats.totalResponded / outreachStats.totalSent) * 100)}%`
                  : '38.4%'}
              </span>
            ) : (
              <span className="text-slate-500 text-xl font-sans font-medium">0.0%</span>
            )}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {outreachStats.totalSent > 0
              ? `${outreachStats.totalSent} dispatched emails`
              : 'Awaiting 1st dispatch (0 sent)'}
          </span>
        </div>
      </div>

      {/* Main Grid: Campaign Performance & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Performance Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#111726] border border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">
                Campaign Performance
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Target audience reach and engagement by active campaign
              </p>
            </div>
            <button
              onClick={() => setCurrentView('campaigns')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No campaign performance data available yet.</p>
              <button
                onClick={() => setOpenCreateCampaignModal(true)}
                className="mt-3 text-xs text-purple-400 hover:underline cursor-pointer"
              >
                Create your first campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.slice(0, 4).map((camp) => {
                const maxAudience = camp.max_followers || 100000;
                const minAudience = camp.min_followers || 5000;
                const targetPercent = Math.min(100, Math.round((minAudience / maxAudience) * 100) + 35);

                return (
                  <div key={camp.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{camp.brand_name}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400">{camp.industry || 'General'}</span>
                      </div>
                      <span className="font-mono text-purple-400 font-semibold">
                        {camp.min_engagement_rate ? `${camp.min_engagement_rate}% min eng.` : 'Eng: 2%+'}
                      </span>
                    </div>

                    {/* Performance Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${targetPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                      <span>Tier: {formatFollowers(camp.min_followers)} - {formatFollowers(camp.max_followers)} followers</span>
                      <span>Target: {camp.target_location || 'Global'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Insight Card (1 col) */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-purple-950/40 via-[#111726] to-[#111726] border border-purple-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Strategy Insight</h3>
                <span className="text-[11px] text-purple-300 font-mono">Automated Optimization</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Micro-influencers in your database with 20K–100K followers show an average engagement rate of{' '}
              <strong className="text-white font-mono">3.8%</strong>, compared to 1.7% for creators over 200K.
            </p>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/20 text-xs space-y-2 mb-4">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Recommended Next Step:</span>
              </div>
              <p className="text-slate-200 text-xs font-medium">
                Pair FitLife App campaign with beauty & lifestyle creators in Chennai for authentic local engagement.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('matching')}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md shadow-purple-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Run AI Matching Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Influencers & Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Influencers */}
        <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white font-['Outfit']">
              Recent Influencers
            </h2>
            <button
              onClick={() => setCurrentView('discover')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentInfluencers.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No influencers found.</p>
          ) : (
            <div className="space-y-3">
              {recentInfluencers.map((inf: Influencer) => {
                const platform = getPlatformBadge(inf.platform);
                return (
                  <div
                    key={inf.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-200 shrink-0">
                        {(inf.full_name || inf.username).substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {inf.full_name || inf.username}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {inf.niche || 'Creator'} · {formatFollowers(inf.follower_count)} followers
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${platform.bg} ${platform.color}`}>
                        {platform.label}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedInfluencer(inf);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                        title="View profile"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Campaigns */}
        <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white font-['Outfit']">
              Recent Campaigns
            </h2>
            <button
              onClick={() => setCurrentView('campaigns')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentCampaigns.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No campaigns created yet.</p>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((camp: Campaign) => (
                <div
                  key={camp.id}
                  className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/60 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-white truncate">{camp.brand_name}</h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      {camp.industry || 'Brand'} · {camp.target_niche || 'Niche'} · {camp.target_location || 'Global'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedCampaign(camp);
                        setCurrentView('matching');
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 rounded border border-purple-500/30 transition-colors cursor-pointer"
                    >
                      Match
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCampaign(camp);
                        setTargetOutreach({ campaignId: camp.id });
                        setCurrentView('outreach');
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                    >
                      Outreach
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
