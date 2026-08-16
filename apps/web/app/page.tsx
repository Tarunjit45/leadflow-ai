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
  TrendingUp,
  Sliders,
  ChevronDown,
  Sparkles,
  PhoneCall,
  Layers,
  Database,
} from 'lucide-react';

export default function LandingPage() {
  const [avgJobValue, setAvgJobValue] = useState<number>(850);
  const [monthlyMissedLeads, setMonthlyMissedLeads] = useState<number>(25);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Recovery Math
  const estimatedRecoveredLeads = Math.round(monthlyMissedLeads * 0.45); // 45% recovery rate
  const monthlyRevenueRecovered = estimatedRecoveredLeads * avgJobValue;
  const annualRevenueRecovered = monthlyRevenueRecovered * 12;

  const faqs = [
    {
      q: 'How quickly does LeadFlow AI respond to incoming customer messages?',
      a: 'LeadFlow AI responds in under 2 seconds across your Website Chat and WhatsApp. Instant response increases lead conversion by up to 391% compared to a 30-minute delay.',
    },
    {
      q: 'Will the AI make up prices or promise appointments we cannot fulfill?',
      a: 'No. LeadFlow AI operates under strict boundary guardrails and direct tool permissions. It only quotes pricing present in your configured services, and checks your real-time Google Calendar before confirming any booking slot.',
    },
    {
      q: 'What happens if a customer has a complex problem or wants a human?',
      a: 'The AI instantly recognizes escalation triggers and executes the `human_handoff` tool. It pauses automated replies for that thread, alerts your dispatch team, and allows you to seamlessly take over the conversation from your dashboard.',
    },
    {
      q: 'Do I need technical skills to integrate LeadFlow with my website and WhatsApp?',
      a: 'Not at all. You can copy a single line of JavaScript to embed the chat widget on any website (WordPress, Webflow, Squarespace, Wix), and connect your official Meta WhatsApp Cloud API in minutes.',
    },
    {
      q: 'Can I test the agent before sending it live to real customers?',
      a: 'Yes! The dashboard includes a dedicated Agent Test Console sandbox where you can simulate customer queries, inspect lead extraction, review internal tool calls, and fine-tune responses safely.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 shadow-md shadow-sky-500/20">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">LeadFlow</span>
              <span className="ml-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">AI</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#problem" className="hover:text-white transition">The Problem</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#roi" className="hover:text-white transition">ROI Calculator</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/login?demo=true"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              Live Demo
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/30 via-slate-950/0 to-slate-950 pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-400 shadow-inner">
            <Zap className="h-3.5 w-3.5 text-sky-400" />
            <span>Built for HVAC, Plumbing & Home Service Leaders</span>
          </div>

          <h1 className="mt-8 text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Turn every inbound enquiry into a{' '}
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              booked customer.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
            LeadFlow AI responds to customer leads instantly, qualifies their service requirements, follows up automatically across WhatsApp and Web, and books verified appointments on your calendar 24/7.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-7 py-4 text-base font-bold text-white shadow-xl shadow-sky-600/30 hover:bg-sky-500 transition active:scale-95"
            >
              Start 7-Day Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login?demo=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-7 py-4 text-base font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
            >
              <Bot className="h-5 w-5 text-sky-400" />
              Explore Interactive Demo
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>&lt; 2s AI Response Time</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Official Meta WhatsApp Cloud API</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Google Calendar Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Zero Hallucination Guardrails</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section id="problem" className="border-t border-slate-800 bg-slate-950 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-rose-400">The Revenue Leak</h2>
            <p className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Why home-service companies lose 40% of inbound revenue every week
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-5">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Slow Response Delays</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                78% of customers buy from the first contractor who replies. If you take 30 minutes to respond, they’ve already booked your competitor.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-5">
                <PhoneCall className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">After-Hours Lost Calls</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Over 35% of emergency AC and plumbing breakdowns happen between 6 PM and 8 AM. Unanswered messages turn into lost four-figure jobs.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 mb-5">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Forgotten Follow-Ups</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                60% of interested homeowners go quiet after the initial price check. Without automated multi-day cadences, these warm leads vanish.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-5">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Scheduling Friction</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Endless back-and-forth texting ("What time works for you?") causes customer drop-off before an appointment is ever locked in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-slate-800 bg-slate-900/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-sky-400">Streamlined Workflow</h2>
            <p className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              From Inquiry to Confirmed Job in 3 Simple Steps
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-sm">
              <div className="absolute -top-4 left-8 rounded-full bg-sky-600 px-3 py-1 text-xs font-extrabold text-white">
                Step 1
              </div>
              <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 mb-5">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Connect Channels</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Embed your website chat widget with a single tag and link your official WhatsApp Cloud API and Google Calendar in under 3 minutes.
              </p>
            </div>

            <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-sm">
              <div className="absolute -top-4 left-8 rounded-full bg-sky-600 px-3 py-1 text-xs font-extrabold text-white">
                Step 2
              </div>
              <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 mb-5">
                <Sliders className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Configure AI Rules</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Add your business services, diagnostic pricing, service areas, operating hours, and booking constraints. Set custom guardrails.
              </p>
            </div>

            <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-sm">
              <div className="absolute -top-4 left-8 rounded-full bg-sky-600 px-3 py-1 text-xs font-extrabold text-white">
                Step 3
              </div>
              <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 mb-5">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Activate & Scale</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Switch your agent to Active. LeadFlow automatically qualifies leads, scores urgency, sends follow-ups, and books appointments on autopilot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-slate-800 bg-slate-950 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-sky-400">Autonomous Features</h2>
            <p className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              An AI Sales Dispatcher Engineered for Revenue
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <Bot className="h-8 w-8 text-sky-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Instant Lead Response</h3>
              <p className="mt-2 text-sm text-slate-400">
                Engages every visitor immediately with empathetic, professional dialogue grounded in your exact business knowledge.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <ShieldCheck className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Structured Lead Qualification</h3>
              <p className="mt-2 text-sm text-slate-400">
                Automatically extracts customer name, phone, address, problem severity, and assigns a dynamic 0–100 lead score.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <Clock className="h-8 w-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Automated Scheduled Follow-Ups</h3>
              <p className="mt-2 text-sm text-slate-400">
                Multi-stage follow-up engine (+24h, +72h, +7d) re-engages unresponsive leads. Automatically stops upon booking or reply.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <Calendar className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Live Calendar Booking</h3>
              <p className="mt-2 text-sm text-slate-400">
                Checks open availability slots on Google Calendar, locks in appointment times, and sends calendar invites instantly.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <PhoneCall className="h-8 w-8 text-rose-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Instant Human Takeover</h3>
              <p className="mt-2 text-sm text-slate-400">
                One-click human intervention. Take over any conversation when custom quotes or special technician dispatch is required.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <Database className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Google Sheets & CRM Sync</h3>
              <p className="mt-2 text-sm text-slate-400">
                Every qualified lead, conversation transcript, and appointment syncs automatically to your connected CRM and spreadsheets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI & Revenue Recovery Calculator */}
      <section id="roi" className="border-t border-slate-800 bg-slate-900/60 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Measurable Impact</h2>
            <p className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Calculate Your Recovered Revenue Potential
            </p>
            <p className="mt-2 text-sm text-slate-400">
              See what reclaiming 45% of missed inquiries and quiet leads is worth to your business.
            </p>
          </div>

          <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-950 p-8 sm:p-10 shadow-2xl">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-300">Average Job Value ($)</span>
                    <span className="text-sky-400 font-bold text-base">${avgJobValue}</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="5000"
                    step="50"
                    value={avgJobValue}
                    onChange={(e) => setAvgJobValue(Number(e.target.value))}
                    className="mt-3 w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>$150 (Tune-up)</span>
                    <span>$850 (Average)</span>
                    <span>$5,000+ (System Install)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-300">Monthly Inquiries / Missed Leads</span>
                    <span className="text-sky-400 font-bold text-base">{monthlyMissedLeads} leads/mo</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={monthlyMissedLeads}
                    onChange={(e) => setMonthlyMissedLeads(Number(e.target.value))}
                    className="mt-3 w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>5 leads</span>
                    <span>50 leads</span>
                    <span>200+ leads</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-400">
                  <p>
                    <span className="font-semibold text-slate-200">Note:</span> Estimated revenue is calculated as (Estimated Recovered Leads × Average Value). Clear, conservative model based on 45% re-engagement benchmark.
                  </p>
                </div>
              </div>

              {/* Recovery Display Card */}
              <div className="flex flex-col justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-850 p-8 border border-sky-500/20 shadow-lg text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Estimated Revenue Recovered</span>
                <div className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-white">
                  ${monthlyRevenueRecovered.toLocaleString()}
                  <span className="text-lg font-normal text-slate-400">/mo</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-emerald-400">
                  ≈ ${annualRevenueRecovered.toLocaleString()} in recovered annual revenue
                </div>

                <div className="mt-6 border-t border-slate-800 pt-4 flex justify-around text-xs text-slate-400">
                  <div>
                    <div className="text-lg font-bold text-white">{estimatedRecoveredLeads}</div>
                    <div>Recovered Leads/mo</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">&lt; 2 sec</div>
                    <div>Response Speed</div>
                  </div>
                </div>

                <Link
                  href="/signup"
                  className="mt-6 w-full rounded-xl bg-sky-600 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition"
                >
                  Claim Your Recovered Revenue
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-slate-800 bg-slate-950 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-sky-400">Simple & Predictable</h2>
            <p className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Transparent Pricing Plans
            </p>
            <p className="mt-2 text-sm text-slate-400">
              No hidden fees, no per-seat penalties. Cancel or upgrade anytime.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
            {/* Free Trial */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">7-Day Trial</span>
                <h3 className="mt-2 text-2xl font-bold text-white">Free Trial</h3>
                <p className="mt-2 text-xs text-slate-400">Test the AI agent risk-free with your real business knowledge.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-xs text-slate-400">/7 days</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Up to 500 AI Messages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Website Chat Widget</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Lead Qualification & Scoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Agent Test Sandbox Console</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="mt-8 w-full rounded-xl border border-slate-700 bg-slate-800 py-3 text-center text-sm font-bold text-white hover:bg-slate-700 transition"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Starter Plan */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Solo Contractors</span>
                <h3 className="mt-2 text-2xl font-bold text-white">Starter</h3>
                <p className="mt-2 text-xs text-slate-400">Ideal for growing trade operators needing 24/7 coverage.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$99</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>1,000 AI Messages/mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Website Chat + WhatsApp Cloud API</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Google Calendar Auto-Booking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Multi-stage Automated Follow-Ups</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Human Takeover Inbox</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="mt-8 w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 text-center text-sm font-bold text-white transition"
              >
                Get Started
              </Link>
            </div>

            {/* Growth Plan - Featured */}
            <div className="relative rounded-3xl border-2 border-sky-500 bg-slate-900 p-8 flex flex-col justify-between shadow-2xl shadow-sky-500/10">
              <div className="absolute -top-3.5 right-8 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-0.5 text-[11px] font-extrabold tracking-wide text-white uppercase">
                Most Popular
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">High Volume Teams</span>
                <h3 className="mt-2 text-2xl font-bold text-white">Growth</h3>
                <p className="mt-2 text-xs text-slate-400">Full autonomy, unlimited knowledge base, and priority dispatch.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$199</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>2,500 AI Messages/mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>250 Confirmed Calendar Appointments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Google Sheets & Full CRM Sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Revenue Recovery Analytics Suite</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                    <span>Zero-Downtime High Priority SLA</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="mt-8 w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-center text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition"
              >
                Start Growth Plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="border-t border-slate-800 bg-slate-900/50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-sky-400">Got Questions?</h2>
            <p className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Frequently Asked Questions
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-6 text-left font-semibold text-white hover:text-sky-400 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-sky-400' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="border-t border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Stop losing leads to slow response times.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Deploy your dedicated LeadFlow AI agent today. Turn every website inquiry and WhatsApp message into qualified, booked appointments on autopilot.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-sky-600/30 hover:bg-sky-500 transition"
            >
              Start Free 7-Day Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login?demo=true"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-8 py-4 text-base font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              Test Live Sandbox
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-500 text-xs">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white font-bold">
              <Bot className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-300 text-sm">LeadFlow AI</span>
            <span className="ml-2 text-slate-600">© 2026 LeadFlow AI Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <a href="#features" className="hover:text-slate-200 transition">Features</a>
            <a href="#pricing" className="hover:text-slate-200 transition">Pricing</a>
            <a href="#faq" className="hover:text-slate-200 transition">FAQ</a>
            <Link href="/login" className="hover:text-slate-200 transition">Sign In</Link>
            <Link href="/login?demo=true" className="hover:text-slate-200 transition">Demo Mode</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
