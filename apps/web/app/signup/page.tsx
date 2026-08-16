'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, ArrowRight, Lock, Mail, User, Building } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      localStorage.setItem('leadflow_token', data.access_token);
      localStorage.setItem('leadflow_business_id', data.business_id || '');
      localStorage.setItem('leadflow_user', JSON.stringify(data.user));
      // Route new user to guided onboarding
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 shadow-lg shadow-sky-600/30">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">Create LeadFlow AI Workspace</h2>
          <p className="mt-2 text-xs text-slate-400">Start your 7-day trial. Set up your autonomous AI sales assistant.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSignup}>
          <div>
            <label className="block text-xs font-semibold text-slate-300">Your Full Name</label>
            <div className="relative mt-1">
              <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Work Email Address</label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@apexservices.com"
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
                minLength={6}
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
            className="w-full rounded-xl bg-sky-600 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Workspace...' : 'Proceed to Business Setup'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-sky-400 hover:text-sky-300 transition">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
