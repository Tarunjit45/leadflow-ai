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
  TrendingUp,
  ShieldCheck,
  Zap,
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
    <div className="p-6 sm:p-8 lg:p-10 space-y-8 max-w-6xl mx-auto animate-fade-in">
      {/* Top Greeting & Status Banner */}
      <div className="rounded-3xl border border-slate-800/80 bg-[#0e131f] p-6 sm:p-8 shadow-premium space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
              {greeting} 👋
            </div>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {agentName} is {agentStatus === 'active' ? 'active & ready to answer leads' : 'currently paused'}.
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Workspace: <strong className="text-slate-200 font-semibold">{bizName}</strong> • Operating on real live data across WhatsApp and Web.
            </p>
          </div>

          {/* Master Toggle Button */}
          <div className="flex-shrink-0">
            {agentStatus === 'active' ? (
              <button
                onClick={handleToggleAutomation}
                disabled={statusLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 px-5 py-3 text-xs font-bold text-white shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse-calm" />
                <span>🟢 AI is Working</span>
                <span className="rounded bg-black/20 px-2 py-0.5 text-[10px] font-medium ml-1">
                  Click to Pause
                </span>
              </button>
            ) : (
              <button
                onClick={handleToggleAutomation}
                disabled={statusLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 px-5 py-3 text-xs font-bold text-white shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
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

        {/* 4 Real Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[11px] font-medium text-slate-400">Total Inquiries</div>
            <div className="text-2xl font-extrabold text-white">{metrics.customersHelped}</div>
            <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" /> Live Real Data
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[11px] font-medium text-slate-400">Qualified Leads</div>
            <div className="text-2xl font-extrabold text-blue-400">{metrics.newLeads}</div>
            <div className="text-[10px] text-slate-400">Services &amp; location confirmed</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[11px] font-medium text-slate-400">Appointments</div>
            <div className="text-2xl font-extrabold text-white">{metrics.appointmentsBooked}</div>
            <div className="text-[10px] text-emerald-400 font-semibold">Synced with calendar</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[11px] font-medium text-slate-400">Est. Revenue Recovered</div>
            <div className="text-2xl font-extrabold text-emerald-400">
              ${metrics.estimatedRevenue.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">From automated bookings</div>
          </div>
        </div>
      </div>

      {/* Needs Attention Warning Box (Only displays if real customer needs human review) */}
      {attentionItems.length > 0 && (
        <div className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Customer Conversation Needs Review</h2>
                <p className="text-xs text-amber-300/80">AI flagged this conversation for human attention.</p>
              </div>
            </div>
            <Link
              href="/dashboard/leads"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 underline"
            >
              Open Inbox
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e131f] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{attentionItems[0].customerName}</span>
                <span className="text-[10px] font-normal text-slate-400 font-mono">
                  {attentionItems[0].phone}
                </span>
              </div>
              <p className="text-xs text-slate-300">{attentionItems[0].reason}</p>
            </div>
            <Link
              href="/dashboard/leads"
              className="btn-primary py-2 px-4 text-xs font-bold shrink-0"
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
              <h2 className="text-lg font-bold text-white tracking-tight">Recent Customer Activity</h2>
              <p className="text-xs text-slate-400">Live feed of real inquiries handled by your AI employee.</p>
            </div>
            <Link
              href="/dashboard/leads"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View all in inbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentCustomers.length === 0 ? (
            <div className="rounded-3xl border border-slate-800/80 bg-[#0e131f] p-8 text-center space-y-3">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No incoming customer inquiries yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When a customer sends a message on WhatsApp or through your website chat widget, their conversation will appear here in real-time.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link href="/dashboard/agent" className="btn-primary py-2 px-4 text-xs">
                  Test AI in Studio
                </Link>
                <Link href="/dashboard/settings?tab=channels" className="btn-secondary py-2 px-4 text-xs">
                  Connect Channels
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCustomers.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-[#0e131f] border border-slate-800/80 hover:border-slate-700/80 transition-colors duration-150 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 font-bold text-xs text-slate-300">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{c.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{c.phone}</span>
                        {c.isAi && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold">
                            AI Handled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{c.action}</p>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>Service: <strong className="text-slate-400">{c.service}</strong></span>
                        <span>•</span>
                        <span>{c.time}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/leads"
                    className="btn-secondary py-1.5 px-3 text-[11px] font-semibold shrink-0"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Setup Checklist & Channels */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-slate-800/80 bg-[#0e131f] p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-sm font-bold text-white">Setup Checklist</h3>
                <span className="text-xs font-bold text-blue-400">{setupProgress.percentage || 0}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${setupProgress.percentage || 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {(setupProgress.steps || []).map((step: any) => (
                <div key={step.id} className="flex items-center justify-between text-xs">
                  <span className={step.completed ? 'text-slate-300 font-medium' : 'text-slate-400'}>
                    {step.label}
                  </span>
                  {step.completed ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  ) : (
                    <Link
                      href="/dashboard/settings"
                      className="text-blue-400 hover:underline font-bold text-[11px]"
                    >
                      Connect →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Studio Action */}
          <div className="rounded-3xl border border-slate-800/80 bg-[#0e131f] p-6 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Bot className="w-4 h-4 text-blue-400" />
              <span>Test AI Employee Live</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask your AI employee real questions or test pricing accuracy in the interactive studio.
            </p>
            <Link
              href="/dashboard/agent"
              className="btn-primary w-full py-2.5 text-xs font-bold text-center"
            >
              Open AI Studio
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
