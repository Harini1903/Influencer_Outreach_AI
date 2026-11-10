import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatFollowers, formatEngagementRate } from '../utils/formatters';
import {
  BarChart3,
  TrendingUp,
  Users,
  Compass,
  Megaphone,
  PieChart,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { influencers, campaigns, setCurrentView } = useApp();

  // Compute real metrics from the database
  const metrics = useMemo(() => {
    let totalFollowers = 0;
    let totalEng = 0;
    let validEngCount = 0;
    const nicheCounts: Record<string, number> = {};
    const platformCounts: Record<string, number> = {};

    influencers.forEach((inf) => {
      totalFollowers += inf.follower_count || 0;
      const eng = typeof inf.engagement_rate === 'string' ? parseFloat(inf.engagement_rate) : inf.engagement_rate;
      if (eng && !isNaN(eng)) {
        totalEng += eng;
        validEngCount++;
      }
      const n = inf.niche || 'Other';
      nicheCounts[n] = (nicheCounts[n] || 0) + 1;

      const p = (inf.platform || 'Other').toLowerCase();
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    });

    const avgEng = validEngCount > 0 ? (totalEng / validEngCount).toFixed(2) : '0';

    return {
      totalFollowers,
      avgEng,
      nicheCounts,
      platformCounts,
      influencersCount: influencers.length,
      campaignsCount: campaigns.length,
    };
  }, [influencers, campaigns]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
            Analytics & Creator Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregated insights derived from active creator databases and campaign criteria.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span>Real-time snapshot</span>
        </div>
      </div>

      {/* Top Aggregated Real Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#111726] border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">
            Total Reachable Audience
          </span>
          <p className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
            {formatFollowers(metrics.totalFollowers)}
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Across {metrics.influencersCount} tracked creators
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#111726] border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">
            Average Engagement
          </span>
          <p className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            {metrics.avgEng}%
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Mean interaction rate
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#111726] border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">
            Active Campaigns
          </span>
          <p className="text-2xl font-bold text-purple-400 font-mono tabular-nums mt-1">
            {metrics.campaignsCount}
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Targeting micro & macro tiers
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#111726] border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">
            Creator Niches
          </span>
          <p className="text-2xl font-bold text-indigo-400 font-mono tabular-nums mt-1">
            {Object.keys(metrics.nicheCounts).length}
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Beauty, Tech, Lifestyle, Fitness
          </span>
        </div>
      </div>

      {/* Real Data Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Niche Breakdown */}
        <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white font-['Outfit']">
              Creator Distribution by Niche
            </h3>
            <span className="text-xs text-slate-400 font-mono">Real DB Records</span>
          </div>

          <div className="space-y-3">
            {Object.entries(metrics.nicheCounts).map(([niche, count]) => {
              const percent = Math.round((count / (metrics.influencersCount || 1)) * 100);
              return (
                <div key={niche} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{niche}</span>
                    <span className="font-mono text-slate-400">
                      {count} creators ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white font-['Outfit']">
              Platform Footprint
            </h3>
            <span className="text-xs text-slate-400 font-mono">Live Ingested</span>
          </div>

          <div className="space-y-3">
            {Object.entries(metrics.platformCounts).map(([platform, count]) => {
              const percent = Math.round((count / (metrics.influencersCount || 1)) * 100);
              return (
                <div key={platform} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 capitalize font-medium">{platform}</span>
                    <span className="font-mono text-slate-400">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Honest Backend Pipeline Notice for Timeseries Analytics */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#111726] to-slate-900/60 border border-purple-500/30 text-center relative overflow-hidden">
        <div className="max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
            <TrendingUp className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-white font-['Outfit']">
            Advanced Timeseries & Conversion Analytics
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            The Render backend currently exposes CRUD endpoints for Influencers, Campaigns, AI Matching,
            and Personalized Outreach. Historical ROI charts, click-through conversions, and automated webhook tracking
            will automatically activate once the backend exposes the upcoming <code className="text-purple-300 font-mono">/api/v1/analytics</code> endpoints.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setCurrentView('discover')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md shadow-purple-900/30 transition-all cursor-pointer"
            >
              <span>Explore Influencers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
