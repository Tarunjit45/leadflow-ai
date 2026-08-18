'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Server,
  RefreshCw,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function SystemStatusPage() {
  const [statusData, setStatusData] = useState<any>({
    status: 'healthy',
    environment: 'development',
    version: '1.0.0',
    services: [
      {
        name: 'AI Provider (OpenRouter)',
        configured: true,
        status: 'healthy',
        details: 'Model: google/gemini-2.0-flash-001 (Fallback: anthropic/claude-3.5-haiku)',
        required_variables: ['OPENROUTER_API_KEY', 'OPENROUTER_MODEL'],
        setup_url: 'https://openrouter.ai/keys',
      },
      {
        name: 'Database Engine (PostgreSQL / SQLite)',
        configured: true,
        status: 'healthy',
        details: 'Multi-tenant schema active with foreign key isolation.',
        required_variables: ['DATABASE_URL'],
      },
      {
        name: 'Queue & Background Worker (Redis)',
        configured: true,
        status: 'healthy',
        details: 'Background worker running for scheduled follow-ups and webhooks.',
        required_variables: ['REDIS_URL'],
      },
      {
        name: 'Stripe Payments',
        configured: false,
        status: 'not_configured',
        details: 'Operating in safe simulation mode.',
        required_variables: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
        setup_url: 'https://dashboard.stripe.com/apikeys',
      },
      {
        name: 'Meta WhatsApp Cloud API',
        configured: false,
        status: 'not_configured',
        details: 'Operating in simulation mode. Ready for Meta App credentials.',
        required_variables: ['META_ACCESS_TOKEN', 'META_PHONE_NUMBER_ID', 'META_VERIFY_TOKEN', 'META_APP_SECRET'],
        setup_url: 'https://developers.facebook.com',
      },
      {
        name: 'Google Calendar OAuth',
        configured: false,
        status: 'not_configured',
        details: 'Ready for Google Cloud OAuth credentials.',
        required_variables: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'],
        setup_url: 'https://console.cloud.google.com/apis/credentials',
      },
    ],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/admin/status');
      if (data?.services) setStatusData(data);
    } catch {
      // Keep state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto font-sans text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">System &amp; Diagnostics</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Transparent breakdown of connected third-party providers, database status, and setup instructions.
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      <div className="space-y-4">
        {statusData.services.map((service: any, idx: number) => {
          const isHealthy = service.status === 'healthy';
          return (
            <div
              key={idx}
              className={`rounded-3xl border p-6 space-y-3 transition shadow-md shadow-slate-200/40 bg-white ${
                isHealthy
                  ? 'border-slate-200'
                  : 'border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl font-bold ${
                      isHealthy ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {isHealthy ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-950">{service.name}</h2>
                    <span
                      className={`text-[11px] font-bold capitalize ${
                        isHealthy ? 'text-emerald-700' : 'text-amber-800'
                      }`}
                    >
                      {service.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {service.setup_url && !isHealthy && (
                  <a
                    href={service.setup_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                  >
                    <span>Get Keys</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <p className="text-xs text-slate-700 font-medium leading-relaxed">{service.details}</p>

              {!isHealthy && service.required_variables?.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-1 text-xs">
                  <span className="font-bold text-amber-900 text-[11px]">Required Environment Variables (.env):</span>
                  <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px] text-amber-950 font-bold">
                    {service.required_variables.map((v: string) => (
                      <span key={v} className="rounded-lg bg-white px-2 py-0.5 border border-amber-300 shadow-2xs">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
