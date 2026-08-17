'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  User,
  Phone,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function DashboardHomePage() {
  const [bizName, setBizName] = useState('Apex Air & Plumbing Specialists');
  const [agentName, setAgentName] = useState('Apex Dispatch AI');
  const [agentStatus, setAgentStatus] = useState<'active' | 'paused'>('active');
  const [statusLoading, setStatusLoading] = useState(false);

  // Metrics
  const [metrics, setMetrics] = useState({
    customersHelped: 24,
    newLeads: 8,
    appointmentsBooked: 5,
    estimatedRevenue: 4250,
  });

  // Attention Items
  const [attentionItems, setAttentionItems] = useState<any[]>([
    {
      id: 'att_1',
      customerName: 'Robert Miller',
      phone: '+1 (512) 555-4412',
      reason: 'Requested master plumber phone consultation for Navien tankless install ($3,200)',
      time: '15 min ago',
      convId: 'conv_demo_2',
    },
  ]);

  // Recent Customers
  const [recentCustomers, setRecentCustomers] = useState<any[]>([
    {
      id: 'c1',
      name: 'Sarah Jenkins',
      phone: '+1 (512) 555-9821',
      action: 'Booked service appointment for tomorrow at 10:00 AM',
      service: 'AC Emergency Repair',
      time: '4 min ago',
      status: 'booked',
      isAi: true,
    },
    {
      id: 'c2',
      name: 'Robert Miller',
      phone: '+1 (512) 555-4412',
      action: 'Asked for custom quote on tankless water heater',
      service: 'Tankless Water Heater',
      time: '15 min ago',
      status: 'human_review',
      isAi: false,
    },
    {
      id: 'c3',
      name: 'Elena Vance',
      phone: '+1 (512) 555-7731',
      action: 'Received automated friendly follow-up for seasonal tune-up',
      service: 'Seasonal HVAC Tune-up',
      time: '1 hour ago',
      status: 'nurturing',
      isAi: true,
    },
    {
      id: 'c4',
      name: 'David Chen',
      phone: '+1 (512) 555-3389',
      action: 'Qualified diagnostic lead; requested quote by text',
      service: 'Refrigerant Leak Diagnostic',
      time: '3 hours ago',
      status: 'qualified',
      isAi: true,
    },
  ]);

  // Setup Progress Checklist
  const [setupProgress, setSetupProgress] = useState<any>({
    completed_count: 4,
    total_count: 5,
    percentage: 80,
    steps: [
      { id: 'business', label: 'Business Profile', completed: true },
      { id: 'services', label: 'Services & Prices', completed: true },
      { id: 'agent', label: 'AI Employee Setup', completed: true },
      { id: 'hours', label: 'Business Hours', completed: true },
      { id: 'whatsapp', label: 'Connect WhatsApp Number', completed: false },
    ],
  });

  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Load business
    fetchApi('/businesses/current')
      .then((data) => {
        if (data?.name) setBizName(data.name);
      })
      .catch(() => {});

    // Load agent
    fetchApi('/agents/current')
      .then((data) => {
        if (data?.name) setAgentName(data.name);
        if (data?.status) setAgentStatus(data.status);
      })
      .catch(() => {});

    // Load progress
    fetchApi('/businesses/setup-progress')
      .then((data) => {
        if (data?.steps) setSetupProgress(data);
      })
      .catch(() => {});

    // Load summary metrics
    fetchApi('/analytics/summary')
      .then((data) => {
        if (data) {
          setMetrics({
            customersHelped: data.total_leads || 24,
            newLeads: data.qualified_leads || 8,
            appointmentsBooked: data.appointments_booked || 5,
            estimatedRevenue: data.estimated_revenue_recovered || 4250,
          });
        }
      })
      .catch(() => {});
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
    <div className="p-6 sm:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Top Greeting & Status Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-sky-400">
              {greeting} 👋
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {agentName} is {agentStatus === 'active' ? 'working and helping customers' : 'currently paused'}.
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Workspace: <strong className="text-white">{bizName}</strong> • Replies in &lt; 2s across WhatsApp and Web.
            </p>
          </div>

          {/* Big Master Toggle Button */}
          <div className="flex-shrink-0">
            {agentStatus === 'active' ? (
              <button
                onClick={handleToggleAutomation}
                disabled={statusLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-95 disabled:opacity-50"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                <span>🟢 AI is Active</span>
                <span className="rounded bg-black/20 px-2 py-0.5 text-[10px] font-normal ml-1">
                  Click to Pause
                </span>
              </button>
            ) : (
              <button
                onClick={handleToggleAutomation}
                disabled={statusLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-amber-600/30 hover:bg-amber-500 transition active:scale-95 disabled:opacity-50"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
                <span>🔴 AI is Paused</span>
                <span className="rounded bg-black/20 px-2 py-0.5 text-[10px] font-bold ml-1">
                  Click to Resume
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Core Business Numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-1">
            <div className="text-slate-400 text-xs font-medium">Customers Helped</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{metrics.customersHelped}</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <span>↑ 100% replied in &lt; 2s</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-1">
            <div className="text-slate-400 text-xs font-medium">New Leads Qualified</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{metrics.newLeads}</div>
            <div className="text-[11px] text-sky-400 font-medium">Contact info & problem captured</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-1">
            <div className="text-slate-400 text-xs font-medium">Appointments Booked</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{metrics.appointmentsBooked}</div>
            <div className="text-[11px] text-purple-400 font-medium">Synced with calendar</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-1">
            <div className="text-slate-400 text-xs font-medium">Est. Revenue Recovered</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              ${metrics.estimatedRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">Saved from lost inquiries</div>
          </div>
        </div>
      </div>

      {/* Action Items Requiring Attention */}
      {attentionItems.length > 0 && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 font-bold">
                ⚠️
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  {attentionItems.length} Customer Needs Your Attention
                </h2>
                <p className="text-xs text-amber-200/80">
                  Customer requested human technician consultation or custom pricing.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/leads"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white transition"
            >
              <span>View in Inbox</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-amber-500/20 bg-slate-950/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{item.customerName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({item.phone})</span>
                    <span className="text-[10px] text-slate-500">• {item.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.reason}</p>
                </div>

                <Link
                  href="/dashboard/leads"
                  className="rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/30 transition text-center whitespace-nowrap"
                >
                  Reply &amp; Take Over
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Recent Customers (Left) + Quick Setup Checklist & Actions (Right) */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Customers Stream (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Recent Customer Activity</h2>
              <p className="text-xs text-slate-400">Live conversations handled by your AI employee</p>
            </div>
            <Link
              href="/dashboard/leads"
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <span>See all customers</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 overflow-hidden divide-y divide-slate-800/60">
            {recentCustomers.map((cust) => (
              <div
                key={cust.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-200 font-bold text-sm flex-shrink-0">
                    {cust.name[0]}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{cust.name}</span>
                      <span className="text-[11px] text-slate-400">{cust.phone}</span>
                      <span
                        className={`rounded-full px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                          cust.status === 'booked'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : cust.status === 'human_review'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {cust.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-tight">{cust.action}</p>
                    <div className="text-[10px] text-slate-500">{cust.time} • Service: {cust.service}</div>
                  </div>
                </div>

                <div className="flex-shrink-0 sm:text-right">
                  <Link
                    href="/dashboard/leads"
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                  >
                    <span>View Conversation</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Setup Progress & Quick Actions */}
        <div className="space-y-6">
          {/* Setup Progress Widget */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Setup Progress
              </span>
              <span className="text-xs font-bold text-sky-400">
                {setupProgress.completed_count || 4} of {setupProgress.total_count || 5} Complete
              </span>
            </div>

            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                style={{ width: `${setupProgress.percentage || 80}%` }}
              />
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Business Services &amp; Prices</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">Done</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>AI Employee Persona &amp; Tone</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">Done</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Business Operating Hours</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">Done</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Website Chat Widget Embed</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">Ready</span>
              </div>
              <div className="flex items-center justify-between text-slate-300 pt-1">
                <span className="flex items-center gap-2 text-slate-400">
                  <div className="h-4 w-4 rounded-full border border-slate-600 flex items-center justify-center text-[9px]">
                    5
                  </div>
                  <span>WhatsApp Business API</span>
                </span>
                <Link
                  href="/dashboard/settings?tab=channels"
                  className="text-[11px] font-bold text-sky-400 hover:text-sky-300"
                >
                  Connect →
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</h3>

            <div className="space-y-2">
              <Link
                href="/dashboard/agent"
                className="w-full flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-xs font-semibold text-slate-200 hover:bg-slate-900 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="h-4 w-4 text-sky-400" />
                  <span>Teach AI Employee / Change Tone</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>

              <Link
                href="/dashboard/settings?tab=channels"
                className="w-full flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-xs font-semibold text-slate-200 hover:bg-slate-900 transition"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                  <span>Connect WhatsApp / Get Widget Code</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>

              <Link
                href="/dashboard/appointments"
                className="w-full flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-xs font-semibold text-slate-200 hover:bg-slate-900 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span>View Upcoming Appointments</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
