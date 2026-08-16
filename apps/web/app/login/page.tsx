'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, Sparkles, Lock, Mail } from 'lucide-react';
import { fetchApi } from '../../lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-trigger demo login if ?demo=true
    if (searchParams.get('demo') === 'true') {
      handleDemoLogin();
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('leadflow_token', data.access_token);
      localStorage.setItem('leadflow_business_id', data.business_id || '');
      localStorage.setItem('leadflow_user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi('/auth/demo-login', { method: 'POST' });
      localStorage.setItem('leadflow_token', data.access_token);
      localStorage.setItem('leadflow_business_id', data.business_id || '');
      localStorage.setItem('leadflow_user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch {
      // Fallback local mock session for offline demo
      localStorage.setItem('leadflow_token', 'mock_jwt_demo_token');
      localStorage.setItem('leadflow_business_id', 'biz_demo_hvac_001');
      localStorage.setItem('leadflow_user', JSON.stringify({ name: 'Demo Operator', email: 'demo@leadflow.ai' }));
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 shadow-lg shadow-sky-600/30">
          <Bot className="h-7 w-7 text-white" />
        </div>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">Sign in to LeadFlow AI</h2>
        <p className="mt-2 text-xs text-slate-400">Access your live inbox, qualification rules, and appointments</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Demo Fast Login Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Instant Evaluation Sandbox</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-300">Test live conversation takeover, lead CRM, and calendar booking without credentials.</p>
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="mt-3 w-full rounded-xl bg-amber-500/20 border border-amber-500/40 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-500/30 transition shadow-sm"
        >
          {loading ? 'Entering Sandbox...' : '🚀 Enter 1-Click Demo Mode'}
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="block text-xs font-semibold text-slate-300">Email Address</label>
          <div className="relative mt-1">
            <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300">Password</label>
          <div className="relative mt-1">
            <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-sky-600 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="text-center text-xs text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-sky-400 hover:text-sky-300 transition">
          Create Business Workspace
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <Suspense fallback={<div className="text-slate-400 text-xs">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
