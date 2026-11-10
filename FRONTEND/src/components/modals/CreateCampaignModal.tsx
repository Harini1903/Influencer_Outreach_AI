import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api, ApiError } from '../../services/api';
import { CampaignCreate } from '../../types';
import { X, Megaphone, Loader2 } from 'lucide-react';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ isOpen, onClose }) => {
  const { addToast, refreshData } = useApp();

  const [formData, setFormData] = useState<CampaignCreate>({
    brand_name: '',
    industry: 'Health & Wellness',
    target_niche: 'Fitness',
    target_location: 'Global',
    min_followers: 5000,
    max_followers: 150000,
    min_engagement_rate: 2.0,
    campaign_description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand_name.trim()) {
      setError('Please provide a campaign or brand name.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.createCampaign({
        brand_name: formData.brand_name.trim(),
        industry: formData.industry?.trim() || null,
        target_niche: formData.target_niche?.trim() || null,
        target_location: formData.target_location?.trim() || null,
        min_followers: Number(formData.min_followers) || null,
        max_followers: Number(formData.max_followers) || null,
        min_engagement_rate: Number(formData.min_engagement_rate) || null,
        campaign_description: formData.campaign_description?.trim() || null,
      });

      addToast(`Campaign "${formData.brand_name}" created successfully!`, 'success');
      await refreshData();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create campaign. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0f1422] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Campaign</h3>
              <p className="text-xs text-slate-400">Configure campaign parameters for AI influencer matching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Campaign Name / Brand <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.brand_name}
              onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
              placeholder="e.g. FitLife App Summer Launch"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry || ''}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. Health & Fitness, SaaS, Tech"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Niche
              </label>
              <input
                type="text"
                value={formData.target_niche || ''}
                onChange={(e) => setFormData({ ...formData, target_niche: e.target.value })}
                placeholder="e.g. Fitness, Skincare, AI Tech"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Min Followers
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.min_followers ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, min_followers: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="5000"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Followers
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.max_followers ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, max_followers: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="100000"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Min Engagement %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.min_engagement_rate ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_engagement_rate: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="2.0"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Audience / Location
            </label>
            <input
              type="text"
              value={formData.target_location || ''}
              onChange={(e) => setFormData({ ...formData, target_location: e.target.value })}
              placeholder="e.g. US, UK, Chennai, Global"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Campaign Goals & Description
            </label>
            <textarea
              rows={3}
              value={formData.campaign_description || ''}
              onChange={(e) => setFormData({ ...formData, campaign_description: e.target.value })}
              placeholder="Describe your goals, product, and content style expectations..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Campaign...</span>
                </>
              ) : (
                <span>Create Campaign</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
