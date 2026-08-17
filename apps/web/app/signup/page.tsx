'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  CheckCircle2, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  // Email syntax validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = useMemo(() => emailRegex.test(email.trim().toLowerCase()), [email]);

  // Password Policy Analysis
  const passwordStats = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasUpperOrSpecial = /[A-Z!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

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
  }, [password]);

  const doPasswordsMatch = useMemo(() => {
    return password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  }, [password, confirmPassword]);

  const isFormValid = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      isEmailValid &&
      passwordStats.isValid &&
      doPasswordsMatch &&
      agreeTerms
    );
  }, [name, isEmailValid, passwordStats, doPasswordsMatch, agreeTerms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          agree_terms: agreeTerms,
        }),
      });

      if (res.requires_verification) {
        setMaskedEmail(res.masked_email || email);
        if (res.dev_verification_token) {
          setDevToken(res.dev_verification_token);
        }
        setIsSubmitted(true);
      } else if (res.access_token) {
        localStorage.setItem('leadflow_token', res.access_token);
        if (res.business_id) {
          localStorage.setItem('leadflow_business_id', res.business_id);
        }
        if (res.user) {
          localStorage.setItem('leadflow_user', JSON.stringify(res.user));
        }
        router.push('/onboarding');
      }
    } catch (err: any) {
      const msg = err.message || 'We could not complete signup. Please check your connection and try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendStatus('');
    try {
      await fetchApi('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setResendStatus('A new verification link has been sent to your email.');
    } catch (err) {
      setResendStatus('If this account exists, a link was sent.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">LeadFlow<span className="text-sky-400">.ai</span></span>
          </Link>
          <div className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-sky-400 font-semibold hover:text-sky-300 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand, Trust & Value Proposition */}
          <div className="lg:col-span-5 space-y-6 hidden lg:block">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autonomous Business Growth</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Hire your 24/7 AI employee in <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">3 minutes</span>.
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed">
              Never miss another customer lead again. LeadFlow AI instantly qualifies incoming messages, answers questions, and books appointments on your calendar.
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span><strong>2-Second Response:</strong> Answers customer inquiries instantly on WhatsApp and your website.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span><strong>No Coding Needed:</strong> Built specifically for non-technical business owners.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span><strong>Live Calendar Booking:</strong> Integrates directly with Google Calendar for dispatch.</span>
              </div>
            </div>

            {/* Testimonial / Trust Badge */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <p className="text-xs italic text-slate-300 leading-relaxed">
                &ldquo;LeadFlow recovered 4 HVAC repair bookings on our very first weekend when the office was closed. It paid for itself 10x over.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-600/30 flex items-center justify-center text-xs font-bold text-sky-400">
                  MR
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Mark Reynolds</div>
                  <div className="text-[10px] text-slate-500">Owner, Apex Comfort HVAC</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Signup Form or Verification Prompt */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
              
              {!isSubmitted ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Create your business workspace
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Set up your 24/7 AI employee in a few simple steps.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div>{errorMessage}</div>
                        {errorMessage.includes('already be registered') && (
                          <div className="mt-2 flex gap-3">
                            <Link href="/login" className="font-bold underline hover:text-red-300">Sign in now</Link>
                            <Link href="/forgot-password" className="font-bold underline hover:text-red-300">Reset password</Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Your Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Work Email Address
                        </label>
                        {email.length > 0 && (
                          <span className={`text-[11px] font-medium ${isEmailValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isEmailValid ? '✓ Valid format' : 'Invalid email'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="sarah@yourcompany.com"
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                            email.length > 0
                              ? isEmailValid 
                                ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                                : 'border-amber-500/50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                              : 'border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Create Password
                        </label>
                        {password.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-400">Strength:</span>
                            <span className="font-semibold text-white">{passwordStats.strengthLabel}</span>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                          tabIndex={-1}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password Requirements Badges */}
                      {password.length > 0 && (
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
                        Confirm Password
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
                          placeholder="Re-type your password"
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
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && !doPasswordsMatch && (
                        <p className="text-[11px] text-red-400 mt-1">Passwords do not match.</p>
                      )}
                    </div>

                    {/* Terms and Privacy Policy Checkbox */}
                    <div className="pt-2">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-600 focus:ring-sky-500/30"
                        />
                        <span className="text-xs text-slate-400 leading-relaxed">
                          I agree to the{' '}
                          <Link href="/terms" target="_blank" className="text-sky-400 underline hover:text-sky-300">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" target="_blank" className="text-sky-400 underline hover:text-sky-300">
                            Privacy Policy
                          </Link>
                          .
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={!isFormValid || loading}
                      className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Creating your workspace...</span>
                        </>
                      ) : (
                        <>
                          <span>Create my workspace</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                /* Check Your Email Verification Screen */
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Check your email
                    </h2>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                      We sent a secure verification link to:
                    </p>
                    <div className="inline-block px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-sky-400 font-mono text-sm font-semibold">
                      {maskedEmail}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-left text-xs text-slate-400 space-y-2 max-w-md mx-auto">
                    <div className="flex items-center gap-2 text-slate-300 font-semibold">
                      <Clock className="w-4 h-4 text-sky-400" />
                      <span>Next Steps:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                      <li>Open the verification email from LeadFlow AI.</li>
                      <li>Click <strong>&quot;Verify My Email&quot;</strong> to activate your account.</li>
                      <li>You will instantly be taken to configure your AI employee.</li>
                    </ol>
                  </div>

                  {resendStatus && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                      {resendStatus}
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="space-y-3 pt-2 max-w-md mx-auto">
                    <a
                      href={`https://${email.includes('@') ? email.split('@')[1] : 'gmail.com'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Open Email Provider</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <div className="flex items-center justify-between gap-4 pt-2">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resending}
                        className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                        <span>Resend verification email</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsSubmitted(false)}
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Change email
                      </button>
                    </div>

                    {devToken && (
                      <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-left">
                        <div className="font-bold">⚡ Developer Auto-Verify Link:</div>
                        <Link 
                          href={`/verify-email?token=${devToken}`}
                          className="text-sky-400 underline break-all mt-1 inline-block"
                        >
                          Click here to verify instantly (Development Mode)
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Security Guarantee */}
              <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>256-bit encrypted • Bank-grade data protection • No credit card required</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} LeadFlow AI Inc. All rights reserved.
      </footer>
    </div>
  );
}
