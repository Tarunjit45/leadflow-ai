'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Phone,
  Mail,
  Calendar,
  ShieldAlert,
  Zap,
  Send,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  MessageSquare,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function InboxDashboardPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [leadDetail, setLeadDetail] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [filterStatus]);

  const loadConversations = async () => {
    try {
      const data = await fetchApi(`/conversations/?status=${filterStatus}`);
      setConversations(data);
      if (!selectedConv && data.length > 0) {
        selectConversation(data[0]);
      }
    } catch {
      // Fallback demo mock conversations if API offline
      const mockConvs = [
        {
          id: 'conv_demo_1',
          customer_name: 'Sarah Jenkins',
          customer_id: '+15125559821',
          channel: 'whatsapp',
          status: 'ai_handling',
          last_message_preview: 'Appointment confirmed for tomorrow at 10:00 AM! Tech David is assigned.',
          last_message_at: new Date().toISOString(),
        },
        {
          id: 'conv_demo_2',
          customer_name: 'Robert Miller',
          customer_id: 'web_sess_rmiller',
          channel: 'website_chat',
          status: 'human_handling',
          last_message_preview: 'Dispatcher Marcus has taken over this conversation.',
          last_message_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'conv_demo_3',
          customer_name: 'Elena Vance',
          customer_id: '+15125557731',
          channel: 'whatsapp',
          status: 'ai_handling',
          last_message_preview: 'Hi Elena! Following up to see if you wanted to schedule your seasonal tune-up?',
          last_message_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      setConversations(mockConvs);
      if (!selectedConv && mockConvs.length > 0) {
        selectConversation(mockConvs[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: any) => {
    setSelectedConv(conv);
    try {
      const msgs = await fetchApi(`/conversations/${conv.id}/messages`);
      setMessages(msgs);

      // Load associated lead
      const leads = await fetchApi('/leads/');
      const matchingLead = leads.find((l: any) => l.conversation_id === conv.id);
      setLeadDetail(matchingLead || null);
    } catch {
      // Fallback mock messages
      if (conv.id === 'conv_demo_1') {
        setMessages([
          { id: 'm1', sender_type: 'customer', content: 'Hi! Our AC just started blowing warm air and the outside unit is making a loud noise.' },
          { id: 'm2', sender_type: 'ai', content: "Hello Sarah! I've logged this as an emergency diagnostic request. Would you like me to book our earliest available opening tomorrow morning at 10:00 AM?" },
          { id: 'm3', sender_type: 'customer', content: 'Yes please, 10 AM tomorrow is perfect. My address is 3402 Scenic View, Westlake Hills.' },
          { id: 'm4', sender_type: 'ai', content: 'Appointment confirmed for tomorrow at 10:00 AM! Tech David is assigned. You will receive a text tracking link when he is on the way.' },
        ]);
        setLeadDetail({
          id: 'lead_1',
          name: 'Sarah Jenkins',
          phone: '+1 (512) 555-9821',
          email: 'sarah.jenkins@gmail.com',
          service: 'AC Emergency Repair',
          problem: 'Outdoor condenser loud noise, blowing warm air in 98° weather.',
          location: 'Westlake Hills, TX 78746',
          intent: 'urgent_repair',
          urgency: 'emergency',
          score: 95,
          status: 'booked',
          estimated_value: 850.0,
        });
      } else {
        setMessages([
          { id: 'm1', sender_type: 'customer', content: 'Hello, looking for an estimate for installing a Navien tankless water heater.' },
          { id: 'm2', sender_type: 'ai', content: 'Hi Robert! Typical installations range from $2,400 to $3,800 with a 10-year warranty. Would you like our master plumber to call you?' },
          { id: 'm3', sender_type: 'human', content: 'Hi Robert, Marcus from master plumbing here. I see you have 4 bathrooms. Let me check our gas line specs for you.' },
        ]);
        setLeadDetail({
          id: 'lead_2',
          name: 'Robert Miller',
          phone: '+1 (512) 555-4412',
          service: 'Tankless Water Heater Installation',
          score: 75,
          status: 'human_review',
          intent: 'estimate',
          urgency: 'medium',
          estimated_value: 3200.0,
        });
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv) return;
    setSending(true);

    const userText = inputText.trim();
    setInputText('');

    // Optimistic UI update
    const tempMsg = {
      id: `temp_${Date.now()}`,
      sender_type: 'human',
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await fetchApi(`/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: userText, sender_type: 'human' }),
      });
      // Refresh messages
      const updatedMsgs = await fetchApi(`/conversations/${selectedConv.id}/messages`);
      setMessages(updatedMsgs);
    } catch {
      // Keep optimistic message
    } finally {
      setSending(false);
    }
  };

  const toggleTakeover = async () => {
    if (!selectedConv) return;
    const newStatus = selectedConv.status === 'ai_handling' ? 'human_handling' : 'ai_handling';
    try {
      const updated = await fetchApi(`/conversations/${selectedConv.id}/takeover`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });
      setSelectedConv({ ...selectedConv, status: updated.status });
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? { ...c, status: updated.status } : c))
      );
    } catch {
      setSelectedConv({ ...selectedConv, status: newStatus });
    }
  };

  const filteredConvs = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.customer_name?.toLowerCase().includes(q) ||
      c.customer_id?.toLowerCase().includes(q) ||
      c.last_message_preview?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
      {/* COLUMN 1: Conversation List (Left) */}
      <div className="w-80 flex-shrink-0 border-r border-slate-800 flex flex-col bg-slate-950">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-semibold">
            {['all', 'ai_handling', 'human_handling'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`rounded-lg px-2.5 py-1 capitalize transition whitespace-nowrap ${
                  filterStatus === st
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* List of Conversations */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading inbox...</div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No conversations found.</div>
          ) : (
            filteredConvs.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const isAI = conv.status === 'ai_handling';

              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left p-4 transition flex flex-col gap-1.5 ${
                    isSelected ? 'bg-slate-900 border-l-4 border-sky-500' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate max-w-[140px]">
                      {conv.customer_name || conv.customer_id}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        isAI
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {isAI ? 'AI Live' : 'Human Takeover'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                    {conv.last_message_preview || 'No messages yet.'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span className="capitalize">{conv.channel.replace('_', ' ')}</span>
                    <span>{new Date(conv.last_message_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMN 2: Message Stream & Takeover (Middle) */}
      <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-900/40">
        {selectedConv ? (
          <>
            {/* Conversation Header & Takeover Action */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-200 font-bold text-sm">
                  {selectedConv.customer_name ? selectedConv.customer_name[0] : 'C'}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{selectedConv.customer_name || selectedConv.customer_id}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                      {selectedConv.channel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Status: <span className="text-slate-200 font-medium capitalize">{selectedConv.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Takeover Switch */}
              <button
                onClick={toggleTakeover}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                  selectedConv.status === 'ai_handling'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                {selectedConv.status === 'ai_handling' ? (
                  <>
                    <User className="h-4 w-4" />
                    Take Over Conversation
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4" />
                    Resume AI Automation
                  </>
                )}
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m) => {
                const isUser = m.sender_type === 'customer';
                const isAI = m.sender_type === 'ai';
                const isHuman = m.sender_type === 'human';

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 mb-1 px-1">
                      {isUser && <span>Customer</span>}
                      {isAI && <span className="text-sky-400 flex items-center gap-1"><Bot className="h-3 w-3" /> Apex Dispatch AI</span>}
                      {isHuman && <span className="text-amber-400 flex items-center gap-1"><User className="h-3 w-3" /> Human Operator</span>}
                    </div>

                    <div
                      className={`max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'
                          : isAI
                          ? 'bg-sky-600 text-white rounded-tr-sm shadow-md shadow-sky-600/10'
                          : 'bg-amber-600 text-white rounded-tr-sm shadow-md shadow-amber-600/10'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
              <input
                type="text"
                placeholder={
                  selectedConv.status === 'ai_handling'
                    ? 'Type a message (will be sent as human response)...'
                    : 'Reply as human operator...'
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            Select a conversation from the left to view messages.
          </div>
        )}
      </div>

      {/* COLUMN 3: Lead Dossier & Details (Right) */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-slate-950 p-6 overflow-y-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Lead Intelligence Dossier
        </h3>

        {leadDetail ? (
          <div className="space-y-6">
            {/* Score Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Lead Score</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    leadDetail.score >= 70
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : leadDetail.score >= 40
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {leadDetail.score} / 100 ({leadDetail.score >= 70 ? 'Hot' : 'Warm'})
                </span>
              </div>
              <div className="mt-3 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    leadDetail.score >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${leadDetail.score}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Est. Job Value:</span>
                <span className="font-bold text-white">${leadDetail.estimated_value || 850}</span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Customer Name</span>
                <div className="font-semibold text-white mt-0.5">{leadDetail.name || 'Unknown'}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Phone</span>
                <div className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-sky-400" />
                  {leadDetail.phone || 'N/A'}
                </div>
              </div>
              {leadDetail.email && (
                <div>
                  <span className="text-slate-500 text-[11px]">Email</span>
                  <div className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-sky-400" />
                    {leadDetail.email}
                  </div>
                </div>
              )}
              <div>
                <span className="text-slate-500 text-[11px]">Service Requested</span>
                <div className="font-semibold text-sky-300 mt-0.5">{leadDetail.service || 'Diagnostic & Repair'}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Problem Description</span>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-300 mt-1 text-[11px] leading-relaxed">
                  {leadDetail.problem || 'Customer requested service estimate.'}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => alert(`Opening calendar booking for ${leadDetail.name}...`)}
                className="w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5" />
                Book Service Appointment
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center text-xs text-slate-500">
            No extracted lead record found for this conversation yet. LeadFlow AI extracts parameters upon qualification.
          </div>
        )}
      </div>
    </div>
  );
}
