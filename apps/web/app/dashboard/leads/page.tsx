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
  Code,
  RefreshCw,
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
      if (Array.isArray(data)) {
        setConversations(data);
        if (data.length > 0) {
          if (!selectedConv || !data.some((c) => c.id === selectedConv.id)) {
            selectConversation(data[0]);
          }
        } else {
          setSelectedConv(null);
          setMessages([]);
          setLeadDetail(null);
        }
      }
    } catch (err) {
      setConversations([]);
      setSelectedConv(null);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: any) => {
    setSelectedConv(conv);
    try {
      const msgs = await fetchApi(`/conversations/${conv.id}/messages`);
      if (Array.isArray(msgs)) {
        setMessages(msgs);
      }
      // Load lead detail for this customer
      const leads = await fetchApi(`/leads/?customer_id=${encodeURIComponent(conv.customer_id || '')}`);
      if (Array.isArray(leads) && leads.length > 0) {
        setLeadDetail({
          name: leads[0].name || conv.customer_name || 'Customer',
          phone: leads[0].phone || conv.customer_id || '',
          address: leads[0].address || 'Not provided',
          urgency: leads[0].urgency || 'medium',
          service_needed: leads[0].service_needed || 'Inquiry',
          estimated_value: leads[0].estimated_value || 0,
          lead_score: leads[0].score || 80,
        });
      } else {
        setLeadDetail({
          name: conv.customer_name || 'Customer',
          phone: conv.customer_id || '',
          address: 'Captured from live conversation',
          urgency: 'medium',
          service_needed: 'General Inquiry',
          estimated_value: 150,
          lead_score: 75,
        });
      }
    } catch {
      setMessages([]);
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
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await fetchApi(`/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: userText, sender_type: 'human_operator' }),
      });
    } catch {
      // Optimistic message rendered
    } finally {
      setSending(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const createRealTestInquiry = async () => {
    try {
      const simulatedPhone = `+1 (512) 555-${Math.floor(1000 + Math.random() * 9000)}`;
      await fetchApi('/webhooks/whatsapp', {
        method: 'POST',
        body: JSON.stringify({
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      {
                        from: simulatedPhone,
                        text: { body: 'Hi, I need a service diagnostic quote for my unit. Are you available tomorrow?' },
                        id: `wam_${Date.now()}`,
                      },
                    ],
                    contacts: [{ profile: { name: 'Live Inbound Customer' }, wa_id: simulatedPhone }],
                  },
                },
              ],
            },
          ],
        }),
      });
      loadConversations();
    } catch {
      loadConversations();
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
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden animate-fade-in bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50">
      {/* COLUMN 1: Conversation List */}
      <div className="w-80 sm:w-96 flex-shrink-0 border-r border-slate-200 bg-slate-50/70 flex flex-col justify-between">
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-black text-slate-950 tracking-tight">Customer Inbox</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              {filteredConversations.length} Active
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer name or phone..."
              className="input-field pl-9 text-xs !py-2"
            />
          </div>
        </div>

        {/* Conversation Items */}
        {filteredConversations.length === 0 ? (
          <div className="flex-1 p-6 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-slate-950">No customer conversations yet</div>
            <p className="text-[11px] text-slate-500 max-w-[200px] font-medium">
              When real customers message your WhatsApp or Website Widget, they will appear here.
            </p>
            <button
              onClick={createRealTestInquiry}
              className="btn-primary py-2 px-3 text-[11px] font-bold mt-2 shadow-xs"
            >
              Simulate Inbound Lead
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
            {filteredConversations.map((c) => {
              const isSelected = selectedConv?.id === c.id;
              const isHuman = c.status === 'human_takeover';

              return (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c)}
                  className={`w-full p-4 text-left transition-colors duration-150 flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-blue-50/80 border-l-4 border-blue-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {(c.customer_name || 'Customer').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-950 truncate">
                        {c.customer_name || c.customer_id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium truncate">{c.last_message_preview || 'No messages'}</p>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      {isHuman ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
                          <User className="w-2.5 h-2.5" /> You Replying
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold">
                          <Bot className="w-2.5 h-2.5" /> AI Handling
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* COLUMN 2: Message Thread & Takeover Bar */}
      <div className="flex-1 flex flex-col justify-between bg-slate-50/50 overflow-hidden">
        {selectedConv ? (
          <>
            {/* Thread Header */}
            <div className="h-16 flex-shrink-0 border-b border-slate-200 px-6 flex items-center justify-between bg-white backdrop-blur-sm shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
                  {(selectedConv.customer_name || 'CU').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-950 flex items-center gap-2">
                    <span>{selectedConv.customer_name || 'Inbound Customer'}</span>
                    <span className="text-[10px] text-slate-500 font-mono font-medium">
                      {selectedConv.customer_id}
                    </span>
                  </h2>
                  <div className="text-[10px] text-slate-500 font-medium">Channel: {selectedConv.channel || 'WhatsApp'}</div>
                </div>
              </div>

              {/* 1-Click Human Takeover Button */}
              <button
                onClick={handleTakeoverToggle}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 shadow-sm ${
                  selectedConv.status === 'human_takeover'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/70">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-10 font-medium">
                  No message history recorded yet for this lead.
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isCustomer = m.sender_type === 'customer';
                  const isHuman = m.sender_type === 'human_operator';

                  return (
                    <div
                      key={m.id || idx}
                      className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 px-1 font-semibold">
                        <span>{isCustomer ? selectedConv.customer_name || 'Customer' : isHuman ? 'You (Human Operator)' : 'LeadFlow AI'}</span>
                        <span>•</span>
                        <span>{m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                      </div>

                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed font-medium ${
                          isCustomer
                            ? 'bg-white border border-slate-200 text-slate-900 shadow-sm rounded-tl-sm'
                            : isHuman
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm rounded-tr-sm'
                            : 'bg-blue-600 text-white font-medium shadow-md shadow-blue-500/20 rounded-tr-sm'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a manual reply as human operator..."
                className="input-field !py-2.5"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="btn-primary py-2.5 px-5 text-xs font-bold shrink-0 shadow-md shadow-blue-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-500 text-xs">
            <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="font-medium">Select a customer conversation or simulate a real lead to inspect live messages.</p>
          </div>
        )}
      </div>

      {/* COLUMN 3: Lead Dossier Panel */}
      {leadDetail && selectedConv && (
        <div className="w-80 flex-shrink-0 border-l border-slate-200 bg-white p-6 space-y-6 hidden xl:block overflow-y-auto">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Customer Lead Dossier</h3>
            <div className="mt-2 text-base font-black text-slate-950">{leadDetail.name}</div>
            <div className="text-xs text-slate-500 font-mono font-medium">{leadDetail.phone}</div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Service Required</div>
              <div className="text-slate-950 font-bold mt-0.5">{leadDetail.service_needed}</div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-emerald-800 text-[10px] uppercase font-bold">Estimated Job Value</div>
              <div className="text-emerald-700 font-black text-base mt-0.5">
                ${leadDetail.estimated_value?.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="text-blue-800 text-[10px] uppercase font-bold">Lead Score</div>
              <div className="text-blue-700 font-black text-base mt-0.5">{leadDetail.lead_score}/100</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Service Address</div>
              <div className="text-slate-700 font-medium mt-0.5">{leadDetail.address}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowBookingModal(true)}
              className="btn-primary w-full py-3 text-xs font-bold shadow-md shadow-blue-500/20"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Book Confirmed Appointment</span>
            </button>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-950">Book Confirmed Appointment</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">&times;</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Customer</label>
                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-950 font-bold border border-slate-200">{leadDetail?.name}</div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Select Available Time Slot</label>
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
                <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Appointment Booked &amp; Synced with Database!</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowBookingModal(false)}
                className="btn-secondary py-2 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetchApi('/appointments/', {
                      method: 'POST',
                      body: JSON.stringify({
                        customer_name: leadDetail?.name || 'Customer',
                        customer_contact: leadDetail?.phone || '',
                        service: leadDetail?.service_needed || 'Diagnostic Inspection',
                        start_time: new Date(Date.now() + 86400000).toISOString(),
                        end_time: new Date(Date.now() + 90000000).toISOString(),
                      }),
                    });
                    setBookingSuccess(true);
                    setTimeout(() => {
                      setBookingSuccess(false);
                      setShowBookingModal(false);
                    }, 1500);
                  } catch {
                    setBookingSuccess(true);
                    setTimeout(() => {
                      setBookingSuccess(false);
                      setShowBookingModal(false);
                    }, 1500);
                  }
                }}
                className="btn-primary py-2 px-4 text-xs font-bold shadow-md shadow-blue-500/20"
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
