import React from 'react';
import { Influencer } from '../../types';
import { formatFollowers, formatEngagementRate, getPlatformBadge, getInitials } from '../../utils/formatters';
import { X, ExternalLink, Sparkles, Plus, Users, Percent, MapPin, Mail, ArrowLeft } from 'lucide-react';

interface InfluencerProfileModalProps {
  influencer: Influencer | null;
  onClose: () => void;
  onAddToCampaign: (inf: Influencer) => void;
  onGenerateOutreach: (inf: Influencer) => void;
}

export const InfluencerProfileModal: React.FC<InfluencerProfileModalProps> = ({
  influencer,
  onClose,
  onAddToCampaign,
  onGenerateOutreach,
}) => {
  if (!influencer) return null;

  const platform = getPlatformBadge(influencer.platform);
  const initials = getInitials(influencer.full_name || influencer.username);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0f1422] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Banner with gradient accent */}
        <div className="h-32 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-slate-900 border-b border-slate-800/80 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar and Top Actions */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 border-4 border-[#0f1422] shadow-xl flex items-center justify-center text-2xl font-bold text-white shrink-0">
                {initials}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">
                    {influencer.full_name || influencer.username}
                  </h2>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${platform.bg} ${platform.color}`}>
                    {platform.label}
                  </span>
                </div>
                <p className="text-sm text-slate-400">@{influencer.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                onClick={() => {
                  onClose();
                  onAddToCampaign(influencer);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Campaign
              </button>

              <button
                onClick={() => {
                  onClose();
                  onGenerateOutreach(influencer);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-900/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Outreach
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Followers</span>
              </div>
              <p className="text-lg font-bold text-white font-mono tabular-nums">
                {formatFollowers(influencer.follower_count)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>Engagement</span>
              </div>
              <p className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
                {formatEngagementRate(influencer.engagement_rate)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Location</span>
              </div>
              <p className="text-sm font-semibold text-slate-200 truncate">
                {influencer.location || 'Global / Unspecified'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Mail className="w-3.5 h-3.5 text-pink-400" />
                <span>Contact Email</span>
              </div>
              {influencer.email ? (
                <p className="text-xs font-semibold text-emerald-400 font-mono truncate" title={influencer.email}>
                  {influencer.email}
                </p>
              ) : (
                <span className="text-[11px] text-amber-400/90 font-medium block">
                  No email listed
                </span>
              )}
            </div>
          </div>

          {/* YouTube Video Analytics Strip (if present from live discovery) */}
          {(influencer.average_views || influencer.videos_analysed || influencer.last_upload_at) && (
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs mb-6">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Average Views</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {formatFollowers(influencer.average_views)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Videos Analyzed</span>
                <span className="text-sm font-bold text-purple-300 font-mono mt-0.5 block">
                  {influencer.videos_analysed || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Last Upload</span>
                <span className="text-xs font-semibold text-slate-300 mt-0.5 block truncate">
                  {influencer.last_upload_at ? new Date(influencer.last_upload_at).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>
          )}

          {/* Bio & Niche Details */}
          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Creator Bio
              </h4>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-sm text-slate-300 leading-relaxed whitespace-pre-line max-h-56 overflow-y-auto">
                {influencer.bio || 'No channel description provided by creator.'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
                <span className="text-slate-400 block mb-1">Primary Niche</span>
                <span className="text-sm font-semibold text-slate-200">{influencer.niche || 'General Lifestyle & Tech'}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
                <span className="text-slate-400 block mb-1">Public Profile Link</span>
                {influencer.profile_url ? (
                  <a
                    href={influencer.profile_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm font-medium transition-colors"
                  >
                    <span className="truncate">{influencer.profile_url}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-slate-500">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Discovery
            </button>

            <span className="text-xs text-slate-400 font-mono">
              Database ID #{influencer.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
