import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Influencer, Campaign, OutreachRecord } from '../types';
import { api, ApiError } from '../services/api';
import { formatFollowers, formatEngagementRate, getPlatformBadge, getInitials } from '../utils/formatters';
import {
  Mail,
  Sparkles,
  Copy,
  Send,
  RefreshCw,
  Edit3,
  Check,
  CheckCircle2,
  Users,
  Percent,
  MapPin,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';

export const OutreachPage: React.FC = () => {
  const {
    influencers,
    campaigns,
    selectedCampaign,
    setSelectedCampaign,
    targetOutreach,
    addToast,
    refreshData,
    setOpenCreateCampaignModal,
  } = useApp();

  // Filter option: Only show profiles with email (enabled by default)
  const [onlyWithEmail, setOnlyWithEmail] = useState<boolean>(true);
  const [manualEmailInput, setManualEmailInput] = useState<string>('');
  const [savingEmail, setSavingEmail] = useState<boolean>(false);

  // Compute selectable influencers based on onlyWithEmail
  const selectableInfluencers = React.useMemo(() => {
    if (!onlyWithEmail) return influencers;
    return influencers.filter((inf) => Boolean(inf.email && inf.email.trim()));
  }, [influencers, onlyWithEmail]);

  // Selected State
  const [selectedCampId, setSelectedCampId] = useState<number | ''>(
    targetOutreach?.campaignId || selectedCampaign?.id || (campaigns.length > 0 ? campaigns[0].id : '')
  );

  const targetInfluencerId = targetOutreach?.influencer
    ? 'id' in targetOutreach.influencer
      ? targetOutreach.influencer.id
      : targetOutreach.influencer.influencer_id
    : undefined;

  const [selectedInfId, setSelectedInfId] = useState<number | ''>(() => {
    if (targetInfluencerId) return targetInfluencerId;
    const firstWithEmail = influencers.find((i) => i.email && i.email.trim());
    return firstWithEmail ? firstWithEmail.id : (influencers.length > 0 ? influencers[0].id : '');
  });

  // Automatically keep selectedInfId valid when filter changes
  useEffect(() => {
    if (onlyWithEmail && selectableInfluencers.length > 0) {
      const isCurrentInSelectable = selectableInfluencers.some((i) => i.id === selectedInfId);
      if (!isCurrentInSelectable) {
        setSelectedInfId(selectableInfluencers[0].id);
      }
    }
  }, [onlyWithEmail, selectableInfluencers, selectedInfId]);

  // Generator Options
  const [tone, setTone] = useState<'Professional' | 'Friendly' | 'Casual'>('Professional');
  const [goal, setGoal] = useState<'Collaboration' | 'Sponsorship' | 'Product Promotion'>('Collaboration');

  // Generated message state
  const [generating, setGenerating] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<OutreachRecord | null>(null);
  const [subjectText, setSubjectText] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  // Sending state
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Outreach History for this campaign
  const [campaignOutreaches, setCampaignOutreaches] = useState<OutreachRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Find active records
  const currentInfluencer: Influencer | undefined =
    influencers.find((i) => i.id === selectedInfId) ||
    (targetOutreach?.influencer && targetInfluencerId === selectedInfId
      ? ('id' in targetOutreach.influencer
          ? (targetOutreach.influencer as Influencer)
          : {
              id: targetOutreach.influencer.influencer_id,
              username: targetOutreach.influencer.username,
              platform: targetOutreach.influencer.platform,
              full_name: targetOutreach.influencer.name,
              email: null,
              bio: null,
              niche: targetOutreach.influencer.niche,
              location: targetOutreach.influencer.location,
              follower_count: targetOutreach.influencer.followers,
              engagement_rate: targetOutreach.influencer.engagement_rate,
              profile_url: targetOutreach.influencer.profile_url || null,
            })
      : undefined);

  const currentCamp: Campaign | undefined = campaigns.find((c) => c.id === selectedCampId);

  // Load outreach history whenever selected campaign changes
  useEffect(() => {
    async function loadHistory() {
      if (!selectedCampId) return;
      setLoadingHistory(true);
      try {
        const records = await api.getCampaignOutreach(Number(selectedCampId));
        if (Array.isArray(records)) {
          setCampaignOutreaches(records);
          // If no current record is active, set the newest
          if (records.length > 0 && !currentRecord) {
            const latest = records[0];
            setCurrentRecord(latest);
            setSubjectText(latest.subject);
            setMessageBody(latest.message);
            setRecipientEmail(latest.recipient_email || currentInfluencer?.email || '');
          }
        }
      } catch {
        // history fetch error
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, [selectedCampId]);

  // Sync recipient email when influencer changes
  useEffect(() => {
    if (currentInfluencer?.email) {
      setRecipientEmail(currentInfluencer.email);
    }
  }, [currentInfluencer]);

  // Generate AI Outreach
  const handleGenerate = async () => {
    if (!selectedCampId || !selectedInfId) {
      addToast('Please select both a campaign and an influencer.', 'error');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const generated = await api.generateOutreach(Number(selectedCampId), Number(selectedInfId));
      setCurrentRecord(generated);
      setSubjectText(generated.subject);
      setMessageBody(generated.message);
      setIsEditing(false);
      addToast('AI outreach message generated successfully!', 'success');

      // Refresh campaign outreach list
      const updatedList = await api.getCampaignOutreach(Number(selectedCampId));
      if (Array.isArray(updatedList)) setCampaignOutreaches(updatedList);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to generate outreach. Backend service might be busy.');
      }
    } finally {
      setGenerating(false);
    }
  };

  // Save or update an influencer's email in the backend database
  const handleSaveInfluencerEmail = async (emailToSave: string) => {
    if (!currentInfluencer || !emailToSave.trim()) return;
    setSavingEmail(true);
    try {
      await api.updateInfluencer(currentInfluencer.id, { email: emailToSave.trim() });
      setRecipientEmail(emailToSave.trim());
      setManualEmailInput('');
      setError(null);
      addToast(`Saved contact email for ${currentInfluencer.full_name || currentInfluencer.username}!`, 'success');
      await refreshData();
    } catch (err: unknown) {
      addToast(err instanceof ApiError ? err.message : 'Could not save email to creator profile', 'error');
    } finally {
      setSavingEmail(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    const fullText = `Subject: ${subjectText}\n\n${messageBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    addToast('Outreach message copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Update Status to Approved
  const handleApprove = async () => {
    if (!currentRecord) return;
    try {
      const updated = await api.updateOutreachStatus(currentRecord.id, 'approved');
      setCurrentRecord(updated);
      addToast('Outreach marked as approved!', 'success');
      const updatedList = await api.getCampaignOutreach(Number(selectedCampId));
      if (Array.isArray(updatedList)) setCampaignOutreaches(updatedList);
    } catch (err: unknown) {
      addToast(err instanceof ApiError ? err.message : 'Could not approve outreach', 'error');
    }
  };

  // Open directly in Gmail web composer with pre-filled pitch
  const handleOpenGmail = () => {
    if (!recipientEmail) {
      addToast('Recipient email is missing.', 'error');
      return;
    }
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(messageBody)}`;
    window.open(gmailUrl, '_blank');
    addToast('Opening Gmail compose window with pre-filled message!', 'info');
  };

  // Mark as sent in database manually (e.g. after sending via personal/work Gmail)
  const handleMarkAsSent = async () => {
    if (!currentRecord) return;
    try {
      const updated = await api.updateOutreachStatus(currentRecord.id, 'sent');
      setCurrentRecord(updated);
      setError(null);
      addToast('Outreach marked as sent in campaign analytics!', 'success');
      const updatedList = await api.getCampaignOutreach(Number(selectedCampId));
      if (Array.isArray(updatedList)) setCampaignOutreaches(updatedList);
    } catch (err: unknown) {
      addToast(err instanceof ApiError ? err.message : 'Could not update status', 'error');
    }
  };

  // Send Approved Outreach
  const handleSend = async () => {
    if (!currentRecord) return;
    setSending(true);
    setError(null);

    try {
      // First ensure status is approved
      await api.updateOutreachStatus(currentRecord.id, 'approved');
      const res = await api.sendOutreach(currentRecord.id);
      addToast(res.message || 'Outreach sent successfully via backend!', 'success');
      // Refresh
      const updated = await api.updateOutreachStatus(currentRecord.id, 'sent');
      setCurrentRecord(updated);
      const updatedList = await api.getCampaignOutreach(Number(selectedCampId));
      if (Array.isArray(updatedList)) setCampaignOutreaches(updatedList);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Outreach could not be dispatched.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
          AI Outreach
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Generate highly personalized collaboration pitches tailored to creator engagement and tone.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Influencer Information & Selectors (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Target Selectors Card */}
          <div className="p-5 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Outreach Targets
            </h3>

            {/* Campaign Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Active Campaign
              </label>
              {campaigns.length === 0 ? (
                <button
                  onClick={() => setOpenCreateCampaignModal(true)}
                  className="text-xs text-purple-400 underline font-semibold"
                >
                  Create Campaign First
                </button>
              ) : (
                <select
                  value={selectedCampId}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : '';
                    setSelectedCampId(id);
                    const c = campaigns.find((camp) => camp.id === id);
                    setSelectedCampaign(c || null);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id} · {c.brand_name} ({c.target_niche || 'All Niches'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Influencer Select with Email Filter Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Target Influencer
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-purple-400 hover:text-purple-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyWithEmail}
                    onChange={(e) => setOnlyWithEmail(e.target.checked)}
                    className="rounded border-slate-700 text-purple-600 focus:ring-0 bg-slate-800 cursor-pointer w-3.5 h-3.5"
                  />
                  <span>Only profiles with email ({influencers.filter(i => Boolean(i.email && i.email.trim())).length}/{influencers.length})</span>
                </label>
              </div>

              {selectableInfluencers.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  No creators with email found.{' '}
                  <button
                    type="button"
                    onClick={() => setOnlyWithEmail(false)}
                    className="text-purple-400 underline font-semibold cursor-pointer"
                  >
                    Show all creators
                  </button>
                </div>
              ) : (
                <select
                  value={selectedInfId}
                  onChange={(e) => setSelectedInfId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 font-medium"
                >
                  {selectableInfluencers.map((inf) => (
                    <option key={inf.id} value={inf.id}>
                      {inf.email ? '✉ ' : '⚠ '} {inf.full_name || inf.username} {inf.email ? `(${inf.email})` : '(No email listed)'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Influencer Information Card */}
          {currentInfluencer ? (
            <div className="p-5 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-200 shrink-0">
                    {getInitials(currentInfluencer.full_name || currentInfluencer.username)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      {currentInfluencer.full_name || currentInfluencer.username}
                    </h3>
                    <p className="text-xs text-slate-400">@{currentInfluencer.username}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getPlatformBadge(currentInfluencer.platform).bg} ${getPlatformBadge(currentInfluencer.platform).color}`}>
                  {getPlatformBadge(currentInfluencer.platform).label}
                </span>
              </div>

              {/* Email Status Card */}
              {currentInfluencer.email ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono truncate">{currentInfluencer.email}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 whitespace-nowrap">
                    ✓ Email Ready
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>No contact email found in YouTube profile</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Add their business email to save to database and enable direct outreach:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={manualEmailInput}
                      onChange={(e) => setManualEmailInput(e.target.value)}
                      placeholder="e.g. contact@channel.com"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveInfluencerEmail(manualEmailInput)}
                      disabled={savingEmail || !manualEmailInput.trim()}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {savingEmail ? 'Saving...' : 'Save Email'}
                    </button>
                  </div>
                </div>
              )}

              {/* Influencer Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Followers</span>
                  <span className="text-sm font-bold text-white font-mono tabular-nums flex items-center gap-1 mt-0.5">
                    <Users className="w-3 h-3 text-purple-400" />
                    {formatFollowers(currentInfluencer.follower_count)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Engagement Rate</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums flex items-center gap-1 mt-0.5">
                    <Percent className="w-3 h-3" />
                    {formatEngagementRate(currentInfluencer.engagement_rate)}
                  </span>
                </div>
              </div>

              {/* Unboxed Metadata */}
              <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                {currentInfluencer.niche && (
                  <div>
                    <span className="text-slate-500">Niche:</span>{' '}
                    <span className="text-slate-300 font-medium">{currentInfluencer.niche}</span>
                  </div>
                )}
                {currentInfluencer.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-300">{currentInfluencer.location}</span>
                  </div>
                )}
                {currentInfluencer.profile_url && (
                  <div>
                    <a
                      href={currentInfluencer.profile_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
                    >
                      <span>Public Channel Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Bio summary */}
              {currentInfluencer.bio && (
                <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {currentInfluencer.bio}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#111726] border border-slate-800 text-center text-xs text-slate-500">
              No influencer selected.
            </div>
          )}

          {/* Campaign Outreach History Accordion */}
          {campaignOutreaches.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>Campaign Messages ({campaignOutreaches.length})</span>
                </h4>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {campaignOutreaches.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCurrentRecord(item);
                      setSubjectText(item.subject);
                      setMessageBody(item.message);
                      setSelectedInfId(item.influencer_id);
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      currentRecord?.id === item.id
                        ? 'bg-purple-900/20 border-purple-500/40 text-white'
                        : 'bg-slate-900/50 border-slate-800/60 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200 truncate pr-2">
                        {item.subject}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          item.status === 'sent'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.status === 'approved'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Message Generator & Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Tone & Goal Controls Card */}
          <div className="p-5 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tone Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Tone of Voice
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                  {(['Professional', 'Friendly', 'Casual'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                        tone === t
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Goal */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Message Goal
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                  {(['Collaboration', 'Sponsorship', 'Product Promotion'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGoal(g)}
                      className={`py-1.5 text-[11px] font-medium rounded-lg transition-all truncate px-1 cursor-pointer ${
                        goal === g
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={g}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Trigger Button */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Model: Gemini AI via Render Backend
              </span>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !selectedCampId || !selectedInfId}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-900/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing Outreach with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Message</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Message Editor Card */}
          <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Outreach Editor</span>
                {currentRecord && (
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-medium ${
                      currentRecord.status === 'sent'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : currentRecord.status === 'approved'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    Status: {currentRecord.status}
                  </span>
                )}
              </div>

              {/* Action buttons: Copy, Edit, Regenerate */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={!messageBody}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                    isEditing
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle Edit Mode"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isEditing ? 'Done' : 'Edit'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || !selectedCampId || !selectedInfId}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Regenerate message"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!messageBody}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Recipient Email Status or Add Input */}
            {!recipientEmail ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-semibold text-white">Recipient email not set for this creator</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-amber-400/90 bg-amber-500/20 px-2 py-0.5 rounded">
                    Required to Send
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Enter the creator&apos;s email address to save it to their profile and enable sending:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={manualEmailInput}
                    onChange={(e) => setManualEmailInput(e.target.value)}
                    placeholder="e.g. contact@channel.com"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveInfluencerEmail(manualEmailInput)}
                    disabled={!manualEmailInput.trim() || savingEmail}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {savingEmail ? 'Saving...' : 'Save & Attach'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Recipient: <strong className="font-mono text-white">{recipientEmail}</strong></span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                  ✓ Ready to Dispatch
                </span>
              </div>
            )}

            {/* Error banner if send failed or message failed */}
            {error && error !== 'Recipient email is not available.' && (
              error.includes('Email sending failed') ? (
                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Direct Server Email Delivery Notice</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Direct server-side email dispatch requires Gmail OAuth or SMTP credentials on your Render server. You can instantly dispatch this pitch using your own Gmail in 1 click, or mark it as sent in your campaign tracker:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOpenGmail}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-xs transition-all cursor-pointer shadow-sm shadow-purple-900/30"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open & Send in Gmail</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleMarkAsSent}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors cursor-pointer border border-slate-700"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mark as Sent in Database</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors cursor-pointer border border-slate-700"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Message</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )
            )}

            {/* Subject Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Email Subject
              </label>
              <input
                type="text"
                value={subjectText}
                onChange={(e) => setSubjectText(e.target.value)}
                placeholder="Subject line will appear here after generation..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-medium focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Message Body Editor */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Personalized Message Content
              </label>
              <textarea
                rows={10}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Click 'Generate AI Message' above to create a personalized pitch with our backend AI engine..."
                className="w-full p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-sm leading-relaxed focus:outline-none focus:border-purple-500 transition-colors font-sans resize-y"
              />
            </div>

            {/* Recipient Email field for dispatch */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Recipient Contact Email
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="creator@channel.com (required for backend send)"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenGmail}
                    disabled={!recipientEmail || !messageBody}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-200 bg-purple-950/40 hover:bg-purple-900/60 rounded-lg border border-purple-500/30 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    title="Open pre-filled pitch in Gmail compose"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                    <span>Open in Gmail</span>
                  </button>

                  {currentRecord?.status !== 'approved' && currentRecord?.status !== 'sent' && currentRecord?.status !== 'responded' && (
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={!currentRecord}
                      className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      Approve
                    </button>
                  )}

                  {currentRecord?.status !== 'sent' && currentRecord?.status !== 'responded' ? (
                    <button
                      type="button"
                      onClick={handleMarkAsSent}
                      disabled={!currentRecord}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 rounded-lg border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      title="Mark as Sent in database and activate campaign analytics"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mark Sent</span>
                    </button>
                  ) : currentRecord?.status === 'sent' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!currentRecord) return;
                        try {
                          const updated = await api.updateOutreachStatus(currentRecord.id, 'responded');
                          setCurrentRecord(updated);
                          addToast('Marked creator as responded! Response rate updated.', 'success');
                          const updatedList = await api.getCampaignOutreach(Number(selectedCampId));
                          if (Array.isArray(updatedList)) setCampaignOutreaches(updatedList);
                        } catch {
                          addToast('Could not update status to responded', 'error');
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 rounded-lg border border-cyan-500/30 transition-all cursor-pointer whitespace-nowrap"
                      title="Mark as Responded once creator replies"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Creator Responded</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Responded
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !currentRecord}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Note: Server-side send triggers the backend Gmail API. You can also use &quot;Open in Gmail&quot; to send directly from your browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
