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
    let strengthColor = 'bg-rose-100 text-rose-800 border-rose-300';
    if (score === 2) {
      strengthLabel = 'Fair';
      strengthColor = 'bg-amber-100 text-amber-800 border-amber-300';
    } else if (score === 3) {
      strengthLabel = 'Strong';
      strengthColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
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
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 animate-fade-in my-8">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/70 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
          
          {!token ? (
            <div className="py-6 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 border border-rose-300 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                Invalid Reset Link
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                This password reset link is missing a security token or has already expired.
              </p>
              <div className="pt-2">
                <Link
                  href="/forgot-password"
                  className="btn-primary w-full py-3 text-xs font-bold inline-block text-center shadow-md shadow-blue-500/20"
                >
                  Request New Reset Link
                </Link>
              </div>
            </div>
          ) : !success ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-black tracking-tight text-slate-950">
                  Set new password
                </h1>
                <p className="text-slate-500 text-xs mt-1 font-medium">
                  Create a secure password with at least 8 characters and 1 number.
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      New Password
                    </label>
                    {newPassword.length > 0 && (
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${passwordStats.strengthColor}`}>
                        {passwordStats.strengthLabel}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="8+ characters, 1 number"
                      className="input-field pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Confirm New Password
                    </label>
                    {confirmPassword.length > 0 && (
                      <span className={`text-[11px] font-bold ${doPasswordsMatch ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {doPasswordsMatch ? '✓ Matches' : 'Mismatch'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="input-field pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="btn-primary w-full py-3.5 text-sm font-bold mt-2 shadow-lg shadow-blue-500/25"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="py-6 space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Password Updated!
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Your password has been changed securely and previous sessions have been invalidated.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="btn-primary w-full py-3 px-4 text-xs font-bold inline-block text-center shadow-md shadow-blue-500/20"
                >
                  Sign In with New Password
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted • Single-Use Token Revocation</span>
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/60 px-6 py-4 text-center text-xs font-semibold text-slate-500">
        © {new Date().getFullYear()} LeadFlow AI Inc. All rights reserved.
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
