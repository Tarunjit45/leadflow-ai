'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Bot, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { fetchApi } from '@/lib/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordStats = useMemo(() => {
    const hasMinLength = newPassword.length >= 8;
    const hasNumber = /\d/.test(newPassword);
    const hasUpperOrSpecial = /[A-Z!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

    let score = 0;
    if (hasMinLength) score += 1;
    if (hasNumber) score += 1;
    if (hasUpperOrSpecial) score += 1;

    let strengthLabel = 'Weak';
    let strengthColor = 'bg-red-500';
    if (score === 2) {
      strengthLabel = 'Fair';
      strengthColor = 'bg-amber-500';
    } else if (score === 3) {
      strengthLabel = 'Strong';
      strengthColor = 'bg-emerald-500';
    }

    return {
      hasMinLength,
      hasNumber,
      hasUpperOrSpecial,
      score,
      strengthLabel,
      strengthColor,
      isValid: hasMinLength && hasNumber
    };
  }, [newPassword]);

  const doPasswordsMatch = useMemo(() => {
    return newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const isFormValid = useMemo(() => {
    return passwordStats.isValid && doPasswordsMatch && Boolean(token);
  }, [passwordStats, doPasswordsMatch, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setLoading(true);
    setErrorMessage('');

    try {
      await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: token,
          new_password: newPassword,
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Reset link is invalid or has expired.');
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
            Sign in
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          {!token ? (
            <div className="py-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Invalid Reset Link</h2>
              <p className="text-sm text-slate-400">
                This password reset link is missing a valid security token.
              </p>
              <div className="pt-2">
                <Link
                  href="/forgot-password"
                  className="inline-block py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors"
                >
                  Request a New Reset Link
                </Link>
              </div>
            </div>
          ) : !success ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Create a new password
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Choose a secure password for your LeadFlow AI workspace.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      New Password
                    </label>
                    {newPassword.length > 0 && (
                      <span className="text-[11px] font-semibold text-white">
                        {passwordStats.strengthLabel}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {newPassword.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${passwordStats.strengthColor}`} 
                          style={{ width: `${(passwordStats.score / 3) * 100}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${passwordStats.hasMinLength ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          {passwordStats.hasMinLength ? '✓' : '○'} 8+ characters
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${passwordStats.hasNumber ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          {passwordStats.hasNumber ? '✓' : '○'} Contains a number
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type your new password"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/70 border text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                        confirmPassword.length > 0
                          ? doPasswordsMatch
                            ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                            : 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full mt-3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update password</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="py-6 space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Password Updated!
                </h2>
                <p className="text-sm text-slate-400">
                  Your password has been changed and all old sessions have been secured.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all"
                >
                  Sign in with New Password
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Instant Multi-Device Session Invalidation</span>
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} LeadFlow AI Inc.
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
