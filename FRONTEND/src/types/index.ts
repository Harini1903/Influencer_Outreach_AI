export interface Influencer {
  id: number;
  username: string;
  platform: string;
  full_name: string | null;
  email: string | null;
  bio: string | null;
  niche: string | null;
  location: string | null;
  follower_count: number;
  engagement_rate: string | number | null;
  profile_url: string | null;
  channel_id?: string | null;
  average_views?: number | null;
  videos_analysed?: number | null;
  last_upload_at?: string | null;
}

export interface DiscoveryResult {
  message: string;
  keyword: string;
  niche: string;
  discovered: number;
  qualified: number;
  saved: number;
  influencers: Influencer[];
}

export interface InfluencerCreate {
  username: string;
  platform: string;
  full_name?: string | null;
  email?: string | null;
  bio?: string | null;
  niche?: string | null;
  location?: string | null;
  follower_count?: number;
  engagement_rate?: number | string | null;
  profile_url?: string | null;
}

export interface Campaign {
  id: number;
  brand_name: string;
  industry: string | null;
  target_niche: string | null;
  target_location: string | null;
  min_followers: number | null;
  max_followers: number | null;
  min_engagement_rate: number | null;
  campaign_description: string | null;
  status?: string;
  created_at?: string;
}

export interface CampaignCreate {
  brand_name: string;
  industry?: string | null;
  target_niche?: string | null;
  target_location?: string | null;
  min_followers?: number | null;
  max_followers?: number | null;
  min_engagement_rate?: number | null;
  campaign_description?: string | null;
}

export interface MatchCandidate {
  influencer_id: number;
  name: string;
  username: string;
  platform: string;
  niche: string;
  location: string | null;
  followers: number;
  average_views?: number;
  engagement_rate: number | string;
  profile_url?: string;
  similarity?: number;
  match_score: number;
  recommendation?: string;
  reasons: string[];
  strengths?: string[];
  concerns?: string[];
}

export interface MatchResponse {
  message?: string;
  candidates_considered?: number;
  matches_returned?: number;
  matches: MatchCandidate[];
}

export interface CampaignMatchRequest {
  campaign_description?: string | null;
  product?: string | null;
  niche?: string | null;
  target_audience?: string | null;
  content_style?: string | null;
  location?: string | null;
  platform?: string | null;
  min_followers?: number | null;
  max_followers?: number | null;
  min_engagement?: number | null;
  limit?: number;
}

export interface OutreachRecord {
  id: number;
  campaign_id: number;
  influencer_id: number;
  subject: string;
  message: string;
  status: 'draft' | 'approved' | 'sent' | 'declined' | string;
  recipient_email?: string | null;
  sent_at?: string | null;
  created_at?: string;
}

export type PageView =
  | 'landing'
  | 'dashboard'
  | 'discover'
  | 'campaigns'
  | 'matching'
  | 'outreach'
  | 'analytics'
  | 'assistant'
  | 'settings';
