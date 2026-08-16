'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function BillingPage() {
  const [sub, setSub] = useState<any>({
    plan_tier: 'growth',
    status: 'active',
    messages_count: 342,
    messages_limit: 2500,
    appointments_count: 19,
    appointments_limit: 250,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApi('/billing/subscription')
      .then((data) => {
        if (data?.plan_tier) setSub(data);
      })
      .catch(() => {});
  }, []);

  const handleCheckout = async (tier: string) => {
    setLoading(true);
    try {
      const res = await fetchApi('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan_tier: tier }),
      });
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch {
      alert(`Stripe Checkout simulated for ${tier.toUpperCase()} plan.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    try {
      const res = await fetchApi('/billing/portal', { method: 'POST' });
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch {
      alert('Stripe Customer Portal simulated.');
    }
  };

  const messagePct = Math.round((sub.messages_count / Math.max(sub.messages_limit, 1)) * 100);
  const apptPct = Math.round((sub.appointments_count / Math.max(sub.appointments_limit, 1)) * 100);

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing, Plans & Usage Limits</h1>
          <p className="text-xs text-slate-400">Manage your subscription, plan limits, and Stripe payment methods.</p>
        </div>

        <button
          onClick={handlePortal}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
        >
          <CreditCard className="h-3.5 w-3.5" />
          Manage Stripe Portal
        </button>
      </div>

      {/* Usage Counters */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Subscription</span>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-2xl font-bold text-white capitalize">{sub.plan_tier} Plan</h2>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30 capitalize">
                {sub.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Next Billing Cycle</span>
            <div className="text-sm font-semibold text-white mt-0.5">30 Days Remaining</div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 pt-2">
          {/* Messages Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">AI Messages Quota</span>
              <span className="text-sky-400 font-mono">{sub.messages_count} / {sub.messages_limit} ({messagePct}%)</span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${messagePct}%` }} />
            </div>
          </div>

          {/* Appointments Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Calendar Bookings Quota</span>
              <span className="text-emerald-400 font-mono">{sub.appointments_count} / {sub.appointments_limit} ({apptPct}%)</span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${apptPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans Selection */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Starter */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Starter Plan</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">$99</span>
              <span className="text-xs text-slate-400">/month</span>
            </div>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                <span>1,000 AI Messages/mo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                <span>Website Chat + WhatsApp Cloud API</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                <span>Google Calendar Booking</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckout('starter')}
            disabled={loading}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            {sub.plan_tier === 'starter' ? 'Current Plan' : 'Switch to Starter'}
          </button>
        </div>

        {/* Growth */}
        <div className="rounded-3xl border-2 border-sky-500 bg-slate-900/90 p-6 flex flex-col justify-between space-y-6 shadow-xl shadow-sky-500/10">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Growth Plan</h3>
              <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase">
                Active Tier
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">$199</span>
              <span className="text-xs text-slate-400">/month</span>
            </div>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                <span>2,500 AI Messages/mo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                <span>250 Confirmed Calendar Appointments</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                <span>Google Sheets & Full CRM Sync</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                <span>Revenue Recovery Analytics Suite</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckout('growth')}
            disabled={loading}
            className="w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition"
          >
            {sub.plan_tier === 'growth' ? 'Active Plan' : 'Upgrade to Growth'}
          </button>
        </div>
      </div>
    </div>
  );
}
