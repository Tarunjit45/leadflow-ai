'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Bot, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { fetchApi } from '@/lib/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided. Please check the link in your email.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetchApi('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });

        if (res.access_token) {
          localStorage.setItem('leadflow_token', res.access_token);
          if (res.business_id) {
            localStorage.setItem('leadflow_business_id', res.business_id);
          }
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage('Invalid verification response from server.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Verification link is invalid or has expired.');
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    setResendStatus('');
    try {
      await fetchApi('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      });
      setResendStatus('A fresh verification link has been sent to your email.');
    } catch (err: any) {
      setResendStatus('If an unverified account exists, a link was sent.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">LeadFlow<span className="text-sky-400">.ai</span></span>
          </Link>
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center">
          
          {status === 'verifying' && (
            <div className="py-8 space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-white">Verifying your email...</h2>
              <p className="text-sm text-slate-400">
                Please wait while we secure your business workspace.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-6 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
                <p className="text-sm text-slate-400">
                  Your LeadFlow AI business workspace has been successfully activated.
                </p>
              </div>
              <button
                onClick={() => router.push('/onboarding')}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Continue to Business Setup</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-6 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Verification Failed</h2>
                <p className="text-sm text-red-300">
                  {errorMessage}
                </p>
              </div>

              {/* Resend Form */}
              <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Enter your email to get a new link
                </label>
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="yourname@business.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>Resend verification email</span>
                </button>
                {resendStatus && (
                  <p className="text-xs text-emerald-400 text-center pt-1">{resendStatus}</p>
                )}
              </form>

              <div className="pt-4 border-t border-slate-800">
                <Link href="/login" className="text-xs text-sky-400 hover:underline">
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4" />
            <span>Encrypted Authentication</span>
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} LeadFlow AI Inc.
      </footer>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
