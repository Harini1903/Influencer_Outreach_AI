import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Influencer, Campaign, PageView, MatchCandidate } from '../types';
import { api, ApiError, API_BASE_URL } from '../services/api';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  currentView: PageView;
  setCurrentView: (view: PageView) => void;
  influencers: Influencer[];
  campaigns: Campaign[];
  rawCampaigns: Campaign[];
  loadingData: boolean;
  backendConnected: boolean | null;
  backendError: string | null;
  selectedInfluencer: Influencer | null;
  setSelectedInfluencer: (inf: Influencer | null) => void;
  selectedCampaign: Campaign | null;
  setSelectedCampaign: (camp: Campaign | null) => void;
  targetOutreach: { influencer?: Influencer | MatchCandidate; campaignId?: number } | null;
  setTargetOutreach: (target: { influencer?: Influencer | MatchCandidate; campaignId?: number } | null) => void;
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  openCreateCampaignModal: boolean;
  setOpenCreateCampaignModal: (open: boolean) => void;
  openCreateInfluencerModal: boolean;
  setOpenCreateInfluencerModal: (open: boolean) => void;
  apiBaseUrl: string;
  hideDummyData: boolean;
  setHideDummyData: (hide: boolean) => void;
  deduplicateCampaigns: boolean;
  setDeduplicateCampaigns: (dedup: boolean) => void;
  dismissCampaign: (id: number) => void;
  restoreDismissedCampaigns: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<PageView>('landing');
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [rawCampaigns, setRawCampaigns] = useState<Campaign[]>([]);
  const [hideDummyData, setHideDummyData] = useState<boolean>(() => {
    return localStorage.getItem('hide_dummy_campaigns') !== 'false';
  });
  const [deduplicateCampaigns, setDeduplicateCampaigns] = useState<boolean>(() => {
    return localStorage.getItem('dedup_campaigns') !== 'false';
  });
  const [dismissedCampaignIds, setDismissedCampaignIds] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('dismissed_campaign_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [targetOutreach, setTargetOutreach] = useState<{ influencer?: Influencer | MatchCandidate; campaignId?: number } | null>(null);

  const [openCreateCampaignModal, setOpenCreateCampaignModal] = useState<boolean>(false);
  const [openCreateInfluencerModal, setOpenCreateInfluencerModal] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const res = await api.checkHealth();
      const isHealthy = res.status === 'healthy';
      setBackendConnected(isHealthy);
      setBackendError(null);
      return isHealthy;
    } catch (err) {
      setBackendConnected(false);
      setBackendError(err instanceof Error ? err.message : 'Backend unreachable');
      return false;
    }
  }, []);

  const refreshData = useCallback(async () => {
    setLoadingData(true);
    setBackendError(null);

    try {
      const [healthResult, influencersResult, campaignsResult] =
        await Promise.allSettled([
          api.checkHealth(),
          api.getInfluencers(0, 100),
          api.getCampaigns(),
        ]);

      const healthOk =
        healthResult.status === 'fulfilled' &&
        healthResult.value.status === 'healthy';

      const dataOk =
        influencersResult.status === 'fulfilled' ||
        campaignsResult.status === 'fulfilled';

      // If health OR actual backend API data responds,
      // consider the backend connected.
      if (healthOk || dataOk) {
        setBackendConnected(true);
        setBackendError(null);
      } else {
        setBackendConnected(false);
        setBackendError(
          'Backend instance on Render is starting up or unreachable.'
        );
      }

      if (influencersResult.status === 'fulfilled') {
        setInfluencers(influencersResult.value);
      }

      if (campaignsResult.status === 'fulfilled') {
        setRawCampaigns(campaignsResult.value);
      }
    } catch (err: unknown) {
      setBackendConnected(false);

      if (err instanceof ApiError) {
        setBackendError(err.message);
      } else {
        setBackendError('Backend unreachable');
      }
    } finally {
      setLoadingData(false);
    }
  }, []);
  
  const dismissCampaign = useCallback((id: number) => {
    setDismissedCampaignIds((prev) => {
      const next = [...new Set([...prev, id])];
      try {
        localStorage.setItem('dismissed_campaign_ids', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    addToast(`Campaign #${id} hidden from your active view.`, 'info');
  }, [addToast]);

  const restoreDismissedCampaigns = useCallback(() => {
    setDismissedCampaignIds([]);
    try {
      localStorage.removeItem('dismissed_campaign_ids');
    } catch {
      // ignore
    }
    addToast('All dismissed test campaigns restored.', 'success');
  }, [addToast]);

  const handleSetHideDummy = useCallback((hide: boolean) => {
    setHideDummyData(hide);
    try {
      localStorage.setItem('hide_dummy_campaigns', String(hide));
    } catch {
      // ignore
    }
  }, []);

  const handleSetDeduplicate = useCallback((dedup: boolean) => {
    setDeduplicateCampaigns(dedup);
    try {
      localStorage.setItem('dedup_campaigns', String(dedup));
    } catch {
      // ignore
    }
  }, []);

  const campaigns = React.useMemo(() => {
    const filtered = rawCampaigns.filter((c) => {
      if (dismissedCampaignIds.includes(c.id)) return false;
      if (hideDummyData && (c.brand_name?.trim().toLowerCase() === 'string' || !c.brand_name)) return false;
      return true;
    });

    if (!deduplicateCampaigns) return filtered;

    // Retain only the latest/highest ID campaign for each unique brand name
    const brandMap = new Map<string, Campaign>();
    for (const camp of filtered) {
      const key = (camp.brand_name || '').trim().toLowerCase();
      if (!key) continue;
      const existing = brandMap.get(key);
      if (!existing || camp.id > existing.id) {
        brandMap.set(key, camp);
      }
    }
    return Array.from(brandMap.values()).sort((a, b) => b.id - a.id);
  }, [rawCampaigns, dismissedCampaignIds, hideDummyData, deduplicateCampaigns]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        influencers,
        campaigns,
        rawCampaigns,
        loadingData,
        backendConnected,
        backendError,
        selectedInfluencer,
        setSelectedInfluencer,
        selectedCampaign,
        setSelectedCampaign,
        targetOutreach,
        setTargetOutreach,
        toasts,
        addToast,
        removeToast,
        refreshData,
        checkConnection,
        openCreateCampaignModal,
        setOpenCreateCampaignModal,
        openCreateInfluencerModal,
        setOpenCreateInfluencerModal,
        apiBaseUrl: API_BASE_URL,
        hideDummyData,
        setHideDummyData: handleSetHideDummy,
        deduplicateCampaigns,
        setDeduplicateCampaigns: handleSetDeduplicate,
        dismissCampaign,
        restoreDismissedCampaigns,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
