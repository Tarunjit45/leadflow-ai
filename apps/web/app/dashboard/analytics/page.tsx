'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>({
    total_leads: 0,
    leads_contacted: 0,
    qualified_leads: 0,
    hot_leads: 0,
    appointments_booked: 0,
    follow_ups_sent: 0,
    recovered_leads: 0,
    conversion_rate_pct: 0,
    avg_response_time_seconds: 0,
    estimated_revenue_recovered: 0,
    average_job_value: 850.0,
    leads_by_source: {},
    leads_by_intent: {},
    weekly_trend: [
      { day: 'Mon', leads: 0, appointments: 0 },
      { day: 'Tue', leads: 0, appointments: 0 },
      { day: 'Wed', leads: 0, appointments: 0 },
      { day: 'Thu', leads: 0, appointments: 0 },
      { day: 'Fri', leads: 0, appointments: 0 },
      { day: 'Sat', leads: 0, appointments: 0 },
      { day: 'Sun', leads: 0, appointments: 0 },
    ],
  });

  const [avgValue, setAvgValue] = useState<number>(850);

  useEffect(() => {
    fetchApi('/analytics/summary')
      .then((res) => {
        if (res) {
          setData(res);
          if (res.average_job_value) setAvgValue(res.average_job_value);
        }
      })
      .catch(() => {});
  }, []);

  const dynamicRecoveredRevenue = (data.recovered_leads || 0) * avgValue;

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Revenue Recovery & Pipeline Analytics</h1>
        <p className="text-xs text-slate-400">Measurable business conversion, lead velocity, and estimated recovered revenue.</p>
      </div>

      {/* Recovered Revenue Hero Card */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-8 shadow-2xl">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Estimated Revenue Recovered</span>
            </div>
            <div className="mt-4 text-4xl sm:text-5xl font-black text-white tracking-tight">
              ${dynamicRecoveredRevenue.toLocaleString()}
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Calculated as <strong className="text-white">{data.recovered_leads || 0} recovered leads</strong> × ${avgValue} average job value. Reclaimed from after-hours messages and multi-stage automated follow-ups.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-300">Adjust Average Job Value ($)</span>
              <span className="text-emerald-400 font-bold text-sm">${avgValue}</span>
            </div>
            <input
              type="range"
              min="200"
              max="4000"
              step="50"
              value={avgValue}
              onChange={(e) => setAvgValue(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>$200 Diagnostic</span>
              <span>$850 Average</span>
              <span>$4,000 Major Install</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Inbound Leads</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">{data.total_leads}</div>
          <div className="mt-1 text-[11px] text-emerald-400 font-medium">100% real database leads</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Qualified Hot Leads</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{data.qualified_leads}</div>
          <div className="mt-1 text-[11px] text-slate-400">Score &gt;= 60 & verified intent</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Confirmed Bookings</span>
            <Calendar className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{data.appointments_booked}</div>
          <div className="mt-1 text-[11px] text-sky-400 font-medium">{data.conversion_rate_pct}% conversion rate</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Avg. AI Response Speed</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{data.avg_response_time_seconds}s</div>
          <div className="mt-1 text-[11px] text-slate-400">Live AI agent engine</div>
        </div>
      </div>

      {/* Conversion Funnel & Weekly Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Funnel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Lead Conversion Funnel</h2>
          <div className="space-y-3 pt-2">
            {[
              { label: '1. Inbound Inquiries', val: data.total_leads, pct: '100%', color: 'bg-sky-500' },
              { label: '2. Contacted & Engaged', val: data.leads_contacted, pct: data.total_leads > 0 ? '100%' : '0%', color: 'bg-sky-400' },
              { label: '3. AI Qualified', val: data.qualified_leads, pct: `${data.total_leads > 0 ? Math.round((data.qualified_leads / data.total_leads) * 100) : 0}%`, color: 'bg-blue-500' },
              { label: '4. Appointments Booked', val: data.appointments_booked, pct: `${data.total_leads > 0 ? Math.round((data.appointments_booked / data.total_leads) * 100) : 0}%`, color: 'bg-emerald-500' },
            ].map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{step.label}</span>
                  <span className="text-white font-mono">{step.val} ({step.pct})</span>
                </div>
                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div className={`h-full ${step.color} rounded-full transition-all duration-300`} style={{ width: step.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Volume */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">7-Day Activity Trend</h2>
          <div className="flex items-end justify-between h-48 pt-6 px-2 gap-2">
            {data.weekly_trend?.map((item: any, idx: number) => {
              const maxLeads = Math.max(...(data.weekly_trend?.map((w: any) => w.leads) || [1]), 5);
              const heightPct = item.leads > 0 ? Math.min(Math.max((item.leads / maxLeads) * 100, 15), 100) : 4;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-mono">{item.leads}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-sky-600 to-sky-400 shadow-md transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
