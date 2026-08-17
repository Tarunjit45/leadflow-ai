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
            Return to Sign in
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          {!submitted ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Forgot your password?
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Enter the email address associated with your account and we&apos;ll send you a secure reset link.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@business.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isEmailValid}
                  className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setShowForgotEmailHelp(!showForgotEmailHelp)}
                  className="text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Can&apos;t remember your email?</span>
                </button>

                {showForgotEmailHelp && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-slate-400 space-y-2 leading-relaxed">
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
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Check your inbox
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                  If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
                </p>
              </div>

              <p className="text-xs text-slate-500">
                Please check your spam or junk folder if you don&apos;t see the email within 2 minutes. The link will expire in 1 hour.
              </p>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full inline-block py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                >
                  Return to Sign in
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Cryptographically Random • Single-Use Tokens</span>
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} LeadFlow AI Inc.
      </footer>
    </div>
  );
}
