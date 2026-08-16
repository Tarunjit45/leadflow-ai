'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  MessageSquare,
  Users,
  Calendar,
  Sliders,
  Database,
  Layers,
  Clock,
  FlaskConical,
  BarChart3,
  CreditCard,
  Activity,
  LogOut,
  ExternalLink,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Live Inbox', href: '/dashboard', icon: MessageSquare, badge: 'Live' },
  { name: 'Leads CRM', href: '/dashboard/leads', icon: Users },
  { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
  { name: 'AI Agent Studio', href: '/dashboard/agent', icon: Bot },
  { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: Database },
  { name: 'Integrations Hub', href: '/dashboard/integrations', icon: Layers },
  { name: 'Follow-Up Engine', href: '/dashboard/follow-ups', icon: Clock },
  { name: 'Agent Test Console', href: '/dashboard/test-console', icon: FlaskConical, badge: 'Sandbox' },
  { name: 'Revenue Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Billing & Plans', href: '/dashboard/billing', icon: CreditCard },
  { name: 'System Diagnostics', href: '/dashboard/status', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleSignOut = () => {
    localStorage.removeItem('leadflow_token');
    localStorage.removeItem('leadflow_business_id');
    localStorage.removeItem('leadflow_user');
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 shadow-md shadow-sky-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                LeadFlow <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[10px] text-sky-400 font-mono">AI</span>
              </div>
              <div className="text-[10px] text-slate-400">Autonomous Sales OS</div>
            </div>
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === 'Live'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Account & Widget Demo Link */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link
          href="/widget-demo"
          target="_blank"
          className="flex items-center justify-between rounded-xl border border-sky-500/30 bg-sky-950/40 p-2.5 text-xs font-semibold text-sky-300 hover:bg-sky-900/40 transition"
        >
          <span>Open Chat Widget Demo</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-xl p-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-rose-400 transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
