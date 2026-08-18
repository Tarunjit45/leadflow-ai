'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, Mail, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showForgotEmailHelp, setShowForgotEmailHelp] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim().toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid || loading) return;

    setLoading(true);
    setErrorMessage('');

    try {
      await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to process reset request. Please check your connection.');
    } finally {
      setLoading(false);
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
            Return to Sign in &rarr;
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 animate-fade-in my-8">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/70 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
          
          {!submitted ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-black tracking-tight text-slate-950">
                  Forgot your password?
                </h1>
                <p className="text-slate-500 text-xs mt-1 font-medium">
                  Enter the email address associated with your account and we&apos;ll send you a secure reset link.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@business.com"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isEmailValid}
                  className="btn-primary w-full py-3.5 text-sm font-bold mt-2 shadow-lg shadow-blue-500/25"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send reset link</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Forgot Email Recovery Guidance */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setShowForgotEmailHelp(!showForgotEmailHelp)}
                  className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 font-bold"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Can&apos;t remember your email?</span>
                </button>

                {showForgotEmailHelp && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-2 leading-relaxed font-medium">
                    <p>
                      Check your inbox or search for emails sent from <strong>support@leadflow.ai</strong> or your WhatsApp Business confirmations.
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      For security, we cannot reveal registered email addresses without verifying ownership through your support representative.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-6 space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Check your inbox
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto font-medium">
                  If an account exists for <strong className="text-slate-950">{email}</strong>, we&apos;ve sent a password reset link.
                </p>
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                Please check your spam or junk folder if you don&apos;t see the email within 2 minutes. The link will expire in 1 hour.
              </p>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="btn-secondary w-full py-3 px-4 text-xs font-bold inline-block text-center"
                >
                  Return to Sign in
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographically Random • Single-Use Tokens</span>
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/60 px-6 py-4 text-center text-xs font-semibold text-slate-500">
        © {new Date().getFullYear()} LeadFlow AI Inc. All rights reserved.
      </footer>
    </div>
  );
}
