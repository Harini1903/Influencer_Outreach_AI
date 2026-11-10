import React from 'react';
import { Influencer } from '../../types';
import { formatFollowers, formatEngagementRate, getPlatformBadge, getInitials } from '../../utils/formatters';
import { ExternalLink, Users, Sparkles, Plus, MapPin, Mail } from 'lucide-react';

interface InfluencerCardProps {
  influencer: Influencer;
  onViewProfile: (inf: Influencer) => void;
  onAddToCampaign: (inf: Influencer) => void;
  onGenerateOutreach: (inf: Influencer) => void;
}

export const InfluencerCard: React.FC<InfluencerCardProps> = ({
  influencer,
  onViewProfile,
  onAddToCampaign,
  onGenerateOutreach,
}) => {
  const platform = getPlatformBadge(influencer.platform);
  const initials = getInitials(influencer.full_name || influencer.username);

  return (
    <div className="bg-[#111726] border border-slate-800/80 rounded-xl p-5 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-950/20 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header: Platform & Actions */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar or Fallback with initials */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-900/60 to-indigo-900/60 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-200 shrink-0 shadow-inner overflow-hidden">
              <span>{initials}</span>
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                {influencer.full_name || influencer.username}
              </h3>
              <p className="text-xs text-slate-400 truncate">@{influencer.username}</p>
            </div>
          </div>

          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${platform.bg} ${platform.color} whitespace-nowrap`}>
            {platform.label}
          </span>
        </div>

        {/* Bio / Description preview */}
        {influencer.bio ? (
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {influencer.bio}
          </p>
        ) : (
          <p className="text-xs text-slate-600 italic mb-4">No biography provided</p>
        )}

        {/* Key Metrics Strip */}
        <div className={`grid ${influencer.average_views ? 'grid-cols-3' : 'grid-cols-2'} gap-2 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/50 mb-4 text-xs`}>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Followers</span>
            <span className="text-sm font-bold text-slate-100 font-mono tabular-nums flex items-center gap-1 mt-0.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              {formatFollowers(influencer.follower_count)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Engagement</span>
            <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums mt-0.5 block">
              {formatEngagementRate(influencer.engagement_rate)}
            </span>
          </div>

          {influencer.average_views ? (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Avg Views</span>
              <span className="text-sm font-bold text-cyan-400 font-mono tabular-nums mt-0.5 block">
                {formatFollowers(influencer.average_views)}
              </span>
            </div>
          ) : null}
        </div>

        {/* Unboxed Metadata (niche, location, external link) */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-4">
          {influencer.niche && (
            <span className="text-slate-300 font-medium">{influencer.niche}</span>
          )}

          {influencer.niche && influencer.location && <span aria-hidden="true" className="text-slate-600">·</span>}

          {influencer.location && (
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-slate-500" />
              {influencer.location}
            </span>
          )}

          {influencer.profile_url && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <a
                href={influencer.profile_url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                title="Open original channel"
              >
                <span>Channel</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}

          {influencer.email ? (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[130px]">{influencer.email}</span>
              </span>
            </>
          ) : (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                No email
              </span>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons: View Profile, Add to Campaign, Generate Outreach */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center gap-1.5">
        <button
          onClick={() => onViewProfile(influencer)}
          className="flex-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer text-center"
        >
          View Profile
        </button>

        <button
          onClick={() => onAddToCampaign(influencer)}
          className="p-1.5 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer"
          title="Add to Campaign"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={() => onGenerateOutreach(influencer)}
          className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-all shadow-sm shadow-purple-900/30 cursor-pointer whitespace-nowrap"
          title="Generate AI Outreach"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Outreach</span>
        </button>
      </div>
    </div>
  );
};
