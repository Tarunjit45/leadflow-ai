'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronDown,
  Sparkles,
  PhoneCall,
  Smartphone,
  Check,
  Users,
  Play,
} from 'lucide-react';
import { INDUSTRY_TEMPLATES } from '../lib/industryTemplates';

export default function LandingPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('dental');
  const [avgJobValue, setAvgJobValue] = useState<number>(850);
  const [monthlyMissedLeads, setMonthlyMissedLeads] = useState<number>(20);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const activeTmpl = INDUSTRY_TEMPLATES[selectedIndustry] || INDUSTRY_TEMPLATES.dental;

  // ROI Math
  const estimatedRecoveredLeads = Math.round(monthlyMissedLeads * 0.45);
  const monthlyRevenueRecovered = estimatedRecoveredLeads * avgJobValue;
  const annualRevenueRecovered = monthlyRevenueRecovered * 12;

  const faqs = [
    {
      q: 'Do I need any technical skills or coding knowledge to use this?',
      a: 'Zero technical knowledge is required. You never have to touch an API, webhook, code snippet, or technical settings. We guide you through a 3-minute setup where you simply tell the AI your business name, services, and prices.',
    },
    {
      q: 'How quickly does the AI employee reply to customers?',
      a: 'In under 2 seconds! Whether a customer messages your WhatsApp or visits your website at 2:00 AM on a Sunday, your AI employee answers instantly, gives accurate prices, and books appointments.',
    },
    {
      q: 'Will the AI make up wrong prices or make promises I cannot keep?',
      a: 'No. Your AI employee only quotes the exact services and starting prices you teach it. It checks your Google Calendar before confirming any open slot, preventing double-bookings.',
    },
    {
      q: 'What happens if a customer asks something complex or wants a human?',
      a: 'You can take over any conversation with 1 click from your Customers inbox. The AI pauses automatically for that customer so you can chat with them directly.',
    },
    {
      q: 'Can I test my AI employee before putting it in front of real customers?',
      a: 'Yes! During setup and anytime in your dashboard, you have an interactive test chat where you can practice sending questions and see exactly how your AI replies.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 shadow-md shadow-sky-500/20">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white">LeadFlow</span>
              <span className="ml-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-bold text-sky-400 border border-sky-500/20">AI</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#industries" className="hover:text-white transition">See Your Business</a>
            <a href="#roi" className="hover:text-white transition">Revenue Calculator</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/login?demo=true"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>1-Click Demo</span>
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition active:scale-95"
            >
              <span>Start Setup</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/25 via-slate-950/0 to-slate-950 pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold text-sky-300 shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>Zero Technical Knowledge Required</span>
          </div>

          <h1 className="mt-8 text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Your AI employee handles customer conversations, leads &amp; appointments{' '}
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              automatically.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
            Never miss a paying customer because you were busy on a job or asleep. Your AI employee replies in 2 seconds on WhatsApp and Web, gathers details, and books appointments 24/7.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-sky-600/30 hover:bg-sky-500 transition active:scale-95"
            >
              <span>Start Setup (Takes 3 min)</span>
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/login?demo=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-8 py-4 text-base font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition shadow-sm"
            >
              <Bot className="h-5 w-5 text-sky-400" />
              <span>Try Live Interactive Demo</span>
            </Link>
          </div>

          {/* Social Proof Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Replies in &lt; 2 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Official WhatsApp Business</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Google Calendar Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>1-Click Human Takeover</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Business Simulator Section */}
      <section id="industries" className="border-t border-slate-800 bg-slate-900/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Interactive Preview</span>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              See how your AI employee talks to your customers
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Select your business type below to preview real conversations and automatic appointment bookings.
            </p>
          </div>

          {/* Industry Tabs */}
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {Object.entries(INDUSTRY_TEMPLATES).map(([key, tmpl]) => {
              const isSelected = selectedIndustry === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedIndustry(key)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                      : 'border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <span>{tmpl.icon}</span>
                  <span>{tmpl.name}</span>
                </button>
              );
            })}
          </div>

          {/* Live Conversation Simulation Display */}
          <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-10 shadow-2xl max-w-4xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              {/* Phone Mockup Screen */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white font-bold text-xs">
                      {activeTmpl.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{activeTmpl.defaultAgentName}</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">● Online 24/7 (Replies in 2s)</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">WhatsApp</span>
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-sky-600 p-3 text-white rounded-tr-sm">
                      {activeTmpl.sampleTestMessage}
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl bg-slate-800 p-3 text-slate-200 rounded-tl-sm border border-slate-700">
                      {activeTmpl.sampleTestReply}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-sky-600 p-3 text-white rounded-tr-sm">
                      Tomorrow at 10 AM works great. My name is Alex, phone is 512-555-0149.
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl bg-slate-800 p-3 text-emerald-300 rounded-tl-sm border border-slate-700 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Appointment Confirmed!</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Locked in for tomorrow at 10:00 AM. We have synced this with the calendar and sent a confirmation text.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Value Breakdown */}
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Pre-configured for {activeTmpl.name}</span>
                  <h3 className="text-2xl font-bold text-white mt-1">{activeTmpl.defaultBusinessName}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{activeTmpl.defaultDescription}</p>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-white">Configured Services &amp; Starting Rates:</span>
                  {activeTmpl.defaultServices.map((srv, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{srv.name}</div>
                        <div className="text-[11px] text-slate-400">{srv.description}</div>
                      </div>
                      <span className="font-bold text-sky-400 text-xs pl-2 whitespace-nowrap">{srv.price}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/signup?industry=${activeTmpl.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition active:scale-95"
                >
                  <span>Set Up for {activeTmpl.name}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-slate-800 bg-slate-950 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Simple Process</span>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              How You Onboard Your AI Employee in 3 Minutes
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 space-y-4 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white font-bold text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Tell us about your business</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your business name, services, starting prices, and opening hours. We automatically provide smart templates tailored to your trade.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 space-y-4 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Connect WhatsApp &amp; Calendar</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect your business WhatsApp number and Google Calendar with 1 click. Zero technical configuration or code required.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 space-y-4 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white font-bold text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Turn Automation ON</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Flip the master switch to ON. Your AI employee immediately starts qualifying incoming leads and booking confirmed appointments 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="roi" className="border-t border-slate-800 bg-slate-900/60 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Measurable Value</span>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              Calculate Your Recovered Revenue Potential
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Contractors and clinics lose over 40% of leads to delayed replies. See what 2-second response speed is worth to your bottom line.
            </p>
          </div>

          <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-950 p-8 sm:p-10 shadow-2xl">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Average Value per Customer ($)</span>
                    <span className="text-sky-400 text-sm">${avgJobValue}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="50"
                    value={avgJobValue}
                    onChange={(e) => setAvgJobValue(Number(e.target.value))}
                    className="mt-3 w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>$100 (Visit)</span>
                    <span>$850 (Average)</span>
                    <span>$5,000+ (Major Job)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Monthly Inquiries / Missed Calls</span>
                    <span className="text-sky-400 text-sm">{monthlyMissedLeads} leads/month</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="5"
                    value={monthlyMissedLeads}
                    onChange={(e) => setMonthlyMissedLeads(Number(e.target.value))}
                    className="mt-3 w-full accent-sky-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Result Box */}
              <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-8 text-center space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Estimated Recovered Revenue</span>
                <div className="text-4xl sm:text-5xl font-black text-white">
                  ${monthlyRevenueRecovered.toLocaleString()}
                  <span className="text-sm font-normal text-slate-400"> / month</span>
                </div>
                <div className="text-xs font-bold text-emerald-400">
                  ≈ ${annualRevenueRecovered.toLocaleString()} annual added revenue
                </div>
                <div className="pt-2">
                  <Link
                    href="/signup"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition"
                  >
                    Start Free 7-Day Trial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-slate-800 bg-slate-950 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Transparent Plans</span>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              Simple, Predictable Pricing
            </h2>
            <p className="mt-2 text-sm text-slate-400">Cancel or change plans anytime with one click.</p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Free Trial */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">7-Day Free Trial</span>
                <div className="mt-2 text-3xl font-black text-white">$0</div>
                <p className="text-xs text-slate-400 mt-2">Test your AI employee risk-free with your real business services.</p>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> 500 AI Messages</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Website Chat Widget</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Live Sandbox Testing</li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 text-center text-xs font-bold text-white hover:bg-slate-700 transition"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Starter */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Solo Operators</span>
                <div className="mt-2 text-3xl font-black text-white">$99<span className="text-xs text-slate-400 font-normal"> / month</span></div>
                <p className="text-xs text-slate-400 mt-2">Perfect for growing clinics and trade businesses.</p>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> 1,000 AI Messages / mo</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> WhatsApp + Website Chat</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> 100 Calendar Appointments</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Automated Follow-ups</li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 text-center text-xs font-bold text-white hover:bg-slate-700 transition"
              >
                Get Started
              </Link>
            </div>

            {/* Growth */}
            <div className="rounded-3xl border-2 border-sky-500 bg-slate-900 p-8 flex flex-col justify-between space-y-6 shadow-2xl shadow-sky-500/10 relative">
              <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-0.5 text-[10px] font-bold text-white uppercase">
                Most Popular
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">High Volume Teams</span>
                <div className="mt-2 text-3xl font-black text-white">$199<span className="text-xs text-slate-400 font-normal"> / month</span></div>
                <p className="text-xs text-slate-400 mt-2">Full autonomy, unlimited knowledge base, and priority speed.</p>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> 2,500 AI Messages / mo</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> 250 Confirmed Calendar Bookings</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Priority 2s AI Response SLA</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Dedicated Phone Support</li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full rounded-xl bg-sky-600 py-3 text-center text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition"
              >
                Start Growth Plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="border-t border-slate-800 bg-slate-900/40 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Common Questions</span>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-6 text-left font-bold text-white hover:text-sky-400 transition"
                >
                  <span className="text-sm">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-sky-400' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-500 text-xs">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-600 text-white font-bold">
              <Bot className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-300 text-sm">LeadFlow AI</span>
            <span className="ml-2 text-slate-600">© 2026 LeadFlow AI Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/login" className="hover:text-slate-200">Sign In</Link>
            <Link href="/login?demo=true" className="hover:text-slate-200">Instant Demo</Link>
            <Link href="/signup" className="hover:text-slate-200">Start Setup</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
