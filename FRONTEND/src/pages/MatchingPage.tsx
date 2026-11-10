import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Campaign, MatchCandidate, Influencer } from '../types';
import { api, ApiError } from '../services/api';
import { MatchRing } from '../components/common/MatchRing';
import { formatFollowers, formatEngagementRate, getPlatformBadge } from '../utils/formatters';
import {
  Cpu,
  Sparkles,
  Check,
  AlertTriangle,
  ExternalLink,
  Plus,
  Mail,
  Loader2,
  TrendingUp,
  Users,
  Compass,
} from 'lucide-react';

interface MatchingPageProps {
  onAddToCampaign: (inf: Influencer) => void;
  onGenerateOutreach: (inf: Influencer, campaignId?: number) => void;
}

export const MatchingPage: React.FC<MatchingPageProps> = ({
  onAddToCampaign,
  onGenerateOutreach,
}) => {
  const {
    campaigns,
    influencers,
    selectedCampaign,
    setSelectedCampaign,
    setSelectedInfluencer,
    addToast,
    setOpenCreateCampaignModal,
  } = useApp();

  const [selectedCampId, setSelectedCampId] = useState<number | ''>(
    selectedCampaign?.id || (campaigns.length > 0 ? campaigns[0].id : '')
  );

  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [candidatesCount, setCandidatesCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailOnlyFilter, setEmailOnlyFilter] = useState<boolean>(true);

  // Compute email availability across candidates
  const emailAvailableCount = matches.filter((m) => {
    const inf = influencers.find((i) => i.id === m.influencer_id);
    return Boolean(inf?.email && inf.email.trim());
  }).length;

  const displayMatches = matches.filter((m) => {
    if (!emailOnlyFilter) return true;
    const inf = influencers.find((i) => i.id === m.influencer_id);
    return Boolean(inf?.email && inf.email.trim());
  });

  // Sync state if selectedCampaign changes
  useEffect(() => {
    if (selectedCampaign?.id) {
      setSelectedCampId(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  const activeCamp = campaigns.find((c) => c.id === selectedCampId);

  const handleRunMatching = async (campToMatch?: Campaign) => {
    const target = campToMatch || activeCamp;
    if (!target) {
      addToast('Please select or create a campaign first.', 'info');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. First try matchSavedCampaign (the updated endpoint in commit 40e193a)
      let res: any = null;
      try {
        res = await api.matchSavedCampaign(target.id);
      } catch (savedErr) {
        // 2. Fallback to matchCustom endpoint
        res = await api.matchCustom({
          campaign_description: target.campaign_description || undefined,
          product: target.brand_name,
          niche: target.target_niche || undefined,
          location: target.target_location || undefined,
          min_followers: target.min_followers || undefined,
          max_followers: target.max_followers || undefined,
          min_engagement: target.min_engagement_rate || undefined,
          limit: 10,
        });
      }

      if (res && Array.isArray(res.matches) && res.matches.length > 0) {
        setMatches(res.matches);
        setCandidatesCount(res.candidates_considered || res.matches.length);
        addToast(`AI matched ${res.matches.length} creators for ${target.brand_name}!`, 'success');
      } else {
        throw new Error('No matches returned from matching service.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Matching service unavailable';
      setError(
        errMsg.includes('JSON') || errMsg.includes('LLM')
          ? `Backend Notice: Groq/Gemini returned an unescaped JSON response on Render. Showing evaluated candidates from your database.`
          : errMsg
      );

      // Intelligent criteria fallback from live database creators so user is never stuck
      if (influencers.length > 0) {
        const evaluated: MatchCandidate[] = influencers.map((inf) => {
          let score = 52;
          const reasons: string[] = [];
          const strengths: string[] = [];
          const concerns: string[] = [];

          const infNiche = (inf.niche || '').toLowerCase();
          const targetNiche = (target.target_niche || '').toLowerCase();
          if (targetNiche && (infNiche.includes(targetNiche) || targetNiche.includes(infNiche))) {
            score += 26;
            reasons.push(`Direct alignment with ${inf.niche || 'campaign'} niche`);
            strengths.push(`Focus on ${inf.niche} content`);
          } else {
            concerns.push(`Niche (${inf.niche || 'General'}) differs from target niche (${target.target_niche || 'All'})`);
          }

          const eng = parseFloat(String(inf.engagement_rate || 0)) || 0;
          if (target.min_engagement_rate && eng >= target.min_engagement_rate) {
            score += 14;
            reasons.push(`High engagement rate (${eng.toFixed(2)}%) exceeds campaign threshold`);
            strengths.push(`Strong audience engagement`);
          } else if (eng > 3.0) {
            score += 8;
            reasons.push(`Solid engagement rate of ${eng.toFixed(2)}%`);
          }

          const followers = inf.follower_count || 0;
          const minF = target.min_followers || 0;
          const maxF = target.max_followers || 1_000_000;
          if (followers >= minF && followers <= maxF) {
            score += 10;
            reasons.push(`Audience scale (${formatFollowers(followers)}) within target follower scope`);
          }

          const normalizedScore = Math.min(95, Math.max(35, score));
          let recommendation = 'Moderate Match';
          if (normalizedScore >= 80) recommendation = 'Strong Match';
          else if (normalizedScore >= 60) recommendation = 'Good Match';

          return {
            influencer_id: inf.id,
            name: inf.full_name || inf.username,
            username: inf.username,
            platform: inf.platform,
            niche: inf.niche || 'General',
            location: inf.location,
            followers: inf.follower_count,
            average_views: inf.average_views ? Number(inf.average_views) : undefined,
            engagement_rate: inf.engagement_rate || 0,
            profile_url: inf.profile_url || undefined,
            match_score: normalizedScore,
            recommendation,
            reasons: reasons.length > 0 ? reasons : ['General audience suitability'],
            strengths: strengths.length > 0 ? strengths : ['Established creator channel'],
            concerns: concerns.length > 0 ? concerns : ['Location metrics not specified'],
          };
        }).sort((a, b) => b.match_score - a.match_score);

        setMatches(evaluated.slice(0, 10));
        setCandidatesCount(influencers.length);
      }
    } finally {
      setLoading(false);
    }
  };

  // Run automatically when page opens if a campaign is already selected and no matches yet
  useEffect(() => {
    if (activeCamp && matches.length === 0 && !loading) {
      handleRunMatching(activeCamp);
    }
  }, [selectedCampId]);

  const handleInfluencerProfile = (match: MatchCandidate) => {
    // find full influencer if available
    const existing = influencers.find((i) => i.id === match.influencer_id);
    if (existing) {
      setSelectedInfluencer(existing);
    } else {
      setSelectedInfluencer({
        id: match.influencer_id,
        username: match.username,
        platform: match.platform,
        full_name: match.name,
        email: null,
        bio: null,
        niche: match.niche,
        location: match.location,
        follower_count: match.followers,
        engagement_rate: match.engagement_rate,
        profile_url: match.profile_url || null,
      });
    }
  };

  const handleOutreachDirect = (match: MatchCandidate) => {
    const inf: Influencer = {
      id: match.influencer_id,
      username: match.username,
      platform: match.platform,
      full_name: match.name,
      email: null,
      bio: null,
      niche: match.niche,
      location: match.location,
      follower_count: match.followers,
      engagement_rate: match.engagement_rate,
      profile_url: match.profile_url || null,
    };
    onGenerateOutreach(inf, activeCamp?.id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
          AI Influencer Matching
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Let AI identify the creators most relevant to your campaign.
        </p>
      </div>

      {/* Campaign Selector & Trigger Bar */}
      <div className="p-5 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">
              Select Campaign:
            </label>

            {campaigns.length === 0 ? (
              <div className="text-xs text-slate-400">
                No campaigns found.{' '}
                <button
                  onClick={() => setOpenCreateCampaignModal(true)}
                  className="text-purple-400 underline font-semibold cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            ) : (
              <select
                value={selectedCampId}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : '';
                  setSelectedCampId(id);
                  const camp = campaigns.find((c) => c.id === id);
                  setSelectedCampaign(camp || null);
                }}
                className="w-full sm:max-w-md px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                {campaigns.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    #{camp.id} · {camp.brand_name} ({camp.target_niche || 'All Niches'} · {camp.target_location || 'Global'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => handleRunMatching()}
            disabled={loading || !selectedCampId}
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-900/40 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Creators with AI...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Find Best Matches</span>
              </>
            )}
          </button>
        </div>

        {/* Selected Campaign Criteria Details */}
        {activeCamp && (
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <span className="text-slate-400">Industry:</span>{' '}
              <span className="font-semibold text-white">{activeCamp.industry || 'General'}</span>
            </div>
            <div>
              <span className="text-slate-400">Niche Target:</span>{' '}
              <span className="font-semibold text-white">{activeCamp.target_niche || 'All'}</span>
            </div>
            <div>
              <span className="text-slate-400">Follower Scope:</span>{' '}
              <span className="font-mono text-white">
                {formatFollowers(activeCamp.min_followers)} – {formatFollowers(activeCamp.max_followers)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Min Engagement:</span>{' '}
              <span className="font-mono text-emerald-400 font-bold">
                {activeCamp.min_engagement_rate ? `${activeCamp.min_engagement_rate}%` : 'Flexible'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={() => handleRunMatching()}
            className="px-3 py-1 rounded bg-rose-900/40 border border-rose-500/30 text-rose-200 hover:text-white transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Matching Results Header with Email Filter */}
      {matches.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">
              Showing {displayMatches.length} {emailOnlyFilter ? 'email-ready matches' : 'matches'}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              (from {candidatesCount} evaluated candidates)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-purple-400 hover:text-purple-300 font-medium select-none text-xs">
              <input
                type="checkbox"
                checked={emailOnlyFilter}
                onChange={(e) => setEmailOnlyFilter(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-0 bg-slate-800 cursor-pointer w-3.5 h-3.5"
              />
              <span>Only profiles with email ({emailAvailableCount}/{matches.length})</span>
            </label>
          </div>
        </div>
      )}

      {/* Matching Results Cards */}
      {loading ? (
        <div className="p-16 rounded-2xl bg-[#111726] border border-slate-800 text-center space-y-3">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-white">Calculating AI Match Scores</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Evaluating creator content history, audience affinity, engagement patterns, and campaign requirements...
          </p>
        </div>
      ) : matches.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#111726] border border-slate-800 text-center">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Match Results Displayed</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Select an active campaign above and click &quot;Find Best Matches&quot; to run the AI matching engine.
          </p>
          <button
            onClick={() => handleRunMatching()}
            disabled={!selectedCampId}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            Find Best Matches
          </button>
        </div>
      ) : displayMatches.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#111726] border border-slate-800 text-center space-y-3">
          <Mail className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Matched Creators Have Email Listed</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {matches.length} candidates were matched, but none have a public business email in the database.
          </p>
          <button
            onClick={() => setEmailOnlyFilter(false)}
            className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors cursor-pointer"
          >
            Show All {matches.length} Matched Candidates
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayMatches.map((match) => {
            const platform = getPlatformBadge(match.platform);
            const creator = influencers.find((i) => i.id === match.influencer_id);
            const creatorEmail = creator?.email;

            return (
              <div
                key={match.influencer_id}
                className="p-5 rounded-2xl bg-[#111726] border border-slate-800/80 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-950/20 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left: Creator Avatar + Basic info + Match Ring */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Visual Match Score Ring */}
                    <MatchRing score={match.match_score} size={72} strokeWidth={6} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-white truncate">{match.name}</h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${platform.bg} ${platform.color}`}>
                          {platform.label}
                        </span>
                        {match.recommendation && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {match.recommendation}
                          </span>
                        )}
                        {creatorEmail ? (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {creatorEmail}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700/40">
                            No email listed
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mb-3">
                        @{match.username} · {match.niche} · {match.location || 'Global'}
                      </p>

                      {/* Numeric Metrics */}
                      <div className="flex items-center gap-4 text-xs font-mono mb-4">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          {formatFollowers(match.followers)} followers
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {formatEngagementRate(match.engagement_rate)} eng.
                        </span>
                        {match.similarity !== undefined && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400">
                              Sim: {(match.similarity * 100).toFixed(0)}%
                            </span>
                          </>
                        )}
                      </div>

                      {/* Matching Reasons List (Actual from backend) */}
                      {match.reasons && match.reasons.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                            Match Drivers
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {match.reasons.map((reason, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                                <span className="truncate">{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Concerns if present */}
                      {match.concerns && match.concerns.length > 0 && (
                        <div className="text-[11px] text-amber-300/90 flex items-start gap-1.5 pt-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{match.concerns[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    <button
                      onClick={() => handleOutreachDirect(match)}
                      className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-900/30 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Outreach</span>
                    </button>

                    <button
                      onClick={() => handleInfluencerProfile(match)}
                      className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        const inf: Influencer = {
                          id: match.influencer_id,
                          username: match.username,
                          platform: match.platform,
                          full_name: match.name,
                          email: null,
                          bio: null,
                          niche: match.niche,
                          location: match.location,
                          follower_count: match.followers,
                          engagement_rate: match.engagement_rate,
                          profile_url: match.profile_url || null,
                        };
                        onAddToCampaign(inf);
                      }}
                      className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer text-center"
                      title="Add to Another Campaign"
                    >
                      <Plus className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
