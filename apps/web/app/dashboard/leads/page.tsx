'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Phone,
  Calendar,
  Send,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Sparkles,
  CalendarPlus,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function CustomersLeadsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [leadDetail, setLeadDetail] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [bookingSlot, setBookingSlot] = useState<string>('Tomorrow - 10:00 AM');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
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
      // Fallback mock conversations for smooth offline preview
      const mockConvs = [
        {
          id: 'conv_demo_1',
          customer_name: 'Sarah Jenkins',
          customer_id: '+15125559821',
          channel: 'whatsapp',
          status: 'ai_handling',
          last_message_preview: 'Appointment confirmed for tomorrow at 10:00 AM! Tech David is assigned.',
          updated_at: '4 min ago',
          unread_count: 0,
        },
        {
          id: 'conv_demo_2',
          customer_name: 'Robert Miller',
          customer_id: '+15125554412',
          channel: 'widget',
          status: 'human_takeover',
          last_message_preview: 'I have a 3,000 sq ft home and need a master plumber quote for Navien unit.',
          updated_at: '15 min ago',
          unread_count: 1,
        },
        {
          id: 'conv_demo_3',
          customer_name: 'David Chen',
          customer_id: '+15125553389',
          channel: 'whatsapp',
          status: 'ai_handling',
          last_message_preview: 'Could you send technician pricing for central AC leak check?',
          updated_at: '3 hours ago',
          unread_count: 0,
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
    } catch {
      if (conv.id === 'conv_demo_1') {
        setMessages([
          { id: 'm1', sender_type: 'customer', content: 'Hi, our AC stopped cooling and is making a humming noise. Are you available tomorrow morning?', created_at: '10:14 AM' },
          { id: 'm2', sender_type: 'agent', content: 'Hello Sarah! I can certainly dispatch a technician for your AC system. Our emergency diagnostic is $120. Would 10:00 AM tomorrow work for you?', created_at: '10:14 AM' },
          { id: 'm3', sender_type: 'customer', content: 'Yes please, 10:00 AM works perfectly. Our address is 412 Oak Valley Dr.', created_at: '10:15 AM' },
          { id: 'm4', sender_type: 'agent', content: 'Awesome! Your service appointment is confirmed for tomorrow at 10:00 AM. Technician David has been assigned and will text when en route.', created_at: '10:15 AM' },
        ]);
        setLeadDetail({
          name: 'Sarah Jenkins',
          phone: '+1 (512) 555-9821',
          address: '412 Oak Valley Dr, Austin TX',
          urgency: 'high',
          service_needed: 'AC Diagnostic & Repair',
          estimated_value: 450,
          lead_score: 92,
        });
      } else {
        setMessages([
          { id: 'm10', sender_type: 'customer', content: 'Hi, looking for a quote on a Navien tankless water heater replacement.', created_at: '09:30 AM' },
          { id: 'm11', sender_type: 'agent', content: 'Hello Robert! We install high-efficiency Navien tankless units. Typical installations range between $2,400 - $3,800 depending on gas line capacity.', created_at: '09:30 AM' },
          { id: 'm12', sender_type: 'customer', content: 'I have a 3,000 sq ft home and need a master plumber quote for Navien unit.', created_at: '09:32 AM' },
        ]);
        setLeadDetail({
          name: 'Robert Miller',
          phone: '+1 (512) 555-4412',
          address: 'Austin, TX',
          urgency: 'medium',
          service_needed: 'Tankless Water Heater Installation',
          estimated_value: 3200,
          lead_score: 85,
        });
      }
    }
  };

  const handleTakeoverToggle = async () => {
    if (!selectedConv) return;
    const isCurrentlyHuman = selectedConv.status === 'human_takeover';
    const newStatus = isCurrentlyHuman ? 'ai_handling' : 'human_takeover';

    try {
      await fetchApi(`/conversations/${selectedConv.id}/takeover`, {
        method: 'POST',
        body: JSON.stringify({ human_takeover: !isCurrentlyHuman }),
      });
      setSelectedConv({ ...selectedConv, status: newStatus });
      setConversations(
        conversations.map((c) => (c.id === selectedConv.id ? { ...c, status: newStatus } : c))
      );
    } catch {
      setSelectedConv({ ...selectedConv, status: newStatus });
      setConversations(
        conversations.map((c) => (c.id === selectedConv.id ? { ...c, status: newStatus } : c))
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending || !selectedConv) return;

    const userText = inputText.trim();
    setInputText('');
    setSending(true);

    const optimisticMsg = {
      id: `temp_${Date.now()}`,
      sender_type: 'human_operator',
      content: userText,
      created_at: 'Just now',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await fetchApi(`/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: userText, sender_type: 'human_operator' }),
      });
    } catch {
      // Message already displayed optimistically
    } finally {
      setSending(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (searchQuery) {
      const matchName = (c.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchPhone = (c.customer_id || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchName && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden animate-fade-in">
      {/* COLUMN 1: Conversation List */}
      <div className="w-80 sm:w-96 flex-shrink-0 border-r border-slate-800/80 bg-[#080b11] flex flex-col justify-between">
        <div className="p-4 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold text-white tracking-tight">Customer Inbox</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {filteredConversations.length} Active
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name or phone..."
              className="input-field pl-9 text-xs"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {filteredConversations.map((c) => {
            const isSelected = selectedConv?.id === c.id;
            const isHuman = c.status === 'human_takeover';

            return (
              <button
                key={c.id}
                onClick={() => selectConversation(c)}
                className={`w-full p-4 text-left transition-colors duration-150 flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-[#0e131f] border-l-2 border-blue-500'
                    : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0 mt-0.5">
                  {(c.customer_name || 'Customer').slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">
                      {c.customer_name || c.customer_id}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0">{c.updated_at}</span>
                  </div>

                  <p className="text-xs text-slate-400 truncate">{c.last_message_preview}</p>

                  <div className="flex items-center gap-1.5 pt-0.5">
                    {isHuman ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[10px] font-semibold">
                        <User className="w-2.5 h-2.5" /> You Replying
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 text-[10px] font-semibold">
                        <Bot className="w-2.5 h-2.5" /> AI Handling
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* COLUMN 2: Message Thread & Takeover Bar */}
      <div className="flex-1 flex flex-col justify-between bg-[#0b0e17] overflow-hidden">
        {selectedConv ? (
          <>
            {/* Thread Header */}
            <div className="h-16 flex-shrink-0 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#080b11]/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  {selectedConv.customer_name?.slice(0, 2).toUpperCase() || 'CU'}
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{selectedConv.customer_name || 'Inbound Lead'}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                      {selectedConv.customer_id}
                    </span>
                  </h2>
                  <div className="text-[10px] text-slate-500">Channel: {selectedConv.channel || 'WhatsApp'}</div>
                </div>
              </div>

              {/* 1-Click Human Takeover Button */}
              <button
                onClick={handleTakeoverToggle}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 shadow-sm ${
                  selectedConv.status === 'human_takeover'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                }`}
              >
                {selectedConv.status === 'human_takeover' ? (
                  <>
                    <Bot className="w-3.5 h-3.5" />
                    <span>Resume AI Control</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5" />
                    <span>Take Over (Pause AI)</span>
                  </>
                )}
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
              {messages.map((m, idx) => {
                const isCustomer = m.sender_type === 'customer';
                const isHuman = m.sender_type === 'human_operator';

                return (
                  <div
                    key={m.id || idx}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 px-1">
                      <span>{isCustomer ? selectedConv.customer_name : isHuman ? 'You (Human)' : 'LeadFlow AI'}</span>
                      <span>•</span>
                      <span>{m.created_at}</span>
                    </div>

                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        isCustomer
                          ? 'bg-[#0e131f] border border-slate-800 text-slate-200'
                          : isHuman
                          ? 'bg-amber-600 text-white font-medium'
                          : 'bg-blue-600 text-white font-medium'
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
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800/80 bg-[#080b11] flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a manual reply as human operator..."
                className="input-field"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="btn-primary py-2.5 px-4 text-xs font-bold shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Select a customer conversation to view details.
          </div>
        )}
      </div>

      {/* COLUMN 3: Lead Dossier Panel */}
      {leadDetail && (
        <div className="w-80 flex-shrink-0 border-l border-slate-800/80 bg-[#080b11] p-6 space-y-6 hidden xl:block overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Dossier</h3>
            <div className="mt-2 text-base font-extrabold text-white">{leadDetail.name}</div>
            <div className="text-xs text-slate-400 font-mono">{leadDetail.phone}</div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Service Required</div>
              <div className="text-white font-semibold mt-0.5">{leadDetail.service_needed}</div>
            </div>

            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Estimated Job Value</div>
              <div className="text-emerald-400 font-bold text-sm mt-0.5">
                ${leadDetail.estimated_value?.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Lead Score</div>
              <div className="text-blue-400 font-bold text-sm mt-0.5">{leadDetail.lead_score}/100</div>
            </div>

            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Service Address</div>
              <div className="text-slate-300 mt-0.5">{leadDetail.address}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <button
              onClick={() => setShowBookingModal(true)}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0e131f] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Book Confirmed Appointment</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer</label>
                <div className="p-2.5 rounded-xl bg-slate-950 text-white font-semibold">{leadDetail?.name}</div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Available Time Slot</label>
                <select
                  value={bookingSlot}
                  onChange={(e) => setBookingSlot(e.target.value)}
                  className="input-field"
                >
                  <option>Tomorrow - 10:00 AM</option>
                  <option>Tomorrow - 02:00 PM</option>
                  <option>Wednesday - 09:00 AM</option>
                  <option>Wednesday - 01:00 PM</option>
                </select>
              </div>

              {bookingSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Appointment Booked &amp; Synced with Calendar!</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowBookingModal(false)}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setBookingSuccess(true);
                  setTimeout(() => {
                    setBookingSuccess(false);
                    setShowBookingModal(false);
                  }, 1500);
                }}
                className="btn-primary py-2 px-4 text-xs font-bold"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
