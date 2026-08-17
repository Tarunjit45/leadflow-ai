'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  MessageSquare,
  Users,
  Calendar,
  Bot,
  Settings,
  LogOut,
  Smartphone,
  ExternalLink,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import QRCodeDisplay from '../QRCodeDisplay';
import { fetchApi } from '../../lib/api';

const MAIN_NAV_ITEMS = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Customers & Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
  { name: 'AI Employee', href: '/dashboard/agent', icon: Bot },
  { name: 'Settings & Channels', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [showQR, setShowQR] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'active' | 'paused'>('active');

  useEffect(() => {
    fetchApi('/agents/current')
      .then((data) => {
        if (data?.status === 'paused') {
          setAgentStatus('paused');
        } else {
          setAgentStatus('active');
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('leadflow_token');
    localStorage.removeItem('leadflow_business_id');
    localStorage.removeItem('leadflow_user');
    window.location.href = '/login';
  };

  const mobileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/dashboard`
    : 'https://leadflow.ai/dashboard';

  return (
    <>
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col justify-between h-screen sticky top-0">
        <div>
          {/* Brand Logo & Name */}
          <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 shadow-md shadow-sky-500/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  LeadFlow <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[10px] text-sky-400 font-mono">AI</span>
                </div>
                <div className="text-[10px] text-slate-400">AI Sales Employee</div>
              </div>
            </Link>
          </div>

          {/* Simple 5-Item Navigation */}
          <nav className="p-3 space-y-1.5 mt-2">
            {MAIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Quick Controls */}
        <div className="p-4 border-t border-slate-800 space-y-2.5">
          {/* AI Working Chip */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  agentStatus === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-300">
                AI Employee: {agentStatus === 'active' ? 'Working' : 'Paused'}
              </span>
            </div>
            <Link
              href="/dashboard/agent"
              className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold"
            >
              Teach
            </Link>
          </div>

          {/* Mobile QR Action */}
          <button
            onClick={() => setShowQR(true)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-xs font-medium text-slate-300 hover:bg-slate-850 hover:text-white transition"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 text-sky-400" />
              <span>Use on Phone</span>
            </div>
            <QrCode className="h-3.5 w-3.5 text-slate-500" />
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl p-2 text-xs font-semibold text-slate-500 hover:bg-slate-900 hover:text-rose-400 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* QR Code Modal for Mobile Access */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-sm">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold z-10"
            >
              &times;
            </button>
            <QRCodeDisplay
              url={mobileUrl}
              title="Open Dashboard on Your Phone 📱"
              subtitle="Scan with your phone camera to check leads, customers, and appointments on the go."
            />
          </div>
        </div>
      )}
    </>
  );
}
