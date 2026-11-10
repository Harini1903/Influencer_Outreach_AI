import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Influencer } from '../types';
import { api, ApiError } from '../services/api';
import { InfluencerCard } from '../components/common/InfluencerCard';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  Compass,
  AlertCircle,
} from 'lucide-react';

interface DiscoverPageProps {
  onAddToCampaign: (inf: Influencer) => void;
  onGenerateOutreach: (inf: Influencer) => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  onAddToCampaign,
  onGenerateOutreach,
}) => {
  const {
    influencers,
    loadingData,
    refreshData,
    setSelectedInfluencer,
    setOpenCreateInfluencerModal,
    addToast,
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [nicheFilter, setNicheFilter] = useState('all');
  const [followerTier, setFollowerTier] = useState('all');
  const [minEngagement, setMinEngagement] = useState<number>(0);
  const [locationFilter, setLocationFilter] = useState('all');
  const [withEmailOnly, setWithEmailOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'followers-desc' | 'followers-asc' | 'engagement-desc' | 'name'>('followers-desc');

  // Backend live discovery state
  const [isDiscoveringLive, setIsDiscoveringLive] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [lastDiscovery, setLastDiscovery] = useState<any | null>(null);
  const [showOnlyDiscovered, setShowOnlyDiscovered] = useState(false);

  // Extract unique niches and locations from database
  const availableNiches = useMemo(() => {
    const set = new Set<string>();
    influencers.forEach((inf) => {
      if (inf.niche) set.add(inf.niche);
    });
    return Array.from(set);
  }, [influencers]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    influencers.forEach((inf) => {
      if (inf.location) set.add(inf.location);
    });
    return Array.from(set);
  }, [influencers]);

  // Handle Search & Filter computation
  const filteredInfluencers = useMemo(() => {
    const baseList = showOnlyDiscovered && lastDiscovery?.influencers?.length
      ? (lastDiscovery.influencers as Influencer[])
      : influencers;

    return baseList
      .filter((inf) => {
        // Search text matching (name, username, bio, niche)
        if (searchTerm.trim() && !showOnlyDiscovered) {
          const q = searchTerm.toLowerCase();
          const matchName = inf.full_name?.toLowerCase().includes(q);
          const matchUser = inf.username.toLowerCase().includes(q);
          const matchBio = inf.bio?.toLowerCase().includes(q);
          const matchNiche = inf.niche?.toLowerCase().includes(q);
          if (!matchName && !matchUser && !matchBio && !matchNiche) return false;
        }

        // Platform filter
        if (platformFilter !== 'all' && inf.platform.toLowerCase() !== platformFilter) {
          return false;
        }

        // Niche filter
        if (nicheFilter !== 'all' && inf.niche?.toLowerCase() !== nicheFilter.toLowerCase()) {
          return false;
        }

        // Location filter
        if (locationFilter !== 'all' && inf.location?.toLowerCase() !== locationFilter.toLowerCase()) {
          return false;
        }

        // Follower tier
        if (followerTier === 'nano' && inf.follower_count >= 10000) return false;
        if (followerTier === 'micro' && (inf.follower_count < 10000 || inf.follower_count >= 100000)) return false;
        if (followerTier === 'macro' && inf.follower_count < 100000) return false;

        // Min engagement
        if (minEngagement > 0) {
          const eng = typeof inf.engagement_rate === 'string' ? parseFloat(inf.engagement_rate) : inf.engagement_rate;
          if (!eng || eng < minEngagement) return false;
        }

        // Email filter
        if (withEmailOnly && (!inf.email || !inf.email.trim())) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'followers-desc') return b.follower_count - a.follower_count;
        if (sortBy === 'followers-asc') return a.follower_count - b.follower_count;
        if (sortBy === 'engagement-desc') {
          const engA = parseFloat(String(a.engagement_rate || 0)) || 0;
          const engB = parseFloat(String(b.engagement_rate || 0)) || 0;
          return engB - engA;
        }
        return (a.full_name || a.username).localeCompare(b.full_name || b.username);
      });
  }, [
    influencers,
    searchTerm,
    platformFilter,
    nicheFilter,
    followerTier,
    minEngagement,
    locationFilter,
    withEmailOnly,
    sortBy,
    showOnlyDiscovered,
    lastDiscovery,
  ]);

  // Trigger live backend discovery if user requests discovery for new keywords
  const handleLiveDiscovery = async () => {
    if (!searchTerm.trim()) {
      addToast('Please enter a search keyword or topic to discover new creators.', 'info');
      return;
    }

    setIsDiscoveringLive(true);
    setDiscoveryError(null);
    try {
      const res = await api.discoverInfluencers({
        keyword: searchTerm.trim(),
        niche: nicheFilter !== 'all' ? nicheFilter : 'General',
        max_results: 10,
      });

      setLastDiscovery(res);
      if (res.influencers && res.influencers.length > 0) {
        setShowOnlyDiscovered(true);
      }

      addToast(
        `Discovered ${res.discovered || 0} channels · ${res.qualified || 0} qualified · ${res.saved || 0} saved to database!`,
        'success'
      );
      await refreshData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setDiscoveryError(err.message);
      } else {
        setDiscoveryError('Live channel discovery service is currently experiencing high load.');
      }
    } finally {
      setIsDiscoveringLive(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
            Discover Influencers
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Find creators that match your campaign goals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshData()}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setOpenCreateInfluencerModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-900/30 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Creator</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Card */}
      <div className="p-5 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-4">
        {/* Search Bar & Primary Trigger */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search influencers by name, niche, handle, or bio..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <button
            onClick={handleLiveDiscovery}
            disabled={isDiscoveringLive}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-md shadow-purple-900/30 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {isDiscoveringLive ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Searching YouTube API...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Search Influencers</span>
              </>
            )}
          </button>
        </div>

        {/* Live Discovery Success Card (when YouTube API returns fresh creators) */}
        {lastDiscovery && (
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 text-xs text-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-bold text-white text-sm">Live YouTube Discovery Result</span>
                <span className="text-slate-400 font-mono">({lastDiscovery.keyword})</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
                <span>Discovered from YouTube: <strong className="text-white">{lastDiscovery.discovered}</strong></span>
                <span>·</span>
                <span>Passed Criteria: <strong className="text-emerald-400">{lastDiscovery.qualified}</strong></span>
                <span>·</span>
                <span>Saved to Database: <strong className="text-purple-300">{lastDiscovery.saved}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowOnlyDiscovered(!showOnlyDiscovered)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  showOnlyDiscovered
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/30'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {showOnlyDiscovered ? 'Show Full Database' : `View Only Discovered (${lastDiscovery.influencers?.length || 0})`}
              </button>
            </div>
          </div>
        )}

        {/* Live Discovery Warning Notice if YouTube API fails */}
        {discoveryError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">External Discovery Notice:</span>
              <span>{discoveryError}</span>
              <span className="block mt-1 text-slate-400">
                You can still browse, filter, match, and generate outreach for all creators in the database below, or add creators manually.
              </span>
            </div>
          </div>
        )}

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-800/60 text-xs">
          {/* Platform */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Platform
            </label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Platforms</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">X (Twitter)</option>
            </select>
          </div>

          {/* Niche */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Niche
            </label>
            <select
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Niches</option>
              {availableNiches.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Followers Tier */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Followers
            </label>
            <select
              value={followerTier}
              onChange={(e) => setFollowerTier(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="all">Any Size</option>
              <option value="nano">&lt; 10K (Nano)</option>
              <option value="micro">10K - 100K (Micro)</option>
              <option value="macro">&gt; 100K (Macro)</option>
            </select>
          </div>

          {/* Min Engagement */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Engagement
            </label>
            <select
              value={minEngagement}
              onChange={(e) => setMinEngagement(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="0">Any %</option>
              <option value="1.5">&gt; 1.5%</option>
              <option value="2.5">&gt; 2.5%</option>
              <option value="4.0">&gt; 4.0%</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Location
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="all">Any Location</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="followers-desc">Followers: High to Low</option>
              <option value="followers-asc">Followers: Low to High</option>
              <option value="engagement-desc">Engagement Rate</option>
              <option value="name">Creator Name</option>
            </select>
          </div>
        </div>

        {/* Results Count & Email Filter Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 pt-1 font-mono">
          <div className="flex items-center gap-3">
            <span>Showing {filteredInfluencers.length} of {influencers.length} influencers</span>
            <span className="text-slate-600">|</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-purple-400 hover:text-purple-300 font-sans select-none">
              <input
                type="checkbox"
                checked={withEmailOnly}
                onChange={(e) => setWithEmailOnly(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-0 bg-slate-800 cursor-pointer w-3.5 h-3.5"
              />
              <span>With email only ({influencers.filter(i => Boolean(i.email && i.email.trim())).length})</span>
            </label>
          </div>

          {(searchTerm || platformFilter !== 'all' || nicheFilter !== 'all' || followerTier !== 'all' || minEngagement > 0 || locationFilter !== 'all' || withEmailOnly) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPlatformFilter('all');
                setNicheFilter('all');
                setFollowerTier('all');
                setMinEngagement(0);
                setLocationFilter('all');
                setWithEmailOnly(false);
              }}
              className="text-purple-400 hover:text-purple-300 font-sans cursor-pointer underline text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Influencer Grid (Desktop: 3, Tablet: 2, Mobile: 1) */}
      {filteredInfluencers.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#111726] border border-slate-800 text-center">
          <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Creators Matched</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Try adjusting your search query, clearing specific filters, or adding a new creator to the database.
          </p>
          <button
            onClick={() => setOpenCreateInfluencerModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-900/30 transition-colors cursor-pointer"
          >
            Add New Creator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInfluencers.map((influencer) => (
            <InfluencerCard
              key={influencer.id}
              influencer={influencer}
              onViewProfile={(inf) => setSelectedInfluencer(inf)}
              onAddToCampaign={(inf) => onAddToCampaign(inf)}
              onGenerateOutreach={(inf) => onGenerateOutreach(inf)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
