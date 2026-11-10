import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Influencer } from '../../types';
import { X, FolderPlus, Sparkles, Cpu, Check, Megaphone } from 'lucide-react';

interface AddToCampaignModalProps {
  influencer: Influencer | null;
  onClose: () => void;
}

export const AddToCampaignModal: React.FC<AddToCampaignModalProps> = ({
  influencer,
  onClose,
}) => {
  const {
    campaigns,
    setSelectedCampaign,
    setTargetOutreach,
    setCurrentView,
    addToast,
    setOpenCreateCampaignModal,
  } = useApp();

  const [selectedId, setSelectedId] = useState<number | null>(
    campaigns.length > 0 ? campaigns[0].id : null
  );

  if (!influencer) return null;

  const handleStartOutreach = () => {
    if (!selectedId) {
      addToast('Please select a campaign first.', 'error');
      return;
    }
    const camp = campaigns.find((c) => c.id === selectedId);
    setSelectedCampaign(camp || null);
    setTargetOutreach({ influencer, campaignId: selectedId });
    setCurrentView('outreach');
    addToast(`Ready to generate outreach for ${influencer.full_name || influencer.username}!`, 'info');
    onClose();
  };

  const handleRunMatching = () => {
    if (!selectedId) {
      addToast('Please select a campaign first.', 'error');
      return;
    }
    const camp = campaigns.find((c) => c.id === selectedId);
    setSelectedCampaign(camp || null);
    setCurrentView('matching');
    addToast(`Evaluating match score for ${camp?.brand_name}...`, 'info');
    onClose();
  };

  const handleSaveOnly = () => {
    const camp = campaigns.find((c) => c.id === selectedId);
    addToast(
      `Added ${influencer.full_name || influencer.username} to "${camp?.brand_name || 'Campaign'}" shortlist!`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0f1422] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Creator to Campaign</h3>
              <p className="text-xs text-slate-400">
                Pair @{influencer.username} with a live marketing campaign
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Creator Mini Strip */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="w-10 h-10 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-200">
              {(influencer.full_name || influencer.username).substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-white truncate">
                {influencer.full_name || influencer.username}
              </h4>
              <p className="text-xs text-slate-400">
                {influencer.platform} · {influencer.niche || 'Creator'} · {influencer.follower_count.toLocaleString()} followers
              </p>
            </div>
          </div>

          {/* Campaign Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Active Campaign
            </label>

            {campaigns.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
                <Megaphone className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400 mb-3">No active campaigns found in database.</p>
                <button
                  onClick={() => {
                    onClose();
                    setOpenCreateCampaignModal(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors cursor-pointer"
                >
                  Create Campaign First
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    onClick={() => setSelectedId(camp.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedId === camp.id
                        ? 'bg-purple-600/15 border-purple-500/50 text-white'
                        : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-white truncate">{camp.brand_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {camp.industry || 'General'} · {camp.target_niche || 'All Niches'} · {camp.target_location || 'Global'}
                      </p>
                    </div>
                    {selectedId === camp.id && (
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Action Choices */}
          {campaigns.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Next Steps
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleStartOutreach}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Outreach</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunMatching}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Run AI Matching</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveOnly}
                className="w-full py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
              >
                Save to shortlist without opening outreach
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
