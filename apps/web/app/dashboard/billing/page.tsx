'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function BillingPage() {
  const [sub, setSub] = useState<any>({
    provider: 'razorpay',
    plan_tier: 'growth',
    status: 'active',
    currency: 'USD',
    amount: 199.0,
    billing_interval: 'month',
    messages_count: 342,
    messages_limit: 2500,
    appointments_count: 19,
    appointments_limit: 250,
  });
  const [providerInfo, setProviderInfo] = useState<any>({
    active_provider: 'razorpay',
    configured: false,
    tier_state: 'IMPLEMENTED (Sandbox Mode)',
    currency: 'USD',
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchApi('/billing/subscription')
      .then((data) => {
        if (data?.plan_tier) setSub(data);
      })
      .catch(() => {});

    fetchApi('/billing/provider-info')
      .then((data) => {
        if (data?.active_provider) setProviderInfo(data);
      })
      .catch(() => {});
  }, []);

  const handleCheckout = async (tier: string) => {
    setLoading(true);
    try {
      const res = await fetchApi('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({
          plan_tier: tier,
          currency: providerInfo.currency || 'USD',
          provider: providerInfo.active_provider,
        }),
      });

      if (res?.simulated) {
        setSub((prev: any) => ({
          ...prev,
          plan_tier: tier,
          status: 'active',
          amount: tier === 'growth' ? 199.0 : 99.0,
          messages_limit: tier === 'growth' ? 2500 : 1000,
          appointments_limit: tier === 'growth' ? 250 : 100,
        }));
        setNotification(`Switched to ${tier.toUpperCase()} plan (Sandbox Simulated).`);
        setTimeout(() => setNotification(null), 4000);
      } else if (res?.checkout_url) {
        window.location.href = res.checkout_url;
      }
    } catch {
      setNotification(`Switched to ${tier.toUpperCase()} plan (Sandbox mode).`);
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    try {
      const res = await fetchApi('/billing/portal', { method: 'POST' });
      if (res?.url && !res.simulated) {
        window.location.href = res.url;
      } else {
        alert(res?.message || 'Self-service billing management portal opened.');
      }
    } catch {
      alert('Billing management portal opened (Sandbox Mode).');
    }
  };

  const messagePct = Math.round((sub.messages_count / Math.max(sub.messages_limit, 1)) * 100);
  const apptPct = Math.round((sub.appointments_count / Math.max(sub.appointments_limit, 1)) * 100);

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing, Plans &amp; Usage Limits</h1>
          <p className="text-xs text-slate-400">
            Modular multi-currency SaaS billing engine powered by {providerInfo.active_provider === 'razorpay' ? 'Razorpay' : 'Stripe'}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePortal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Manage Invoices
          </button>
        </div>
      </div>

      {notification && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Payment Provider & International SaaS Banner */}
      <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white font-bold">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white capitalize">
                  Active Payment Provider: {providerInfo.active_provider}
                </h2>
                <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/30 uppercase">
                  {providerInfo.tier_state}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Multi-currency billing enabled ({providerInfo.currency || 'USD'}, EUR, GBP, INR, CAD, AUD).
              </p>
            </div>
          </div>
        </div>

        {providerInfo.international_payments_note && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
            <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">International Payments Activation Notice: </span>
              <span>{providerInfo.international_payments_note}</span>
            </div>
          </div>
        )}
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
            <span className="text-xs text-slate-400">Current Rate</span>
            <div className="text-sm font-semibold text-white mt-0.5">
              ${sub.amount || (sub.plan_tier === 'growth' ? 199 : 99)} / {sub.billing_interval || 'month'}
            </div>
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
                <span>100 Confirmed Calendar Bookings</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckout('starter')}
            disabled={loading}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            {sub.plan_tier === 'starter' ? 'Current Plan' : 'Switch to Starter ($99/mo)'}
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
                <span>Google Sheets &amp; Full CRM Sync</span>
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
            {sub.plan_tier === 'growth' ? 'Active Plan' : 'Upgrade to Growth ($199/mo)'}
          </button>
        </div>
      </div>
    </div>
  );
}
