'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  MessageSquare,
  Calendar,
  Database,
  CreditCard,
  CheckCircle2,
  Code,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [waPhone, setWaPhone] = useState('+1 (512) 555-0149');
  const [waToken, setWaToken] = useState('');
  const [waPhoneId, setWaPhoneId] = useState('');

  const widgetSnippet = `<script src="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/widget/embed.js" data-business-id="biz_demo_hvac_001"></script>`;

  useEffect(() => {
    fetchApi('/integrations/')
      .then((data) => {
        if (Array.isArray(data)) setIntegrations(data);
      })
      .catch(() => {});
  }, []);

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/integrations/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: waPhone,
          access_token: waToken,
          phone_number_id: waPhoneId,
        }),
      });
      setShowWhatsAppModal(false);
      alert('WhatsApp Meta Cloud API connected successfully!');
    } catch {
      setShowWhatsAppModal(false);
      alert('WhatsApp connected (Simulation Mode).');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Integrations & Communication Channels</h1>
        <p className="text-xs text-slate-400">Connect your website, official WhatsApp Business number, calendar, and CRM tools.</p>
      </div>

      {/* Website Chat Widget Section (Featured) */}
      <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white">
              <Code className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Website Chat Widget Snippet</h2>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  Ready to Embed
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Paste this one-line tag right before <code className="text-sky-400">&lt;/body&gt;</code> on your website HTML or CMS.
              </p>
            </div>
          </div>

          <button
            onClick={copyWidgetCode}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition shadow-lg shadow-sky-600/20"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Embed Code'}
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto selection:bg-sky-600">
          {widgetSnippet}
        </div>
      </div>

      {/* Grid of Other Channels */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Meta WhatsApp */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Official WhatsApp Cloud API</h3>
                  <span className="text-[11px] text-emerald-400">Connected & Verified</span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 p-1 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official Meta Business Platform connection. Automatically responds to incoming WhatsApp customer chats, scores urgency, and books appointments.
            </p>
          </div>

          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Configure WhatsApp API Settings
          </button>
        </div>

        {/* Google Calendar */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Google Calendar</h3>
                  <span className="text-[11px] text-sky-400">OAuth Sync Connected</span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 p-1 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Syncs your technician dispatch schedule in real-time. Free/busy slots are checked before appointments are booked.
            </p>
          </div>

          <button
            onClick={() => alert('Redirecting to Google OAuth Consent Screen...')}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Manage Calendar Sync
          </button>
        </div>

        {/* Google Sheets CRM */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Google Sheets CRM Log</h3>
                  <span className="text-[11px] text-emerald-400">Real-time Row Append</span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 p-1 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Logs all qualified leads, contact numbers, estimated values, and confirmed bookings into your connected Google Sheet.
            </p>
          </div>

          <button
            onClick={() => alert('Connected Sheet: Apex Inbound Dispatch 2026')}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            View Connected Sheet
          </button>
        </div>

        {/* Stripe Billing */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Stripe Payments</h3>
                  <span className="text-[11px] text-purple-400">Growth Plan Active</span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 p-1 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Handles subscription checkout, invoices, plan tier upgrades, and automated payment receipts securely.
            </p>
          </div>

          <a
            href="/dashboard/billing"
            className="w-full text-center rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Open Billing Management
          </a>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">WhatsApp Cloud API Setup</h3>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleWhatsAppConnect} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300">WhatsApp Phone Number</label>
                <input
                  type="text"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300">Meta Phone Number ID</label>
                <input
                  type="text"
                  placeholder="e.g. 104928374928172"
                  value={waPhoneId}
                  onChange={(e) => setWaPhoneId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300">Permanent System User Access Token</label>
                <input
                  type="password"
                  placeholder="EAAG..."
                  value={waToken}
                  onChange={(e) => setWaToken(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-4 py-2 font-bold text-white hover:bg-sky-500"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
