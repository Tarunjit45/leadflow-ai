'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, Sparkles, Bell, ShieldCheck, Activity } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function Header() {
  const [bizName, setBizName] = useState('Apex Air & Plumbing Specialists');
  const [userEmail, setUserEmail] = useState('demo@leadflow.ai');
  const [agentStatus, setAgentStatus] = useState('active');

  useEffect(() => {
    fetchApi('/businesses/current')
      .then((data) => {
        if (data?.name) setBizName(data.name);
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

  return (
    <header className="h-16 flex-shrink-0 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Workspace Identifier */}
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <span>{bizName}</span>
          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
            Workspace
          </span>
        </div>
      </div>

      {/* Agent Status & Quick Actions */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
          <Bot className="h-3.5 w-3.5" />
          <span>AI Agent: {agentStatus.toUpperCase()}</span>
        </div>

        <Link
          href="/dashboard/status"
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
        >
          <Activity className="h-3.5 w-3.5 text-sky-400" />
          <span>Diagnostics</span>
        </Link>

        <div className="flex items-center gap-2.5 border-l border-slate-800 pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-xs font-bold text-white uppercase">
            {userEmail.slice(0, 2)}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-white truncate max-w-[140px]">{userEmail}</div>
            <div className="text-[10px] text-slate-400">Account Owner</div>
          </div>
        </div>
      </div>
    </header>
  );
}
