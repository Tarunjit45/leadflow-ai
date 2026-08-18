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
    <div className="min-h-screen bg-[#ffffff] text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20 text-white transition-transform duration-200 group-hover:scale-105">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-950">LeadFlow</span>
              <span className="ml-1 rounded-md bg-blue-100 px-2 py-0.5 text-xs font-black text-blue-700 border border-blue-200">AI</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-950 transition">How It Works</a>
            <a href="#industries" className="hover:text-slate-950 transition">See Your Business</a>
            <a href="#roi" className="hover:text-slate-950 transition">Revenue Calculator</a>
            <a href="#pricing" className="hover:text-slate-950 transition">Pricing</a>
            <a href="#faq" className="hover:text-slate-950 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-slate-950 transition"
            >
              Sign In
            </Link>
            <Link
              href="/login?demo=true"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-200 transition shadow-xs"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>1-Click Demo</span>
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition active:scale-95"
            >
              <span>Start Setup</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Zero Technical Knowledge Required</span>
          </div>

          <h1 className="mt-8 text-4xl sm:text-6xl font-black tracking-tight text-slate-950 leading-tight">
            Your AI employee handles customer conversations, leads &amp; appointments{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              automatically.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
            Never miss a paying customer because you were busy on a job or asleep. Your AI employee replies in 2 seconds on WhatsApp and Web, gathers details, and books appointments 24/7.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition active:scale-95"
            >
              <span>Start Setup (Takes 3 min)</span>
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/login?demo=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-8 py-4 text-base font-bold text-slate-800 hover:bg-slate-200 transition shadow-xs"
            >
              <Bot className="h-5 w-5 text-blue-600" />
              <span>Try Live Interactive Demo</span>
            </Link>
          </div>

          {/* Social Proof Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Replies in &lt; 2 seconds</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Official WhatsApp Business</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Google Calendar Sync</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>1-Click Human Takeover</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Business Simulator Section */}
      <section id="industries" className="border-t border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Interactive Preview</span>
            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              See how your AI employee talks to your customers
            </h2>
            <p className="mt-2 text-sm text-slate-600 font-medium">
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
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-xs'
                  }`}
                >
                  <span>{tmpl.icon}</span>
                  <span>{tmpl.name}</span>
                </button>
              );
            })}
          </div>

          {/* Live Conversation Simulation Display */}
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl max-w-4xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              {/* Phone Mockup Screen */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm">
                      {activeTmpl.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-950">{activeTmpl.defaultAgentName}</div>
                      <div className="text-[10px] text-emerald-600 font-bold">● Online 24/7 (Replies in 2s)</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">WhatsApp</span>
                </div>

                <div className="space-y-3 text-xs leading-relaxed font-medium">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-blue-600 p-3 text-white rounded-tr-sm shadow-xs">
                      {activeTmpl.sampleTestMessage}
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl bg-white p-3 text-slate-900 rounded-tl-sm border border-slate-200 shadow-xs">
                      {activeTmpl.sampleTestReply}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-blue-600 p-3 text-white rounded-tr-sm shadow-xs">
                      Tomorrow at 10 AM works great. My name is Alex, phone is 512-555-0149.
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl bg-emerald-50 p-3 text-emerald-900 rounded-tl-sm border border-emerald-300 space-y-1 shadow-xs">
                      <div className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Appointment Confirmed!</span>
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        Locked in for tomorrow at 10:00 AM. We have synced this with the calendar and sent a confirmation text.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Value Breakdown */}
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-blue-600">Pre-configured for {activeTmpl.name}</span>
                  <h3 className="text-2xl font-black text-slate-950 mt-1">{activeTmpl.defaultBusinessName}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">{activeTmpl.defaultDescription}</p>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-950">Configured Services &amp; Starting Rates:</span>
                  {activeTmpl.defaultServices.map((srv, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-950">{srv.name}</div>
                        <div className="text-[11px] text-slate-500">{srv.description}</div>
                      </div>
                      <span className="font-black text-emerald-700 text-xs pl-2 whitespace-nowrap">{srv.price}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/signup?industry=${activeTmpl.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition active:scale-95"
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
      <section id="how-it-works" className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Simple Process</span>
            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              How You Onboard Your AI Employee in 3 Minutes
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-8 space-y-4 relative shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-md shadow-blue-500/20">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-950">Tell us about your business</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Enter your business name, services, starting prices, and opening hours. We automatically provide smart templates tailored to your trade.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-8 space-y-4 relative shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-md shadow-emerald-500/20">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-950">Connect WhatsApp &amp; Calendar</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Connect your business WhatsApp number and Google Calendar with 1 click. Zero technical configuration or code required.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-8 space-y-4 relative shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white font-bold text-lg shadow-md shadow-purple-500/20">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-950">Turn Automation ON</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Flip the master switch to ON. Your AI employee immediately starts qualifying incoming leads and booking confirmed appointments 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="roi" className="border-t border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Measurable Value</span>
            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              Calculate Your Recovered Revenue Potential
            </h2>
            <p className="mt-2 text-sm text-slate-600 font-medium">
              Contractors and clinics lose over 40% of leads to delayed replies. See what 2-second response speed is worth to your bottom line.
            </p>
          </div>

          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xl">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">Average Value per Customer ($)</span>
                    <span className="text-blue-600 text-sm font-black">${avgJobValue}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="50"
                    value={avgJobValue}
                    onChange={(e) => setAvgJobValue(Number(e.target.value))}
                    className="mt-3 w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-semibold">
                    <span>$100 (Visit)</span>
                    <span>$850 (Average)</span>
                    <span>$5,000+ (Major Job)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">Monthly Inquiries / Missed Calls</span>
                    <span className="text-blue-600 text-sm font-black">{monthlyMissedLeads} leads/month</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="5"
                    value={monthlyMissedLeads}
                    onChange={(e) => setMonthlyMissedLeads(Number(e.target.value))}
                    className="mt-3 w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Result Box */}
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50 p-8 text-center space-y-3 shadow-sm">
                <span className="text-xs font-black uppercase tracking-widest text-blue-700">Estimated Recovered Revenue</span>
                <div className="text-4xl sm:text-5xl font-black text-slate-950">
                  ${monthlyRevenueRecovered.toLocaleString()}
                  <span className="text-sm font-normal text-slate-600"> / month</span>
                </div>
                <div className="text-xs font-bold text-emerald-700">
                  ≈ ${annualRevenueRecovered.toLocaleString()} annual added revenue
                </div>
                <div className="pt-2">
                  <Link
                    href="/signup"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition"
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
      <section id="pricing" className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Transparent Plans</span>
            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              Simple, Predictable Pricing
            </h2>
            <p className="mt-2 text-sm text-slate-600 font-medium">Cancel or change plans anytime with one click.</p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Free Trial */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 flex flex-col justify-between space-y-6 shadow-sm">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">7-Day Free Trial</span>
                <div className="mt-2 text-3xl font-black text-slate-950">$0</div>
                <p className="text-xs text-slate-600 mt-2 font-medium">Test your AI employee risk-free with your real business services.</p>
                <ul className="mt-6 space-y-2.5 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> 500 AI Messages</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Website Chat Widget</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Live Sandbox Testing</li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full rounded-xl border border-slate-300 bg-white py-3 text-center text-xs font-bold text-slate-800 hover:bg-slate-100 transition shadow-xs"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Starter */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 flex flex-col justify-between space-y-6 shadow-md">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-600">Solo Operators</span>
                <div className="mt-2 text-3xl font-black text-slate-950">$99<span className="text-xs text-slate-500 font-medium"> / month</span></div>
                <p className="text-xs text-slate-600 mt-2 font-medium">Perfect for growing clinics and trade businesses.</p>
                <ul className="mt-6 space-y-2.5 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> 1,000 AI Messages / mo</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> WhatsApp + Website Chat</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> 100 Calendar Appointments</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Automated Follow-ups</li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full rounded-xl bg-slate-900 py-3 text-center text-xs font-bold text-white hover:bg-slate-800 transition shadow-sm"
              >
                Get Started
              </Link>
            </div>

            {/* Growth */}
            <div className="rounded-3xl border-2 border-blue-600 bg-blue-50/40 p-8 flex flex-col justify-between space-y-6 shadow-xl relative">
              <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-0.5 text-[10px] font-black text-white uppercase shadow-sm">
                Most Popular
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-700">High Volume Teams</span>
                <div className="mt-2 text-3xl font-black text-slate-950">$199<span className="text-xs text-slate-500 font-medium"> / month</span></div>
                <p className="text-xs text-slate-600 mt-2 font-medium">Full autonomy, unlimited knowledge base, and priority speed.</p>
                <ul className="mt-6 space-y-2.5 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> 2,500 AI Messages / mo</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> 250 Confirmed Calendar Bookings</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Priority 2s AI Response SLA</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Dedicated Phone Support</li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full rounded-xl bg-blue-600 py-3 text-center text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition"
              >
                Start Growth Plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="border-t border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Common Questions</span>
            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-6 text-left font-bold text-slate-950 hover:text-blue-600 transition"
                >
                  <span className="text-sm">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-blue-600' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-4 font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-500 text-xs">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-xs">
              <Bot className="h-4 w-4" />
            </div>
            <span className="font-black text-slate-950 text-sm">LeadFlow AI</span>
            <span className="ml-2 text-slate-400">© 2026 LeadFlow AI Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-slate-600 font-bold">
            <Link href="/login" className="hover:text-slate-950">Sign In</Link>
            <Link href="/login?demo=true" className="hover:text-slate-950">Instant Demo</Link>
            <Link href="/signup" className="hover:text-slate-950">Start Setup</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
