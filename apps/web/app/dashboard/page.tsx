'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Bot,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  ChevronRight,
  MessageSquare,
  ShieldAlert,
  PlayCircle,
  PauseCircle,
  Plus,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function DashboardHomePage() {
  const [bizName, setBizName] = useState('My Business Workspace');
  const [agentName, setAgentName] = useState('LeadFlow AI Assistant');
  const [agentStatus, setAgentStatus] = useState<'active' | 'paused'>('active');
  const [statusLoading, setStatusLoading] = useState(false);

  // Real Metrics from Database
  const [metrics, setMetrics] = useState({
    customersHelped: 0,
    newLeads: 0,
    appointmentsBooked: 0,
    estimatedRevenue: 0,
  });

  // Attention Items
  const [attentionItems, setAttentionItems] = useState<any[]>([]);

  // Recent Real Customers Activity Stream
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);

  // Setup Progress Checklist
  const [setupProgress, setSetupProgress] = useState<any>({
    completed_count: 0,
    total_count: 5,
    percentage: 0,
    steps: [],
  });

  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // 1. Load real business details
    fetchApi('/businesses/current')
      .then((data) => {
        if (data?.name) setBizName(data.name);
      })
      .catch(() => {});

    // 2. Load real AI agent
    fetchApi('/agents/current')
      .then((data) => {
        if (data?.name) setAgentName(data.name);
        if (data?.status) setAgentStatus(data.status);
      })
      .catch(() => {});

    // 3. Load setup checklist
    fetchApi('/businesses/setup-progress')
      .then((data) => {
        if (data?.steps) setSetupProgress(data);
      })
      .catch(() => {});

    // 4. Load real analytics summary
    fetchApi('/analytics/summary')
      .then((data) => {
        if (data) {
          setMetrics({
            customersHelped: data.total_leads || 0,
            newLeads: data.qualified_leads || 0,
            appointmentsBooked: data.appointments_booked || 0,
            estimatedRevenue: data.estimated_revenue_recovered || 0,
          });
        }
      })
      .catch(() => {});

    // 5. Load real conversations for recent activity feed
    fetchApi('/conversations/?limit=5')
      .then((convs) => {
        if (Array.isArray(convs)) {
          const mapped = convs.map((c) => ({
            id: c.id,
            name: c.customer_name || c.customer_id || 'Inbound Lead',
            phone: c.customer_id || '',
            action: c.last_message_preview || 'New conversation started',
            service: c.metadata?.service_needed || 'Inquiry',
            time: new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: c.status,
            isAi: c.status !== 'human_takeover',
          }));
          setRecentCustomers(mapped);

          // Find any conversation flagged for human review
          const flagged = convs.filter((c) => c.status === 'human_takeover' || c.status === 'human_review');
          if (flagged.length > 0) {
            setAttentionItems([
              {
                id: flagged[0].id,
                customerName: flagged[0].customer_name || flagged[0].customer_id,
                phone: flagged[0].customer_id,
                reason: flagged[0].last_message_preview || 'Customer requested human takeover',
                convId: flagged[0].id,
              },
            ]);
          }
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto animate-fade-in font-sans text-slate-900">
      {/* Top Greeting & Status Hero Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xl shadow-slate-200/60">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <span>{greeting}</span> <span>👋</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {agentName} is {agentStatus === 'active' ? 'active & ready to answer leads' : 'currently paused'}.
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
              Workspace: <strong className="text-slate-950 font-bold">{bizName}</strong> &bull; Operating on live real data across WhatsApp &amp; Web.
            </p>
          </div>

          {/* Master Toggle Button */}
          <div className="flex-shrink-0">
            {agentStatus === 'active' ? (
              <button
                type="button"
                onClick={handleToggleAutomation}
                disabled={statusLoading}
                className="btn-emerald !py-3 !px-5 shadow-lg shadow-emerald-500/25"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                <span>🟢 AI is Working</span>
                <span className="rounded-lg bg-emerald-800/40 px-2 py-0.5 text-[10px] font-bold ml-1">
                  Click to Pause
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleAutomation}
                disabled={statusLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-slate-950" />
                <span>🔴 AI is Paused</span>
                <span className="rounded-lg bg-amber-600/60 px-2 py-0.5 text-[10px] font-black ml-1">
                  Click to Resume
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Real Performance KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Inquiries</div>
            <div className="text-3xl font-black text-slate-950 tracking-tight">{metrics.customersHelped}</div>
            <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600" /> Live Real Data
            </div>
          </div>

          <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Qualified Leads</div>
            <div className="text-3xl font-black text-blue-600 tracking-tight">{metrics.newLeads}</div>
            <div className="text-[11px] text-slate-600 font-medium">Services confirmed</div>
          </div>

          <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Appointments</div>
            <div className="text-3xl font-black text-slate-950 tracking-tight">{metrics.appointmentsBooked}</div>
            <div className="text-[11px] text-emerald-700 font-bold">Synced with calendar</div>
          </div>

          <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Est. Revenue Recovered</div>
            <div className="text-3xl font-black text-emerald-700 tracking-tight">
              ${metrics.estimatedRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-600 font-medium">From bookings</div>
          </div>
        </div>
      </div>

      {/* Needs Attention Warning Box */}
      {attentionItems.length > 0 && (
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 space-y-4 shadow-md shadow-amber-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-950">Customer Conversation Needs Review</h2>
                <p className="text-xs text-amber-900 font-medium">AI flagged this conversation for human attention.</p>
              </div>
            </div>
            <Link
              href="/dashboard/leads"
              className="text-xs font-bold text-amber-900 hover:text-black underline"
            >
              Open Inbox
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-950 flex items-center gap-2">
                <span>{attentionItems[0].customerName}</span>
                <span className="text-[10px] font-semibold text-slate-500 font-mono">
                  {attentionItems[0].phone}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium">{attentionItems[0].reason}</p>
            </div>
            <Link
              href="/dashboard/leads"
              className="btn-primary !py-2 !px-4 !text-xs shrink-0"
            >
              Take Over Conversation
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid: Activity Stream + Setup Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Customer Activity */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 tracking-tight">Recent Customer Activity</h2>
              <p className="text-xs text-slate-500 font-medium">Live feed of real inquiries handled by your AI employee.</p>
            </div>
            <Link
              href="/dashboard/leads"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 underline underline-offset-2"
            >
              <span>View all in inbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentCustomers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-xl shadow-slate-200/50">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-950">No incoming customer inquiries yet</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
                When a customer sends a message on WhatsApp or through your website chat widget, their conversation will appear here in real-time.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link href="/dashboard/agent" className="btn-primary !py-2.5 !px-4 !text-xs">
                  Test AI in Studio
                </Link>
                <Link href="/dashboard/settings?tab=channels" className="btn-secondary !py-2.5 !px-4 !text-xs">
                  Connect Channels
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCustomers.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition flex items-start justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 font-bold text-xs">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-950">{c.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{c.phone}</span>
                        {c.isAi && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-bold">
                            AI Handled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">{c.action}</p>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 font-medium">
                        <span>Service: <strong className="text-slate-800">{c.service}</strong></span>
                        <span>&bull;</span>
                        <span>{c.time}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/leads"
                    className="btn-secondary !py-1.5 !px-3 !text-[11px] font-bold shrink-0"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Setup Checklist & Studio */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xl shadow-slate-200/50">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-slate-950">Setup Checklist</h3>
                <span className="text-xs font-black text-blue-600">{setupProgress.percentage || 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${setupProgress.percentage || 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {(setupProgress.steps || []).map((step: any) => (
                <div key={step.id} className="flex items-center justify-between text-xs py-1">
                  <span className={step.completed ? 'text-slate-800 font-bold' : 'text-slate-500 font-medium'}>
                    {step.label}
                  </span>
                  {step.completed ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Done
                    </span>
                  ) : (
                    <Link
                      href="/dashboard/settings"
                      className="text-blue-600 hover:text-blue-700 font-bold text-[11px] underline"
                    >
                      Connect &rarr;
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Studio Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-2 text-slate-950 font-black text-sm">
              <Bot className="w-4 h-4 text-blue-600" />
              <span>Test AI Employee Live</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Ask your AI employee real questions or test pricing accuracy in the interactive studio.
            </p>
            <Link
              href="/dashboard/agent"
              className="btn-primary w-full !py-2.5 !text-xs font-bold text-center shadow-md shadow-blue-500/20"
            >
              Open Studio Simulator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
