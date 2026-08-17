'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  PauseCircle,
  PlayCircle,
  User,
  ExternalLink,
  ShieldCheck
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
      <header className="h-16 flex-shrink-0 border-b border-slate-800/80 bg-[#080b11]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Workspace Business Name */}
        <div className="flex items-center gap-3">
          <div
            className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
              agentStatus === 'active' ? 'bg-emerald-400 animate-pulse-calm' : 'bg-amber-400'
            }`}
          />
          <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span className="truncate max-w-[200px] sm:max-w-none">{bizName}</span>
            <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-800">
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
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 active:bg-emerald-500/30 transition-all duration-150 active:scale-95 shadow-sm"
                title="Your AI employee is actively answering customers. Click to pause."
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-calm" />
                <span>AI Working</span>
                <span className="rounded bg-slate-950/60 px-1.5 py-0.5 text-[10px] text-slate-300 font-normal ml-0.5">
                  Pause
                </span>
              </button>
            ) : (
              <button
                onClick={handleToggleAutomation}
                disabled={statusLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 active:bg-amber-500/30 transition-all duration-150 active:scale-95 shadow-sm"
                title="Your AI employee is paused. Click to resume."
              >
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>AI Paused</span>
                <span className="rounded bg-slate-950/60 px-1.5 py-0.5 text-[10px] text-amber-200 font-bold ml-0.5">
                  Resume
                </span>
              </button>
            )}
          </div>

          {/* Help Button */}
          <button
            onClick={() => setShowHelp(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-150"
          >
            <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* Account Profile Badge */}
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2.5 border-l border-slate-800/80 pl-3.5 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white uppercase shadow-sm">
              {userEmail.slice(0, 2)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-medium text-white truncate max-w-[130px] group-hover:text-blue-300 transition-colors">
                {userEmail}
              </div>
              <div className="text-[10px] text-slate-500">Settings &amp; Account</div>
            </div>
          </Link>
        </div>
      </header>

      {/* Guide Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0e131f] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 font-bold text-sm">
                  ?
                </div>
                <h3 className="text-base font-bold text-white">How LeadFlow Works</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white text-lg font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-1">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span className="text-emerald-400">🟢</span> When AI Employee is Working
                </span>
                <p className="text-slate-400">
                  Your AI automatically replies to customer inquiries on WhatsApp and your website in &lt; 2 seconds, gathers their details, and schedules appointments.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-1">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span className="text-amber-400">👤</span> Taking Over a Conversation
                </span>
                <p className="text-slate-400">
                  Go to <strong>Customers & Leads</strong> and click <em>Take Over</em> on any conversation to reply manually. The AI pauses automatically for that customer.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-1">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span className="text-blue-400">🤖</span> Teaching Your AI
                </span>
                <p className="text-slate-400">
                  You can update services, prices, business hours, and tone anytime from the <strong>AI Employee</strong> studio.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="btn-primary py-2 px-4 text-xs font-semibold"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
