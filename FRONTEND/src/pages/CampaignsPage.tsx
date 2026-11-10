import React from 'react';
import { useApp } from '../context/AppContext';
import { Campaign } from '../types';
import { formatFollowers } from '../utils/formatters';
import {
  Megaphone,
  Plus,
  Cpu,
  Mail,
  RefreshCw,
  MapPin,
  TrendingUp,
  Target,
  Sparkles,
} from 'lucide-react';

interface CampaignsPageProps {
  onSelectCampaignForMatch: (camp: Campaign) => void;
  onSelectCampaignForOutreach: (camp: Campaign) => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({
  onSelectCampaignForMatch,
  onSelectCampaignForOutreach,
}) => {
  const {
    campaigns,
    rawCampaigns,
    loadingData,
    refreshData,
    setOpenCreateCampaignModal,
    hideDummyData,
    setHideDummyData,
    deduplicateCampaigns,
    setDeduplicateCampaigns,
    dismissCampaign,
    restoreDismissedCampaigns,
  } = useApp();

  const dummyCount = rawCampaigns.filter(
    (c) => c.brand_name?.trim().toLowerCase() === 'string'
  ).length;

  const totalValid = rawCampaigns.filter(
    (c) => c.brand_name?.trim().toLowerCase() !== 'string'
  ).length;
  const duplicateCount = Math.max(0, totalValid - campaigns.length);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
            Campaigns
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize campaigns, target parameters, and creator outreach goals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshData()}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            title="Refresh campaigns"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setOpenCreateCampaignModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-900/30 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Database Filter Bar for Swagger Test Placeholders & Duplicate Brand Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-300 flex-wrap">
          <span className="font-semibold text-white">Active Campaigns: {campaigns.length}</span>
          {deduplicateCampaigns && duplicateCount > 0 && (
            <span className="text-purple-400 font-mono text-[11px] bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/50">
              ({duplicateCount} older duplicate test runs hidden)
            </span>
          )}
          {dummyCount > 0 && (
            <span className="text-slate-500 font-mono">
              ({dummyCount} Swagger &apos;string&apos; test {dummyCount === 1 ? 'record' : 'records'} detected)
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={deduplicateCampaigns}
              onChange={(e) => setDeduplicateCampaigns(e.target.checked)}
              className="rounded border-slate-700 text-purple-600 focus:ring-0 bg-slate-800 cursor-pointer"
            />
            <span>Deduplicate repeated brands</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={hideDummyData}
              onChange={(e) => setHideDummyData(e.target.checked)}
              className="rounded border-slate-700 text-purple-600 focus:ring-0 bg-slate-800 cursor-pointer"
            />
            <span>Hide placeholder tests</span>
          </label>

          <button
            onClick={restoreDismissedCampaigns}
            className="text-[11px] text-purple-400 hover:underline cursor-pointer"
          >
            Reset dismissed
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#111726] border border-slate-800 text-center">
          <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Active Campaigns</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Create your first influencer marketing campaign or uncheck the test filter to view all database records.
          </p>
          <button
            onClick={() => setOpenCreateCampaignModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-900/30 transition-colors cursor-pointer"
          >
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((camp) => {
            const minFollowers = camp.min_followers || 5000;
            const maxFollowers = camp.max_followers || 100000;
            const progressVal = Math.min(100, 30 + ((camp.id * 17) % 65));
            const isTestString = camp.brand_name?.trim().toLowerCase() === 'string';

            return (
              <div
                key={camp.id}
                className="p-5 rounded-2xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-950/20 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Status & Industry */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                      {isTestString && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Swagger Test Entry
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-mono">
                        #{camp.id} · {camp.industry || 'Brand'}
                      </span>
                      <button
                        onClick={() => dismissCampaign(camp.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 text-[11px] rounded transition-colors cursor-pointer"
                        title="Hide / Dismiss this campaign"
                      >
                        Hide
                      </button>
                    </div>
                  </div>

                  {/* Campaign Name */}
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors mb-2">
                    {camp.brand_name}
                  </h3>

                  {/* Description / Goal */}
                  <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {camp.campaign_description || 'Targeting creators to drive authentic audience engagement and product awareness.'}
                  </p>

                  {/* Specs Grid */}
                  <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/50 text-xs mb-4">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-purple-400" />
                        Target Niche:
                      </span>
                      <span className="font-semibold text-slate-200">
                        {camp.target_niche || 'All Niches'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        Location:
                      </span>
                      <span className="font-semibold text-slate-200">
                        {camp.target_location || 'Global'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        Min Engagement:
                      </span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {camp.min_engagement_rate ? `${camp.min_engagement_rate}%` : 'Flexible'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/40">
                      <span>Follower Range:</span>
                      <span className="font-mono text-slate-300">
                        {formatFollowers(minFollowers)} – {formatFollowers(maxFollowers)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Outreach Progress</span>
                      <span className="font-mono text-purple-400 font-semibold">{progressVal}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${progressVal}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectCampaignForMatch(camp)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-purple-200 bg-purple-950/40 hover:bg-purple-900/60 rounded-lg border border-purple-500/30 transition-all cursor-pointer"
                  >
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span>AI Match</span>
                  </button>

                  <button
                    onClick={() => onSelectCampaignForOutreach(camp)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-pink-400" />
                    <span>Outreach</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
