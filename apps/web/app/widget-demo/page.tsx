'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Phone,
  Clock,
  ShieldCheck,
  Star,
  MapPin,
  Bot,
  Send,
  X,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function WidgetDemoPage() {
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'ai',
      text: 'Hello! Welcome to Apex Air & Plumbing Specialists. How can we assist you with AC repair, seasonal tune-ups, or emergency plumbing today?',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const userText = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setSending(true);

    try {
      const res = await fetchApi('/widget/message/biz_demo_hvac_001', {
        method: 'POST',
        body: JSON.stringify({
          message: userText,
          conversation_id: convId,
          customer_name: 'Live Web Visitor',
          session_id: 'web_sess_live_demo',
        }),
      });

      if (res.conversation_id) setConvId(res.conversation_id);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: res.reply || 'Thank you! Our dispatcher will assist you.' },
      ]);
    } catch {
      // Local fallback
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: "Thank you for reaching out! Our standard diagnostic service is $120. Would you like me to book our earliest available opening tomorrow morning at 10:00 AM?",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-sky-500 selection:text-white relative">
      {/* Top Demo Bar */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>Interactive Website Chat Widget Demo (Customer-Facing Experience)</span>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg bg-white/20 px-3 py-1 text-white hover:bg-white/30 transition text-xs font-semibold"
        >
          Return to Dashboard →
        </Link>
      </div>

      {/* Simulated HVAC Business Header */}
      <header className="border-b border-slate-800 bg-slate-950 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white font-bold">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">Apex Air &amp; Plumbing Specialists</div>
            <div className="text-xs text-slate-400">Austin&apos;s #1 Certified Home Services Contractor</div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-sky-400" />
            <span className="font-bold text-white">+1 (512) 555-0149</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>24/7 Emergency Dispatch</span>
          </div>
        </div>
      </header>

      {/* Simulated Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1 text-xs font-semibold text-sky-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Licensed • Bonded • Insured • Austin, TX</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
          Fast, Reliable AC Repair &amp; Master Plumbing in Austin
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300">
          Whether you need emergency cooling diagnostics, water heater replacement, or routine maintenance, our certified technicians are on stand-by.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="font-bold text-sm text-white">AC Diagnostics</div>
            <div className="text-xs text-sky-400 mt-1 font-semibold">$120 Diagnostic Fee</div>
            <div className="text-xs text-slate-400 mt-2">Waived if repair work is approved.</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="font-bold text-sm text-white">Seasonal Tune-up</div>
            <div className="text-xs text-sky-400 mt-1 font-semibold">$180 Flat Rate</div>
            <div className="text-xs text-slate-400 mt-2">24-point comprehensive inspection.</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="font-bold text-sm text-white">Tankless Water Heaters</div>
            <div className="text-xs text-sky-400 mt-1 font-semibold">$2,400+ Complete</div>
            <div className="text-xs text-slate-400 mt-2">Navien high-efficiency models.</div>
          </div>
        </div>
      </main>

      {/* Floating Website Chat Widget Component */}
      <div className="fixed bottom-6 right-6 z-50">
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-2xl hover:scale-105 hover:bg-sky-500 transition active:scale-95"
          >
            <MessageSquare className="h-6 w-6" />
          </button>
        )}

        {chatOpen && (
          <div className="flex flex-col w-[380px] h-[540px] rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden backdrop-blur-md">
            {/* Widget Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Apex Dispatch AI</div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online 24/7 • Instant Reply
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Widget Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/60">
              {messages.map((m, idx) => {
                const isUser = m.sender === 'user';
                return (
                  <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-sky-600 text-white rounded-tr-sm shadow-md'
                          : 'bg-slate-900 text-slate-200 rounded-tl-sm border border-slate-800'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Widget Composer */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2">
              <input
                type="text"
                placeholder="Ask about prices, leaks, booking..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
