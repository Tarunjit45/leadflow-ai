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
    <div className="min-h-screen bg-slate-50 bg-ambient-pitch text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/30 transition-transform duration-200 group-hover:scale-105">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-950">LeadFlow<span className="text-blue-600 font-mono">.ai</span></span>
          </Link>
          <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
            Sign in &rarr;
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 animate-fade-in my-8">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/70 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
          
          {status === 'verifying' && (
            <div className="py-8 space-y-4">
              <div className="w-14 h-14 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto" />
              <h2 className="text-xl font-black text-slate-950">Verifying your email...</h2>
              <p className="text-xs text-slate-500 font-medium">
                Please wait while we secure your business workspace.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-6 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Email Verified!
                </h2>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Your account is active. Let&apos;s set up your business details and AI persona.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/onboarding"
                  className="btn-primary w-full py-3.5 px-6 text-sm font-bold shadow-lg shadow-blue-500/25 inline-flex items-center justify-center gap-2"
                >
                  <span>Continue to Workspace Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="py-6 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto shadow-md">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Verification Failed
                </h2>
                <p className="text-xs text-rose-700 mt-1 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {errorMessage}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs text-slate-500 font-medium">
                  Need a new verification email? Enter your email address below:
                </p>
                <form onSubmit={handleResend} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="input-field"
                  />
                  <button
                    type="submit"
                    disabled={resending || !resendEmail}
                    className="btn-secondary w-full py-2.5 text-xs font-bold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    <span>Send Fresh Verification Link</span>
                  </button>
                  {resendStatus && (
                    <p className="text-xs text-emerald-700 font-bold">{resendStatus}</p>
                  )}
                </form>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>End-to-End Cryptographic Security</span>
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/60 px-6 py-4 text-center text-xs font-semibold text-slate-500">
        © {new Date().getFullYear()} LeadFlow AI Inc. All rights reserved.
      </footer>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
