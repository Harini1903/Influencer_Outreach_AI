import {
  Influencer,
  InfluencerCreate,
  DiscoveryResult,
  Campaign,
  CampaignCreate,
  CampaignMatchRequest,
  MatchResponse,
  OutreachRecord,
} from '../types';

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) ||
  'https://influencer-outreach-ai.onrender.com';

// Custom API error class to cleanly format backend messages
export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // In dev / preview environments, prefer the same-origin proxy to eliminate CORS rejection
  // if the backend's allowed origins list hasn't added this preview domain yet.
  const isDevOrPreview = typeof window !== 'undefined' && 
    (window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'));

  const primaryUrl = isDevOrPreview
    ? cleanEndpoint
    : `${API_BASE_URL.replace(/\/$/, '')}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const executeFetch = async (targetUrl: string) => {
    return await fetch(targetUrl, {
      ...options,
      headers,
    });
  };

  try {
    let res: Response;
    try {
      res = await executeFetch(primaryUrl);
    } catch (fetchErr) {
      // If primary failed and it wasn't the proxy, retry via proxy
      if (primaryUrl !== cleanEndpoint) {
        res = await executeFetch(cleanEndpoint);
      } else {
        throw fetchErr;
      }
    }

    if (!res.ok) {
      // If direct request returned 400 Disallowed CORS origin, retry via same-origin proxy
      if (res.status === 400 && primaryUrl !== cleanEndpoint) {
        try {
          const retryRes = await executeFetch(cleanEndpoint);
          if (retryRes.ok) {
            return await retryRes.json();
          }
        } catch {
          // ignore retry failure and continue with original response error
        }
      }

      let errorMessage = `Request failed with status ${res.status}`;
      let errorDetails: unknown = null;
      try {
        const errorJson = await res.json();
        errorDetails = errorJson;
        if (errorJson.detail) {
          if (typeof errorJson.detail === 'string') {
            errorMessage = errorJson.detail;
          } else if (Array.isArray(errorJson.detail)) {
            errorMessage = errorJson.detail.map((d: { msg?: string }) => d.msg || 'Validation error').join(', ');
          }
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // non-JSON error
      }
      throw new ApiError(errorMessage, res.status, errorDetails);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network connection error';
    throw new ApiError(
      message.includes('Failed to fetch')
        ? 'Unable to connect to the backend server. The instance on Render may be waking up, please wait a moment.'
        : message
    );
  }
}

export const api = {
  // Health
  async checkHealth(): Promise<{ status: string; service?: string }> {
    return request<{ status: string; service?: string }>('/health');
  },

  // Influencers
  async getInfluencers(skip = 0, limit = 50): Promise<Influencer[]> {
    return request<Influencer[]>(`/api/v1/influencers/?skip=${skip}&limit=${limit}`);
  },

  async getInfluencer(id: number): Promise<Influencer> {
    return request<Influencer>(`/api/v1/influencers/${id}`);
  },

  async createInfluencer(payload: InfluencerCreate): Promise<Influencer> {
    return request<Influencer>('/api/v1/influencers/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateInfluencer(id: number, payload: Partial<InfluencerCreate>): Promise<Influencer> {
    return request<Influencer>(`/api/v1/influencers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteInfluencer(id: number): Promise<{ success?: boolean; message?: string }> {
    return request<{ success?: boolean; message?: string }>(`/api/v1/influencers/${id}`, {
      method: 'DELETE',
    });
  },

  async discoverInfluencers(payload: {
    keyword: string;
    niche: string;
    max_results?: number;
  }): Promise<DiscoveryResult> {
    return request<DiscoveryResult>(
      '/api/v1/influencers/discover',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return request<Campaign[]>('/api/v1/campaigns/');
  },

  async createCampaign(payload: CampaignCreate): Promise<Campaign> {
    return request<Campaign>('/api/v1/campaigns/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Matching
  async matchSavedCampaign(campaignId: number): Promise<MatchResponse> {
    return request<MatchResponse>(`/api/v1/campaigns/${campaignId}/match`, {
      method: 'POST',
    });
  },

  async matchCustom(payload: CampaignMatchRequest): Promise<MatchResponse> {
    return request<MatchResponse>('/api/v1/matching/match', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Outreach
  async generateOutreach(campaignId: number, influencerId: number): Promise<OutreachRecord> {
    return request<OutreachRecord>(
      `/api/v1/outreach/generate?campaign_id=${campaignId}&influencer_id=${influencerId}`,
      {
        method: 'POST',
      }
    );
  },

  async getCampaignOutreach(campaignId: number): Promise<OutreachRecord[]> {
    return request<OutreachRecord[]>(`/api/v1/outreach/campaign/${campaignId}`);
  },

  async updateOutreachStatus(outreachId: number, status: string): Promise<OutreachRecord> {
    return request<OutreachRecord>(
      `/api/v1/outreach/${outreachId}/status?status=${encodeURIComponent(status)}`,
      {
        method: 'PATCH',
      }
    );
  },

  async sendOutreach(outreachId: number): Promise<{ message?: string; detail?: string }> {
    return request<{ message?: string; detail?: string }>(`/api/v1/outreach/${outreachId}/send`, {
      method: 'POST',
    });
  },
};
