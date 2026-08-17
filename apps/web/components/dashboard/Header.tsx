'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  HelpCircle,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  User,
  ExternalLink,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function Header() {
  const [bizName, setBizName] = useState('Apex Air & Plumbing Specialists');
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
      <header className="h-16 flex-shrink-0 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Workspace Business Name */}
        <div className="flex items-center gap-3">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              agentStatus === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>{bizName}</span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
              Workspace
            </span>
          </div>
        </div>

        {/* Master AI Toggle & Actions */}
        <div className="flex items-center gap-4">
          {/* Master AI Automation Switch */}
          <div className="flex items-center gap-2">
            {agentStatus === 'active' ? (
              <button
                onClick={handleToggleAutomation}
                disabled={statusLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition active:scale-95"
                title="Your AI is actively answering customers. Click to pause."
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI Working</span>
                <span className="rounded bg-slate-900/60 px-1.5 py-0.5 text-[10px] text-slate-300 font-normal ml-1">
                  Pause
                </span>
              </button>
            ) : (
              <button
                onClick={handleToggleAutomation}
                disabled={statusLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition active:scale-95"
                title="Your AI is paused. Click to resume."
              >
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>AI Paused</span>
                <span className="rounded bg-slate-900/60 px-1.5 py-0.5 text-[10px] text-amber-200 font-bold ml-1">
                  Resume
                </span>
              </button>
            )}
          </div>

          {/* Help Button */}
          <button
            onClick={() => setShowHelp(true)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <HelpCircle className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">Help</span>
          </button>

          {/* Account Profile Badge */}
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2.5 border-l border-slate-800 pl-4 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-xs font-bold text-white uppercase shadow-md">
              {userEmail.slice(0, 2)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-white truncate max-w-[130px] group-hover:text-sky-300 transition">
                {userEmail}
              </div>
              <div className="text-[10px] text-slate-400">Settings &amp; Account</div>
            </div>
          </Link>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 font-bold">
                  ?
                </div>
                <h3 className="text-base font-bold text-white">How LeadFlow Works</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-emerald-400">🟢</span> When AI Employee is Working
                </span>
                <p className="text-slate-400">
                  Your AI automatically replies to customer messages on WhatsApp and your Website in under 2 seconds, gathers their information, and schedules appointments.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-amber-400">👤</span> Taking Over a Conversation
                </span>
                <p className="text-slate-400">
                  Go to <strong>Customers & Leads</strong> and click <em>Take Over</em> on any conversation to reply manually. The AI pauses automatically for that customer.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-sky-400">🤖</span> Teaching Your AI
                </span>
                <p className="text-slate-400">
                  You can change services, prices, business hours, and speaking style anytime from the <strong>AI Employee</strong> tab.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
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
