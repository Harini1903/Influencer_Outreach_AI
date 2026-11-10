import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bot,
  Send,
  Sparkles,
  User,
  ArrowRight,
  Info,
  Compass,
  Megaphone,
  Mail,
  Loader2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: {
    label: string;
    targetView: 'discover' | 'campaigns' | 'matching' | 'outreach' | 'dashboard';
  };
}

export const AssistantPage: React.FC = () => {
  const { influencers, campaigns, setCurrentView, setSelectedCampaign } = useApp();

  const suggestedPrompts = [
    'Find tech influencers with high engagement',
    'Which influencers match my campaign?',
    'Generate an outreach message',
    'Show my active campaigns',
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Hello! I am your Influencer Outreach Copilot. I can analyze your active campaigns, recommend creators from your database, and guide outreach pitches. What would you like to explore today?",
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Contextual response generator using live backend data
    setTimeout(() => {
      const q = query.toLowerCase();
      let reply = '';
      let action: ChatMessage['action'] = undefined;

      if (q.includes('tech') || q.includes('technology')) {
        const techCreators = influencers.filter((i) =>
          (i.niche || '').toLowerCase().includes('tech') || (i.bio || '').toLowerCase().includes('tech')
        );
        if (techCreators.length > 0) {
          reply = `Found ${techCreators.length} tech-related creators in your database! Top recommendation: ${techCreators[0].full_name || techCreators[0].username} (@${techCreators[0].username}) with ${techCreators[0].follower_count.toLocaleString()} followers and an engagement rate of ${techCreators[0].engagement_rate}%.`;
        } else {
          reply = `You currently have ${influencers.length} creators in your database across Beauty and Lifestyle niches. You can use the Discovery tab to ingest tech creators directly.`;
        }
        action = { label: 'Explore Discovery', targetView: 'discover' };
      } else if (q.includes('match') || q.includes('campaign')) {
        if (campaigns.length > 0) {
          const firstCamp = campaigns[0];
          reply = `You currently have ${campaigns.length} campaigns. For "${firstCamp.brand_name}" (${firstCamp.target_niche || 'Fitness'}), our AI matching engine evaluates niche relevance, semantic similarity, and engagement rates.`;
          action = { label: 'Run AI Matching', targetView: 'matching' };
        } else {
          reply = `You don't have any campaigns set up yet. Create a campaign first to enable automatic AI matching.`;
          action = { label: 'Create Campaign', targetView: 'campaigns' };
        }
      } else if (q.includes('outreach') || q.includes('message')) {
        reply = `You can generate customized pitches tailored in Professional, Friendly, or Casual tones. The engine automatically weaves the creator's follower count and engagement metrics into the hook.`;
        action = { label: 'Open Outreach Studio', targetView: 'outreach' };
      } else if (q.includes('active') || q.includes('campaigns')) {
        reply = `Here are your active campaigns: ${campaigns.map((c) => c.brand_name).join(', ') || 'No active campaigns'}. All parameters are synced with your Render backend database.`;
        action = { label: 'Manage Campaigns', targetView: 'campaigns' };
      } else {
        reply = `I analyzed your request against your ${influencers.length} creators and ${campaigns.length} campaigns. How would you like to proceed?`;
        action = { label: 'View Dashboard', targetView: 'dashboard' };
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'assistant',
          text: reply,
          timestamp: 'Just now',
          action,
        },
      ]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
          AI Outreach Assistant
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Chat with your intelligent assistant to discover creators, refine campaigns, and draft pitches.
        </p>
      </div>

      {/* Backend API Endpoint Status Notice */}
      <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">
          <span className="font-semibold block text-white">Backend Integration Status:</span>
          Render backend does not yet expose a dedicated <code className="text-purple-300 font-mono">/api/v1/chat</code> endpoint.
          This copilot operates using real live ingested data from your <code className="text-purple-300 font-mono">/api/v1/influencers/</code> and <code className="text-purple-300 font-mono">/api/v1/campaigns/</code> endpoints with smart client-side execution.
        </div>
      </div>

      {/* Chat Window */}
      <div className="h-[520px] rounded-2xl bg-[#111726] border border-slate-800/80 flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Messages Container */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gradient-to-tr from-purple-800 to-indigo-700 text-white border border-purple-500/30'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {msg.action && (
                  <div className="mt-3 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setCurrentView(msg.action!.targetView)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/80 rounded-lg border border-purple-500/30 transition-all cursor-pointer"
                    >
                      <span>{msg.action.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-800 to-indigo-700 text-white border border-purple-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 rounded-tl-none flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-150" />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-300" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompts Strip */}
        <div className="px-5 py-2.5 bg-slate-900/40 border-t border-slate-800/60 overflow-x-auto flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Try asking:</span>
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors whitespace-nowrap cursor-pointer shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-[#0d121e] border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about creators, campaigns, or outreach strategies..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />

          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="flex items-center justify-center p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
