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
  Building,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import PhoneInputWithCountry from '@/components/PhoneInputWithCountry';

export default function SignupPage() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [city, setCity] = useState('');
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
    let strengthColor = 'bg-rose-100 text-rose-800 border-rose-300';
    let barColor = 'bg-rose-500';
    let barWidth = 'w-1/3';

    if (score === 2) {
      strengthLabel = 'Fair';
      strengthColor = 'bg-amber-100 text-amber-800 border-amber-300';
      barColor = 'bg-amber-500';
      barWidth = 'w-2/3';
    } else if (score === 3) {
      strengthLabel = 'Strong';
      strengthColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      barColor = 'bg-emerald-500';
      barWidth = 'w-full';
    }

    const passwordsMatch = password.length > 0 && password === confirmPassword;

    return {
      hasMinLength,
      hasNumber,
      hasUpperOrSpecial,
      score,
      strengthLabel,
      strengthColor,
      barColor,
      barWidth,
      passwordsMatch,
    };
  }, [password, confirmPassword]);

  const isFormValid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      businessName.trim().length > 0 &&
      isEmailValid &&
      passwordStats.score >= 2 &&
      passwordStats.passwordsMatch &&
      agreeTerms
    );
  }, [name, businessName, isEmailValid, passwordStats, agreeTerms]);

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
          business_name: businessName.trim(),
          phone: phone.trim(),
          city: city.trim(),
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
    <div className="min-h-screen bg-slate-50 bg-ambient-pitch text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/30 transition-transform duration-200 group-hover:scale-105">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-950">LeadFlow<span className="text-blue-600 font-mono">.ai</span></span>
          </Link>
          <div className="text-xs font-semibold text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors underline decoration-blue-200 underline-offset-2">
              Sign in &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 sm:my-8 animate-fade-in">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Value Prop */}
          <div className="lg:col-span-5 space-y-6 hidden lg:block">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real 24/7 AI Sales Employee</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 leading-tight">
              Turn every WhatsApp &amp; web inquiry into a booked customer.
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              Deploy your own autonomous AI agent in under 3 minutes. Never lose a lead while on a job or after hours.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 text-xs text-slate-700 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center shrink-0 mt-0.5 font-black text-[11px]">
                  ✓
                </div>
                <span><strong className="text-slate-950">Instant &lt; 2s Replies:</strong> Your AI answers inquiries, quotes prices from your catalog, and books appointments 24/7.</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-slate-700 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center shrink-0 mt-0.5 font-black text-[11px]">
                  ✓
                </div>
                <span><strong className="text-slate-950">Worldwide WhatsApp Support:</strong> Connect your real WhatsApp Business number with any country code.</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-slate-700 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center shrink-0 mt-0.5 font-black text-[11px]">
                  ✓
                </div>
                <span><strong className="text-slate-950">Zero Technical Skills:</strong> Intuitive step-by-step setup wizard with live Google Calendar sync.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Signup Form or Verification Prompt */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xl shadow-slate-200/70">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
              
              {!isSubmitted ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">
                      Create your business workspace
                    </h2>
                    <p className="text-slate-500 text-xs mt-1 font-medium">
                      Enter your real business details to train your AI sales assistant.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <div className="flex-1">
                        <div>{errorMessage}</div>
                        {errorMessage.includes('already be registered') && (
                          <div className="mt-2 flex gap-3">
                            <Link href="/login" className="font-bold underline text-rose-900 hover:text-rose-950">Sign in now</Link>
                            <Link href="/forgot-password" className="font-bold underline text-rose-900 hover:text-rose-950">Reset password</Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name & Business Name Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Your Full Name *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Tarunjit Biswas"
                            className="input-field pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Business Name *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Building className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g. Biswas Home Services"
                            className="input-field pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Business Phone with Country Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          WhatsApp Business Number *
                        </label>
                        <PhoneInputWithCountry
                          value={phone}
                          onChange={setPhone}
                          defaultCountryCode="IN"
                          placeholder="98765 43210"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Service City / Region
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g. Kolkata, WB or Mumbai"
                            className="input-field pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Address */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Work Email Address *
                        </label>
                        {email.length > 0 && (
                          <span className={`text-[11px] font-bold ${isEmailValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isEmailValid ? '✓ Valid format' : 'Invalid email format'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@yourbusiness.com"
                          className={`input-field pl-10 ${
                            email.length > 0
                              ? isEmailValid 
                                ? 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-100' 
                                : 'border-amber-400 focus:border-amber-600 focus:ring-amber-100'
                              : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password & Confirm Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Password *
                          </label>
                          {password.length > 0 && (
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="8+ characters"
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
                            Confirm Password *
                          </label>
                          {confirmPassword.length > 0 && (
                            <span className={`text-[11px] font-bold ${passwordStats.passwordsMatch ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {passwordStats.passwordsMatch ? '✓ Matches' : 'Mismatch'}
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
                            placeholder="Repeat password"
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
                    </div>

                    {/* Terms Agreement Checkbox */}
                    <div className="pt-2">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          required
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                        />
                        <span className="text-xs text-slate-600 leading-relaxed font-medium">
                          I agree to the{' '}
                          <Link href="/terms" target="_blank" className="text-blue-600 font-bold hover:underline">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" target="_blank" className="text-blue-600 font-bold hover:underline">
                            Privacy Policy
                          </Link>.
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={!isFormValid || loading}
                      className="btn-primary w-full py-3.5 text-sm font-bold mt-2 shadow-lg shadow-blue-500/25"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Creating Real Workspace...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Real Business Workspace</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                /* Post-Submission Screen */
                <div className="text-center py-4 space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                    <Mail className="w-8 h-8" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">
                      Check your email
                    </h2>
                    <p className="text-slate-600 text-xs mt-2 max-w-md mx-auto leading-relaxed font-medium">
                      We sent a verification link to <strong className="text-slate-950 font-bold">{maskedEmail}</strong>. Click the link in the email to activate your workspace.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="btn-secondary py-2.5 px-4 text-xs font-bold"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                      <span>Resend verification email</span>
                    </button>
                    {resendStatus && (
                      <p className="text-xs text-emerald-700 font-bold mt-2">{resendStatus}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Encrypted • 100% Real Production Database</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/60 px-6 py-4 text-center text-xs font-semibold text-slate-500">
        © {new Date().getFullYear()} LeadFlow AI Inc. All rights reserved.
      </footer>
    </div>
  );
}
