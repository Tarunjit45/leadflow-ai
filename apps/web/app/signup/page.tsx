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
    let strengthColor = 'bg-rose-500 text-rose-300';
    let barWidth = 'w-1/3';

    if (score === 2) {
      strengthLabel = 'Fair';
      strengthColor = 'bg-amber-500 text-amber-300';
      barWidth = 'w-2/3';
    } else if (score === 3) {
      strengthLabel = 'Strong';
      strengthColor = 'bg-emerald-500 text-emerald-300';
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
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">LeadFlow<span className="text-blue-500">.ai</span></span>
          </Link>
          <div className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 animate-fade-in">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Value Prop */}
          <div className="lg:col-span-5 space-y-6 hidden lg:block">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real 24/7 AI Sales Employee</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Turn every WhatsApp &amp; web inquiry into a booked client.
            </h1>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span><strong>Instant &lt; 2s Replies:</strong> Your AI answers inquiries, quotes prices, and books appointments 24/7.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span><strong>Worldwide WhatsApp Support:</strong> Connect your real WhatsApp Business number with any country code.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span><strong>Zero Technical Skills:</strong> Real-time setup in under 3 minutes.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Signup Form or Verification Prompt */}
          <div className="lg:col-span-7">
            <div className="bg-[#0e131f] border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-premium">
              
              {!isSubmitted ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Create your business workspace
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                      Enter your real business details to train your AI sales assistant.
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
                    {/* Full Name & Business Name Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                          Your Full Name *
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
                            placeholder="e.g. Tarunjit Biswas"
                            className="input-field pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                          Business Name *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
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
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                          Service City / Region
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Work Email Address *
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
                          placeholder="name@yourbusiness.com"
                          className={`input-field pl-10 ${
                            email.length > 0
                              ? isEmailValid 
                                ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                                : 'border-amber-500/50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                              : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password & Confirm Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Password *
                          </label>
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
                            placeholder="8+ characters"
                            className="input-field pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Confirm Password *
                          </label>
                          {confirmPassword.length > 0 && (
                            <span className={`text-[11px] font-medium ${passwordStats.passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {passwordStats.passwordsMatch ? '✓ Matches' : 'Mismatch'}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
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
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/30 mt-0.5"
                        />
                        <span className="text-xs text-slate-400 leading-relaxed">
                          I agree to the{' '}
                          <Link href="/terms" target="_blank" className="text-blue-400 hover:underline">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" target="_blank" className="text-blue-400 hover:underline">
                            Privacy Policy
                          </Link>.
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={!isFormValid || loading}
                      className="btn-primary w-full py-3.5 text-sm font-bold mt-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                    <Mail className="w-8 h-8" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Check your email
                    </h2>
                    <p className="text-slate-300 text-xs mt-2 max-w-md mx-auto leading-relaxed">
                      We sent a verification link to <strong className="text-white">{maskedEmail}</strong>. Click the link in the email to activate your workspace.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="btn-secondary py-2.5 px-4 text-xs font-semibold"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                      <span>Resend verification email</span>
                    </button>
                    {resendStatus && (
                      <p className="text-xs text-emerald-400 font-medium mt-2">{resendStatus}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Encrypted • 100% Real Production Database</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} LeadFlow AI Inc. All rights reserved.
      </footer>
    </div>
  );
}
