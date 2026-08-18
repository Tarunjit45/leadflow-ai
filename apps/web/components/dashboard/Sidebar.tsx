'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Calendar,
  Bot,
  Settings,
  LogOut,
  Smartphone,
  QrCode,
  Sparkles,
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
    fetchApi('/auth/logout', { method: 'POST' }).catch(() => {});
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
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between h-screen sticky top-0 z-30 font-sans shadow-xs">
        <div>
          {/* Brand Logo & Name */}
          <div className="p-5 flex items-center justify-between border-b border-slate-200">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/30 transition-transform duration-200 group-hover:scale-105">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-950 tracking-tight flex items-center gap-1.5">
                  LeadFlow <span className="rounded-full bg-blue-100 border border-blue-200 px-1.5 py-0.2 text-[9px] text-blue-700 font-mono font-bold">AI</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Autonomous Sales Employee</div>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 font-semibold'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/50">
          {/* Quick Mobile Access Button */}
          <button
            type="button"
            onClick={() => setShowQR(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition text-left group shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-900">Mobile View</div>
                <div className="text-[9px] text-slate-500 font-medium">Scan QR Code</div>
              </div>
            </div>
            <QrCode className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 transition" />
          </button>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative bg-white rounded-3xl p-2 shadow-2xl border border-slate-200">
            <button
              onClick={() => setShowQR(false)}
              className="absolute -top-3 -right-3 z-10 h-8 w-8 rounded-full bg-slate-900 border border-slate-700 text-white font-bold text-sm flex items-center justify-center hover:bg-black shadow-md"
            >
              &times;
            </button>
            <QRCodeDisplay
              url={mobileUrl}
              title="Open Dashboard on Mobile"
              subtitle="Scan this QR code with your phone camera to access your live LeadFlow AI dashboard."
            />
          </div>
        </div>
      )}
    </>
  );
}
