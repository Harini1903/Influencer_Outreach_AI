import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api, ApiError } from '../../services/api';
import { InfluencerCreate } from '../../types';
import { X, UserPlus, Loader2 } from 'lucide-react';

interface CreateInfluencerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateInfluencerModal: React.FC<CreateInfluencerModalProps> = ({ isOpen, onClose }) => {
  const { addToast, refreshData } = useApp();

  const [formData, setFormData] = useState<InfluencerCreate>({
    username: '',
    platform: 'youtube',
    full_name: '',
    email: '',
    bio: '',
    niche: 'Tech',
    location: '',
    follower_count: 25000,
    engagement_rate: 3.5,
    profile_url: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      setError('Username/Channel ID is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.createInfluencer({
        username: formData.username.trim(),
        platform: formData.platform.toLowerCase(),
        full_name: formData.full_name?.trim() || null,
        email: formData.email?.trim() || null,
        bio: formData.bio?.trim() || null,
        niche: formData.niche?.trim() || null,
        location: formData.location?.trim() || null,
        follower_count: Number(formData.follower_count) || 0,
        engagement_rate: formData.engagement_rate ? Number(formData.engagement_rate) : null,
        profile_url: formData.profile_url?.trim() || null,
      });

      addToast(`Creator @${formData.username} added successfully!`, 'success');
      await refreshData();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to add creator. Please verify fields.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0f1422] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add New Creator</h3>
              <p className="text-xs text-slate-400">Save an influencer directly to your database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username / Handle <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="mkbhd or UC123..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Platform <span className="text-purple-400">*</span>
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">X / Twitter</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name / Channel Title
              </label>
              <input
                type="text"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Marques Brownlee"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Niche
              </label>
              <input
                type="text"
                value={formData.niche || ''}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                placeholder="e.g. Technology, Fitness, Beauty"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Followers
              </label>
              <input
                type="number"
                min="0"
                value={formData.follower_count ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, follower_count: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Engagement %
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.engagement_rate ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    engagement_rate: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. US, IN, UK"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="creator@business.com"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Profile URL
            </label>
            <input
              type="url"
              value={formData.profile_url || ''}
              onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              placeholder="https://youtube.com/@channel"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Bio / Channel Description
            </label>
            <textarea
              rows={2}
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Focus areas, past sponsorships, audience demographics..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
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
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Creator</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
