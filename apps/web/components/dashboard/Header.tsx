'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  PauseCircle,
  PlayCircle,
  User,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function Header() {
  const [bizName, setBizName] = useState('My Business Workspace');
  const [userEmail, setUserEmail] = useState('owner@business.com');
  const [agentStatus, setAgentStatus] = useState<'active' | 'paused'>('active');
  const [statusLoading, setStatusLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetchApi('/businesses/current')
      .then((data) => {
        if (data?.name) setBizName(data.name);
      })
      .catch(() => {});

    fetchApi('/agents/current')
      .then((data) => {
        if (data?.status === 'paused') {
          setAgentStatus('paused');
        } else {
          setAgentStatus('active');
        }
      })
      .catch(() => {});

    const cachedUser = localStorage.getItem('leadflow_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        if (u.email) setUserEmail(u.email);
      } catch {}
    }
  }, []);

  const handleToggleAutomation = async () => {
    setStatusLoading(true);
    const newStatus = agentStatus === 'active' ? 'paused' : 'active';
    try {
      await fetchApi('/businesses/toggle-automation', { method: 'POST' });
      setAgentStatus(newStatus);
    } catch {
      setAgentStatus(newStatus);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <>
      <header className="h-16 flex-shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        {/* Workspace Business Name */}
        <div className="flex items-center gap-3">
          <div
            className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
              agentStatus === 'active' ? 'bg-emerald-500 shadow-sm animate-pulse' : 'bg-amber-500'
            }`}
          />
          <div className="text-sm font-black text-slate-950 tracking-tight flex items-center gap-2">
            <span className="truncate max-w-[200px] sm:max-w-none">{bizName}</span>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              Workspace
            </span>
          </div>
        </div>

        {/* Master AI Toggle & Actions */}
        <div className="flex items-center gap-3.5">
          {/* Master AI Automation Switch */}
          <div className="flex items-center gap-2">
            {agentStatus === 'active' ? (
              <button
                onClick={handleToggleAutomation}
                disabled={statusLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all shadow-xs"
                title="Your AI employee is actively answering customers. Click to pause."
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI Working</span>
                <span className="rounded bg-emerald-200/80 px-1.5 py-0.5 text-[10px] text-emerald-900 font-bold ml-0.5">
                  Pause
                </span>
              </button>
            ) : (
              <button
                onClick={handleToggleAutomation}
                disabled={statusLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 active:scale-95 transition-all shadow-xs"
                title="Your AI employee is paused. Click to resume."
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>AI Paused</span>
                <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] text-amber-900 font-bold ml-0.5">
                  Resume
                </span>
              </button>
            )}
          </div>

          {/* Help Button */}
          <button
            onClick={() => setShowHelp(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* Account Profile Badge */}
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2.5 border-l border-slate-200 pl-3.5 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-xs font-black text-white uppercase shadow-md shadow-blue-500/20">
              {userEmail.slice(0, 2)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-950 truncate max-w-[130px] group-hover:text-blue-600 transition">
                {userEmail}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Settings &amp; Account</div>
            </div>
          </Link>
        </div>
      </header>

      {/* Guide Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-sm border border-blue-100">
                  ?
                </div>
                <h3 className="text-base font-black text-slate-950">How LeadFlow Works</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold transition"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-medium">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                <span className="font-bold text-slate-950 flex items-center gap-1.5">
                  <span className="text-emerald-500">🟢</span> When AI Employee is Working
                </span>
                <p className="text-slate-600">
                  Your AI automatically replies to customer inquiries on WhatsApp and your website in &lt; 2 seconds, gathers their details, and schedules appointments.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                <span className="font-bold text-slate-950 flex items-center gap-1.5">
                  <span className="text-amber-500">👤</span> Taking Over a Conversation
                </span>
                <p className="text-slate-600">
                  Go to <strong>Customers & Leads</strong> and click <em>Take Over</em> on any conversation to reply manually. The AI pauses automatically for that customer.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                <span className="font-bold text-slate-950 flex items-center gap-1.5">
                  <span className="text-blue-500">🤖</span> WhatsApp Control Mode
                </span>
                <p className="text-slate-600">
                  You can text your AI assistant directly on WhatsApp anytime to query metrics, view booked jobs, or pause automation.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="btn-primary !py-2 !px-4 !text-xs"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
