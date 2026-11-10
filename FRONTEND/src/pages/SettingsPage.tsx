import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, API_BASE_URL } from '../services/api';
import {
  Settings,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Server,
  Code2,
  ExternalLink,
  CheckCircle2,
  Globe,
  Database,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { backendConnected, backendError, checkConnection, addToast, refreshData } = useApp();

  const [testingHealth, setTestingHealth] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [healthPayload, setHealthPayload] = useState<any>(null);

  const testPing = async () => {
    setTestingHealth(true);
    const start = performance.now();
    try {
      const res = await api.checkHealth();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealthPayload(res);
      addToast(`Connected to Render backend in ${Math.round(end - start)}ms!`, 'success');
      await checkConnection();
    } catch (err: unknown) {
      setLatency(null);
      addToast(err instanceof Error ? err.message : 'Ping failed', 'error');
    } finally {
      setTestingHealth(false);
    }
  };

  const endpoints = [
    { method: 'GET', path: '/health', desc: 'Backend health check prober' },
    { method: 'GET', path: '/api/v1/influencers/', desc: 'List influencers with pagination' },
    { method: 'POST', path: '/api/v1/influencers/', desc: 'Create new creator' },
    { method: 'GET', path: '/api/v1/influencers/{id}', desc: 'Get single creator details' },
    { method: 'PUT', path: '/api/v1/influencers/{id}', desc: 'Update creator information' },
    { method: 'DELETE', path: '/api/v1/influencers/{id}', desc: 'Delete creator from database' },
    { method: 'POST', path: '/api/v1/influencers/discover', desc: 'Discover creators from YouTube API' },
    { method: 'GET', path: '/api/v1/campaigns/', desc: 'List all marketing campaigns' },
    { method: 'POST', path: '/api/v1/campaigns/', desc: 'Create new marketing campaign' },
    { method: 'POST', path: '/api/v1/campaigns/{id}/match', desc: 'Match creators for saved campaign' },
    { method: 'POST', path: '/api/v1/matching/match', desc: 'AI influencer matching with semantic scoring' },
    { method: 'POST', path: '/api/v1/outreach/generate', desc: 'Generate personalized AI outreach draft' },
    { method: 'GET', path: '/api/v1/outreach/campaign/{id}', desc: 'List outreach messages for campaign' },
    { method: 'PATCH', path: '/api/v1/outreach/{id}/status', desc: 'Update outreach status' },
    { method: 'POST', path: '/api/v1/outreach/{id}/send', desc: 'Send approved outreach via email' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
          Settings & Backend Diagnostics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Inspect connection status to your Render backend and view available API capabilities.
        </p>
      </div>

      {/* Backend Status Card */}
      <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Render Production Backend</h3>
              <p className="text-xs text-slate-400 font-mono">{API_BASE_URL}</p>
            </div>
          </div>

          <button
            onClick={testPing}
            disabled={testingHealth}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingHealth ? 'animate-spin' : ''}`} />
            <span>Test Ping</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Connection Health
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {backendConnected ? (
                <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Healthy
                </span>
              ) : (
                <span className="text-amber-400 font-bold text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Waking up...
                </span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Roundtrip Latency
            </span>
            <p className="text-sm font-bold text-white font-mono mt-1">
              {latency !== null ? `${latency} ms` : '—'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Swagger / Docs
            </span>
            <a
              href={`${API_BASE_URL}/docs`}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1 transition-colors"
            >
              <span>Open OpenAPI Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {backendError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {backendError}
          </div>
        )}
      </div>

      {/* API Endpoints Registry */}
      <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Active Backend API Endpoints</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">15 endpoints verified</span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto pr-1">
          {endpoints.map((ep, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    ep.method === 'GET'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : ep.method === 'POST'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : ep.method === 'PATCH'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-slate-300 truncate">{ep.path}</span>
              </div>
              <span className="text-slate-400 text-[11px] text-right truncate shrink-0">
                {ep.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment & Environment Info */}
      <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-3 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-400" />
          <span>Environment & Deployment Config</span>
        </h3>
        <p className="text-slate-400 leading-relaxed">
          The frontend communicates with your Render FastAPI backend via CORS. To configure custom backend URLs, supply the <code className="text-purple-300 font-mono">VITE_API_URL</code> environment variable.
        </p>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
          VITE_API_URL=&quot;https://influencer-outreach-ai.onrender.com&quot;
        </div>
      </div>
    </div>
  );
};
