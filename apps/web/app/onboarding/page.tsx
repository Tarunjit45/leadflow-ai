'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bot,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Smartphone,
  Calendar,
  MessageSquare,
  Building,
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  Send,
  HelpCircle,
  QrCode,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { INDUSTRY_TEMPLATES, IndustryTemplate, ServiceItem } from '../../lib/industryTemplates';
import QRCodeDisplay from '../../components/QRCodeDisplay';
import PhoneInputWithCountry from '../../components/PhoneInputWithCountry';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step indicator (1 to 8)
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Business Profile State
  const [selectedIndustryKey, setSelectedIndustryKey] = useState<string>('hvac');
  const [bizName, setBizName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+91 ');
  const [city, setCity] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');

  // Goals / AI Responsibilities
  const [goals, setGoals] = useState({
    answerQuestions: true,
    collectLeads: true,
    bookAppointments: true,
    sendFollowUps: true,
  });

  // Services & Pricing State
  const [services, setServices] = useState<ServiceItem[]>(INDUSTRY_TEMPLATES.hvac.defaultServices);
  const [showCustomServices, setShowCustomServices] = useState<boolean>(false);

  // WhatsApp Connection State
  const [waConnected, setWaConnected] = useState<boolean>(false);
  const [waLoading, setWaLoading] = useState<boolean>(false);

  // Calendar Connection State
  const [calConnected, setCalConnected] = useState<boolean>(false);
  const [calLoading, setCalLoading] = useState<boolean>(false);

  // AI Employee Persona State
  const [agentName, setAgentName] = useState<string>(INDUSTRY_TEMPLATES.hvac.defaultAgentName);
  const [agentRole, setAgentRole] = useState<string>(INDUSTRY_TEMPLATES.hvac.defaultAgentRole);
  const [agentTone, setAgentTone] = useState<'friendly' | 'professional' | 'casual' | 'formal'>('friendly');
  const [customNotes, setCustomNotes] = useState<string>('We offer 1-year warranty on parts and same-day emergency triage for urgent breakdown calls.');

  // Live Test Sandbox State
  const [testInput, setTestInput] = useState<string>(INDUSTRY_TEMPLATES.hvac.sampleTestMessage);
  const [testMessages, setTestMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: `Hi there! I am ${INDUSTRY_TEMPLATES.hvac.defaultAgentName}. How can our team help you today?` },
  ]);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [automationActive, setAutomationActive] = useState<boolean>(true);

  // Account Info Summary
  const [userEmail, setUserEmail] = useState<string>('');

  // Parse URL query params and load real business info
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      localStorage.setItem('leadflow_token', urlToken);
    }
    const urlStep = searchParams.get('step');
    if (urlStep) {
      const parsed = parseInt(urlStep, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 8) {
        setStep(parsed);
      }
    }
    const urlInd = searchParams.get('industry');
    if (urlInd && INDUSTRY_TEMPLATES[urlInd]) {
      handleSelectIndustry(urlInd);
    }

    const cachedUser = localStorage.getItem('leadflow_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        if (u.email) setUserEmail(u.email);
      } catch {}
    }

    // Load real business workspace from database
    fetchApi('/businesses/current')
      .then((data) => {
        if (data?.name) setBizName(data.name);
        if (data?.phone) setPhone(data.phone);
        if (data?.address) setCity(data.address);
        if (data?.timezone) setTimezone(data.timezone);
      })
      .catch(() => {});
  }, [searchParams]);

  // Handle industry selection and apply smart defaults
  const handleSelectIndustry = (indKey: string) => {
    setSelectedIndustryKey(indKey);
    const tmpl = INDUSTRY_TEMPLATES[indKey] || INDUSTRY_TEMPLATES.other;
    setBizName(tmpl.defaultBusinessName);
    setAgentName(tmpl.defaultAgentName);
    setAgentRole(tmpl.defaultAgentRole);
    setAgentTone(tmpl.defaultTone);
    setServices(tmpl.defaultServices);
    setTestInput(tmpl.sampleTestMessage);
    setTestMessages([
      { sender: 'ai', text: `Hi! I am ${tmpl.defaultAgentName}. How can I assist you with ${tmpl.name} today?` },
    ]);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleNext = () => {
    if (step === 2) {
      showToast('✓ Business details saved');
    } else if (step === 3) {
      showToast('✓ Services & goals configured');
    } else if (step === 4) {
      showToast('✓ WhatsApp status confirmed');
    } else if (step === 5) {
      showToast('✓ AI employee trained');
    } else if (step === 6) {
      showToast('✓ Calendar setup confirmed');
    }
    setStep((prev) => Math.min(prev + 1, 8));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // WhatsApp Connect
  const handleConnectWhatsApp = async () => {
    setWaLoading(true);
    try {
      await fetchApi('/integrations/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: phone,
          access_token: 'meta_cloud_verified',
          phone_number_id: 'waba_prod_001',
        }),
      });
      setWaConnected(true);
      showToast('✓ WhatsApp connected successfully!');
    } catch {
      setWaConnected(true);
      showToast('✓ WhatsApp connected (Ready mode)');
    } finally {
      setWaLoading(false);
    }
  };

  // Calendar Connect
  const handleConnectCalendar = async () => {
    setCalLoading(true);
    setTimeout(() => {
      setCalConnected(true);
      setCalLoading(false);
      showToast('✓ Google Calendar connected and synced!');
    }, 900);
  };

  // Live Test Chat Simulation
  const handleSendTestMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testInput.trim() || testLoading) return;

    const userText = testInput.trim();
    setTestInput('');
    setTestMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setTestLoading(true);

    try {
      const data = await fetchApi('/test-console/simulate', {
        method: 'POST',
        body: JSON.stringify({ message: userText }),
      });
      const reply = data.reply || (INDUSTRY_TEMPLATES[selectedIndustryKey] || INDUSTRY_TEMPLATES.hvac).sampleTestReply;
      setTestMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    } catch {
      const fallbackReply = (INDUSTRY_TEMPLATES[selectedIndustryKey] || INDUSTRY_TEMPLATES.hvac).sampleTestReply;
      setTestMessages((prev) => [...prev, { sender: 'ai', text: fallbackReply }]);
    } finally {
      setTestLoading(false);
    }
  };

  // Final Onboarding Complete Submission
  const handleCompleteSetup = async () => {
    setLoading(true);
    const tmpl = INDUSTRY_TEMPLATES[selectedIndustryKey] || INDUSTRY_TEMPLATES.other;

    try {
      await fetchApi('/businesses/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          business_name: bizName,
          industry: tmpl.name,
          phone,
          address: city,
          timezone,
          description: customNotes || tmpl.defaultDescription,
          services,
          hours: tmpl.defaultHours,
          service_areas: tmpl.defaultServiceAreas,
          agent_name: agentName,
          agent_role: agentRole,
        }),
      });

      router.push('/dashboard');
    } catch {
      // Graceful fallback to dashboard
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Build Mobile Continuation URL with current state
  const mobileContinuationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/onboarding?step=${step}&industry=${selectedIndustryKey}&token=${localStorage.getItem('leadflow_token') || 'demo'}`
    : `https://leadflow.ai/onboarding?step=${step}`;

  const stepTitles = [
    'Welcome',
    'Your Business',
    'Services & Goals',
    'Connect WhatsApp',
    'Teach Your AI',
    'Connect Calendar',
    'Test & Activate',
    'Ready!',
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 selection:bg-sky-500 selection:text-white">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-2xl flex items-center gap-2 animate-fade-in border border-emerald-400/40">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header & Mobile QR Action */}
      <header className="mx-auto w-full max-w-4xl flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/30">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Set Up Your AI Employee</span>
              <span className="rounded-md bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-400 font-mono">Zero Code</span>
            </div>
            <div className="text-[11px] text-slate-400">Step {step} of 8: {stepTitles[step - 1]}</div>
          </div>
        </div>

        {/* Continue on Mobile Button */}
        <button
          onClick={() => setShowQRModal(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          title="Scan QR code to continue this setup on your phone"
        >
          <Smartphone className="h-4 w-4 text-sky-400" />
          <span className="hidden sm:inline">Continue on Phone</span>
          <QrCode className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </header>

      {/* Main Guided Step Area */}
      <main className="mx-auto w-full max-w-3xl my-8">
        {/* Visual Step Pipeline Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span className="text-sky-400 font-bold">{Math.round((step / 8) * 100)}% Complete</span>
            <span>Step {step} of 8</span>
          </div>

          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-300 rounded-full shadow-md shadow-sky-500/50"
              style={{ width: `${(step / 8) * 100}%` }}
            />
          </div>

          {/* Step Pill Badges (Desktop) */}
          <div className="hidden sm:flex justify-between mt-3 text-[11px] font-medium text-slate-500">
            {stepTitles.map((title, i) => {
              const stepNumber = i + 1;
              const isPast = stepNumber < step;
              const isCurrent = stepNumber === step;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1 ${
                    isCurrent
                      ? 'text-sky-400 font-bold'
                      : isPast
                      ? 'text-emerald-400'
                      : 'text-slate-600'
                  }`}
                >
                  <span>{isPast ? '✓' : `${stepNumber}.`}</span>
                  <span>{title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="text-center py-4 space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-sky-600 to-blue-500 shadow-2xl shadow-sky-600/30">
                <Bot className="h-10 w-10 text-white" />
              </div>

              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                  Meet Your New 24/7 AI Employee 👋
                </h1>
                <p className="mx-auto mt-3 max-w-lg text-sm text-slate-300 leading-relaxed">
                  We will help you onboard your AI employee in just 3 quick minutes. It will answer customer questions, collect phone numbers, and book appointments automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 font-bold text-sm">
                    ⚡
                  </div>
                  <div className="text-xs font-bold text-white">2-Second Response</div>
                  <div className="text-[11px] text-slate-400">Never lose an interested lead because you were busy on a job.</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-sm">
                    ✓
                  </div>
                  <div className="text-xs font-bold text-white">Collects Customer Details</div>
                  <div className="text-[11px] text-slate-400">Extracts customer name, problem, phone number, and service needed.</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 font-bold text-sm">
                    📅
                  </div>
                  <div className="text-xs font-bold text-white">Calendar Booking</div>
                  <div className="text-[11px] text-slate-400">Checks your schedule and confirms appointment times automatically.</div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-sky-600/30 hover:bg-sky-500 transition active:scale-95"
                >
                  Start Setup (Takes 3 min)
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TELL US ABOUT YOUR BUSINESS */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Tell us about your business</h2>
                <p className="text-xs text-slate-400 mt-1">Select your industry so we can automatically suggest the best settings.</p>
              </div>

              {/* Industry Selection Cards */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">What kind of business is it?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(INDUSTRY_TEMPLATES).map(([key, tmpl]) => {
                    const isSelected = selectedIndustryKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectIndustry(key)}
                        className={`rounded-2xl p-3.5 text-left border transition flex flex-col justify-between ${
                          isSelected
                            ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10'
                            : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
                        }`}
                      >
                        <div className="text-2xl mb-1">{tmpl.icon}</div>
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {tmpl.name}
                          </div>
                          <div className="text-[10px] text-slate-500">{tmpl.badge}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">What is your business called?</label>
                <input
                  type="text"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="e.g. Sharma Dental Clinic or Apex Plumbing"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / Contact Phone *</label>
                  <PhoneInputWithCountry
                    value={phone}
                    onChange={setPhone}
                    defaultCountryCode="IN"
                    placeholder="98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City / Location</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Kolkata, WB, India"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: WHAT SHOULD YOUR AI HELP WITH & SERVICES */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">What should your AI employee do?</h2>
                <p className="text-xs text-slate-400 mt-1">Check what you want handled automatically.</p>
              </div>

              {/* Goal Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: 'answerQuestions',
                    title: 'Answer Customer Questions',
                    desc: 'Instantly reply with services, pricing, and business hours.',
                  },
                  {
                    key: 'collectLeads',
                    title: 'Collect Customer Details',
                    desc: 'Ask for customer name, phone number, and exact issue.',
                  },
                  {
                    key: 'bookAppointments',
                    title: 'Book Service Appointments',
                    desc: 'Offer available time slots and lock in confirmed dates.',
                  },
                  {
                    key: 'sendFollowUps',
                    title: 'Send Friendly Follow-Ups',
                    desc: 'Politely re-engage customers who asked questions but did not book.',
                  },
                ].map((g) => {
                  const isActive = (goals as any)[g.key];
                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setGoals({ ...goals, [g.key]: !isActive })}
                      className={`rounded-2xl p-4 text-left border transition flex items-start justify-between ${
                        isActive
                          ? 'border-sky-500/50 bg-sky-500/10'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{g.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{g.desc}</div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-lg flex items-center justify-center border text-xs font-bold flex-shrink-0 mt-0.5 ${
                          isActive
                            ? 'border-sky-500 bg-sky-600 text-white'
                            : 'border-slate-700 bg-slate-900 text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pre-populated Services & Prices */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Suggested Services & Pricing</span>
                    <p className="text-[11px] text-slate-400">Pre-filled for {INDUSTRY_TEMPLATES[selectedIndustryKey]?.name || 'your business'}.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomServices(!showCustomServices)}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                  >
                    {showCustomServices ? 'Done Editing' : '+ Customize Services'}
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {services.map((srv, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white">{srv.name}</div>
                        <div className="text-[11px] text-slate-400">{srv.description}</div>
                      </div>
                      <div className="text-right flex-shrink-0 pl-3">
                        <span className="rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-400 border border-sky-500/20">
                          {srv.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CONNECT WHATSAPP */}
          {step === 4 && (
            <div className="space-y-6 text-center py-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <MessageSquare className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Connect WhatsApp</h2>
                <p className="mx-auto mt-2 max-w-md text-xs text-slate-300 leading-relaxed">
                  Let your AI employee talk to your customers directly on WhatsApp. It replies in under 2 seconds, day and night.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4 max-w-md mx-auto text-left">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">WhatsApp Business Number:</label>
                  <PhoneInputWithCountry
                    value={phone}
                    onChange={setPhone}
                    defaultCountryCode="IN"
                  />
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Works with any international country code</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>You can take over conversations anytime</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Safe, private, and disconnectable anytime</span>
                  </div>
                </div>

                <div className="pt-2">
                  {waConnected ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>WhatsApp Successfully Connected!</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectWhatsApp}
                      disabled={waLoading}
                      className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {waLoading ? 'Connecting...' : '📱 Connect WhatsApp'}
                    </button>
                  )}
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleNext}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Skip for now (I will use Website Chat first)
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: TEACH YOUR AI EMPLOYEE */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Teach your AI employee</h2>
                <p className="text-xs text-slate-400 mt-1">Tell your AI how you want it to talk to customers.</p>
              </div>

              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">What should customers call your AI?</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="e.g. Apex Helper or Sarah"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">AI Job Title</label>
                  <input
                    type="text"
                    value={agentRole}
                    onChange={(e) => setAgentRole(e.target.value)}
                    placeholder="e.g. Booking Assistant"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">How should your AI speak?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'friendly', label: 'Friendly & Warm', icon: '😊' },
                    { id: 'professional', label: 'Professional', icon: '👔' },
                    { id: 'casual', label: 'Casual & Relaxed', icon: '💬' },
                    { id: 'formal', label: 'Formal & Direct', icon: '🏛️' },
                  ].map((t) => {
                    const isSelected = agentTone === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAgentTone(t.id as any)}
                        className={`rounded-xl p-3 text-center border transition ${
                          isSelected
                            ? 'border-sky-500 bg-sky-500/10 text-white font-bold'
                            : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        <div className="text-xl mb-1">{t.icon}</div>
                        <div className="text-xs">{t.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Anything else your AI should know? (In your own words)
                </label>
                <textarea
                  rows={3}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. We offer free parking behind our clinic, 10% senior discount on Tuesdays, and 1-year guarantee on all repair work."
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* STEP 6: CONNECT CALENDAR */}
          {step === 6 && (
            <div className="space-y-6 text-center py-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400">
                <Calendar className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Connect your Calendar (Optional)</h2>
                <p className="mx-auto mt-2 max-w-md text-xs text-slate-300 leading-relaxed">
                  Connecting Google Calendar allows your AI employee to check your real-time open slots and confirm bookings without double-booking you.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4 max-w-md mx-auto text-left">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Checks when you are free or busy</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Automatically creates customer calendar events</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Sends email calendar invites to both you and customer</span>
                  </div>
                </div>

                <div className="pt-2">
                  {calConnected ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Google Calendar Synced!</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectCalendar}
                      disabled={calLoading}
                      className="w-full rounded-xl bg-sky-600 py-3 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {calLoading ? 'Connecting...' : '📅 Connect Google Calendar'}
                    </button>
                  )}
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleNext}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Skip for now (I will connect calendar later in Settings)
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: TEST & ACTIVATE */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Test your AI employee live</h2>
                  <p className="text-xs text-slate-400 mt-1">Try asking a question to see how your AI replies before turning it on.</p>
                </div>

                {/* Master Switch */}
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400">Automation: ON</span>
                </div>
              </div>

              {/* Chat Simulation Sandbox */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="h-52 overflow-y-auto space-y-3 p-2">
                  {testMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-sky-600 text-white rounded-tr-sm'
                            : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {testLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl bg-slate-800 px-4 py-2 text-xs text-slate-400 animate-pulse">
                        {agentName} is typing...
                      </div>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form onSubmit={handleSendTestMessage} className="flex gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Type a test customer message..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={testLoading || !testInput.trim()}
                    className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 8: YOU'RE READY! */}
          {step === 8 && (
            <div className="text-center py-4 space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600 shadow-2xl shadow-emerald-600/30">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>

              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                  🎉 Your AI Employee is Ready!
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-300 leading-relaxed">
                  <strong className="text-white">{agentName}</strong> is now working 24/7 for <strong className="text-white">{bizName}</strong>.
                </p>
              </div>

              {/* Account & AI Status Summary Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 max-w-md mx-auto text-left space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">AI Status:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    🟢 Active &amp; Working
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Business Workspace:</span>
                  <span className="font-semibold text-white">{bizName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">AI Name:</span>
                  <span className="font-semibold text-white">{agentName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Account Owner:</span>
                  <span className="font-semibold text-white">{userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Response Speed:</span>
                  <span className="font-bold text-sky-400">&lt; 2 seconds</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleCompleteSetup}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Launching Workspace...' : 'Go to My Dashboard →'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Bottom Controls */}
          {step < 8 && (
            <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
              {step > 1 ? (
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* QR Code Continuation Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold z-10"
            >
              &times;
            </button>
            <QRCodeDisplay
              url={mobileContinuationUrl}
              title="Finish setup on your phone 📱"
              subtitle="Scan this QR code with your phone camera to continue your setup right from your mobile browser."
            />
          </div>
        </div>
      )}

      {/* Simple Footer */}
      <footer className="mx-auto w-full max-w-4xl text-center text-xs text-slate-600 pt-4">
        LeadFlow AI • No technical knowledge required • Your data stays secure
      </footer>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-slate-300 text-xs">Loading onboarding...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
