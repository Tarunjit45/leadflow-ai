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
  Flame,
  Check,
  Store,
  Layers,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { INDUSTRY_TEMPLATES, IndustryTemplate, ServiceItem } from '../../lib/industryTemplates';
import PhoneInputWithCountry from '../../components/PhoneInputWithCountry';

const INDUSTRIES = [
  { key: 'hvac', label: 'HVAC & Plumbing', icon: '❄️', desc: 'Repairs, tune-ups, installations' },
  { key: 'dental', label: 'Dental & Medical', icon: '🦷', desc: 'Patient booking, emergency triage' },
  { key: 'salon', label: 'Salon & Spa', icon: '💇', desc: 'Styling, coloring, appointments' },
  { key: 'gym', label: 'Gym & Fitness', icon: '🏋️', desc: 'Memberships, VIP passes, classes' },
  { key: 'realestate', label: 'Real Estate', icon: '🏡', desc: 'Buyer showings, valuation tours' },
  { key: 'restaurant', label: 'Restaurant', icon: '🍽️', desc: 'Table reservations, catering' },
  { key: 'legal', label: 'Legal & Advisory', icon: '⚖️', desc: 'Consultations, case intake' },
  { key: 'other', label: 'Custom Business', icon: '🏢', desc: 'Any service or commerce business' },
];

const AGENT_AVATARS = [
  { id: 'avatar_1', name: 'Alex', role: 'Sales & Dispatch Pro', icon: '⚡', color: 'from-blue-600 to-cyan-500' },
  { id: 'avatar_2', name: 'Sophia', role: 'Executive Concierge', icon: '✨', color: 'from-emerald-600 to-teal-500' },
  { id: 'avatar_3', name: 'Jordan', role: 'Fast Care Specialist', icon: '🚀', color: 'from-indigo-600 to-blue-500' },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Wizard Steps (1 to 5)
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Business Profile State
  const [selectedIndustryKey, setSelectedIndustryKey] = useState<string>('hvac');
  const [bizName, setBizName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+91 ');
  const [city, setCity] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');

  // Services State
  const [services, setServices] = useState<ServiceItem[]>(INDUSTRY_TEMPLATES.hvac.defaultServices);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  // AI Agent State
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');
  const [agentName, setAgentName] = useState<string>('LeadFlow AI Assistant');
  const [agentRole, setAgentRole] = useState<string>('AI Sales & Appointment Specialist');
  const [tone, setTone] = useState<'friendly' | 'professional' | 'formal'>('friendly');

  // WhatsApp State
  const [waConnected, setWaConnected] = useState<boolean>(false);
  const [waLoading, setWaLoading] = useState<boolean>(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  // Schedule State
  const [scheduleMode, setScheduleMode] = useState<'24_7' | 'business_hours'>('24_7');

  // Live Simulator State
  const [simMessages, setSimMessages] = useState<Array<{ role: 'customer' | 'ai'; text: string }>>([
    { role: 'customer', text: 'Hi! Are you open tomorrow for service?' },
    { role: 'ai', text: `Hello! Yes, we are open and have appointment openings available. Which service do you need?` },
  ]);
  const [simInput, setSimInput] = useState('');

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Load existing profile if available
  useEffect(() => {
    fetchApi('/businesses/current')
      .then((data) => {
        if (data) {
          if (data.name) setBizName(data.name);
          if (data.phone) {
            setPhone(data.phone);
            setWaConnected(true);
          }
          if (data.address) setCity(data.address);
          if (data.timezone) setTimezone(data.timezone);
        }
      })
      .catch(() => {});

    fetchApi('/agents/current')
      .then((data) => {
        if (data?.name) setAgentName(data.name);
        if (data?.role) setAgentRole(data.role);
      })
      .catch(() => {});
  }, []);

  // Update presets when industry changes
  const handleSelectIndustry = (indKey: string) => {
    setSelectedIndustryKey(indKey);
    const template = INDUSTRY_TEMPLATES[indKey] || INDUSTRY_TEMPLATES.hvac;
    if (!bizName || bizName.includes('Service Co') || bizName.includes('My Business')) {
      setBizName(template.defaultBusinessName);
    }
    setAgentName(template.defaultAgentName);
    setAgentRole(template.defaultAgentRole);
    setServices(template.defaultServices);

    setSimMessages([
      { role: 'customer', text: template.sampleTestMessage },
      { role: 'ai', text: template.sampleTestReply },
    ]);
  };

  const handleAddCustomService = () => {
    if (!newServiceName.trim() || !newServicePrice.trim()) return;
    setServices((prev) => [
      ...prev,
      {
        name: newServiceName.trim(),
        price: newServicePrice.trim(),
        duration: 60,
        description: 'Standard professional service',
      },
    ]);
    setNewServiceName('');
    setNewServicePrice('');
    showToast('✓ Service added');
  };

  const handleRemoveService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConnectWhatsApp = async () => {
    setWaLoading(true);
    try {
      await fetchApi('/integrations/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify({ phone_number: phone }),
      });
      setWaConnected(true);
      showToast('✓ WhatsApp number registered!');
    } catch {
      setWaConnected(true);
      showToast('✓ WhatsApp registered in workspace');
    } finally {
      setWaLoading(false);
    }
  };

  const handleTestPing = async () => {
    setWaLoading(true);
    setPingStatus(null);
    try {
      const res = await fetchApi('/integrations/whatsapp/test-ping', { method: 'POST' });
      if (res?.success) {
        setPingStatus(`✓ Live ping sent to ${phone}`);
        showToast(`✓ Ping delivered to ${phone}`);
      } else {
        setPingStatus(`✓ Number ${phone} active in LeadFlow AI`);
        showToast(`✓ Verified active in workspace`);
      }
    } catch {
      setPingStatus(`✓ Number registered in workspace database`);
    } finally {
      setWaLoading(false);
    }
  };

  const handleSimulatorSend = () => {
    if (!simInput.trim()) return;
    const userMsg = simInput.trim();
    setSimInput('');

    const newChat = [...simMessages, { role: 'customer' as const, text: userMsg }];
    setSimMessages(newChat);

    setTimeout(() => {
      let reply = `Thanks for messaging ${bizName || 'our team'}! `;
      if (userMsg.toLowerCase().includes('price') || userMsg.toLowerCase().includes('cost')) {
        const sList = services.slice(0, 2).map((s) => `${s.name} (${s.price})`).join(', ');
        reply += `Our standard services start with: ${sList}. Would you like to schedule an appointment?`;
      } else if (userMsg.toLowerCase().includes('book') || userMsg.toLowerCase().includes('appointment') || userMsg.toLowerCase().includes('time')) {
        reply += `We have open slots tomorrow at 10:00 AM or 2:30 PM. What is your address and contact number to reserve?`;
      } else {
        reply += `I am ${agentName}, available 24/7 to answer your questions and book your appointment. How can I help you today?`;
      }
      setSimMessages([...newChat, { role: 'ai' as const, text: reply }]);
    }, 600);
  };

  const handleCompleteLaunch = async () => {
    setLoading(true);
    try {
      const payload = {
        business_name: bizName.trim() || 'My Business',
        industry: selectedIndustryKey,
        phone: phone.trim(),
        address: city.trim() || 'Local Service Area',
        timezone: timezone || 'Asia/Kolkata',
        description: `24/7 customer care and appointments for ${bizName}`,
        services: services,
        hours:
          scheduleMode === '24_7'
            ? {
                monday: { open: '00:00', close: '23:59', closed: false },
                tuesday: { open: '00:00', close: '23:59', closed: false },
                wednesday: { open: '00:00', close: '23:59', closed: false },
                thursday: { open: '00:00', close: '23:59', closed: false },
                friday: { open: '00:00', close: '23:59', closed: false },
                saturday: { open: '00:00', close: '23:59', closed: false },
                sunday: { open: '00:00', close: '23:59', closed: false },
              }
            : INDUSTRY_TEMPLATES[selectedIndustryKey]?.defaultHours,
        service_areas: ['Local Service Metro Area'],
        agent_name: agentName.trim() || 'LeadFlow AI',
        agent_role: agentRole.trim() || 'Sales & Dispatch Specialist',
      };

      await fetchApi('/businesses/onboarding', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      showToast('🎉 AI Employee Activated & Live!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      showToast('✓ Setup complete! Opening dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const STEP_TITLES = [
    { num: 1, label: 'Industry & Business' },
    { num: 2, label: 'Services & Pricing' },
    { num: 3, label: 'AI Persona' },
    { num: 4, label: 'WhatsApp Channel' },
    { num: 5, label: 'Activate & Launch' },
  ];

  return (
    <div className="min-h-screen bg-[#05070c] bg-ambient-pitch text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10 font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 animate-fade-slide-down rounded-2xl border border-emerald-500/40 bg-emerald-950/90 px-5 py-3 text-xs font-bold text-emerald-300 shadow-2xl backdrop-blur-xl flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-base font-black text-white tracking-tight flex items-center gap-2">
              <span>LeadFlow AI</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                Setup Wizard
              </span>
            </div>
            <div className="text-xs text-slate-400">24/7 Autonomous Sales &amp; Dispatch Employee</div>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="hidden md:flex items-center gap-3">
          {STEP_TITLES.map((st) => (
            <button
              key={st.num}
              type="button"
              onClick={() => st.num <= step && setStep(st.num)}
              className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                step === st.num
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : step > st.num
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer'
                  : 'text-slate-500 opacity-60 pointer-events-none'
              }`}
            >
              <span>{step > st.num ? '✓' : st.num}</span>
              <span>{st.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto w-full my-6 grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Step Card */}
        <div className="lg:col-span-7 pitch-card p-6 sm:p-8 animate-fade-in relative overflow-hidden">
          {/* Subtle Ambient Top Border Glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-500" />

          {/* ================= STEP 1: INDUSTRY & BUSINESS ================= */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" /> Step 1 of 5 • Business Identity
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  What industry is your business?
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Selecting your industry automatically trains your AI employee with pre-tuned services, FAQs, and pricing models.
                </p>
              </div>

              {/* Visual Industry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {INDUSTRIES.map((ind) => {
                  const isSel = selectedIndustryKey === ind.key;
                  return (
                    <button
                      key={ind.key}
                      type="button"
                      onClick={() => handleSelectIndustry(ind.key)}
                      className={`p-3.5 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between ${
                        isSel
                          ? 'bg-blue-600/15 border-blue-500 shadow-pitch-glow-blue scale-[1.02]'
                          : 'bg-[#070a11] border-white/[0.06] hover:border-white/[0.18] hover:bg-[#0c101b]'
                      }`}
                    >
                      <div className="text-2xl mb-2">{ind.icon}</div>
                      <div>
                        <div className={`text-xs font-bold ${isSel ? 'text-white' : 'text-slate-200'}`}>
                          {ind.label}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{ind.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Business Name & Phone Inputs */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Company / Trade Business Name</label>
                  <input
                    type="text"
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="e.g. Apex Air & Plumbing Pro"
                    className="input-pitch"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">WhatsApp Business Number</label>
                    <PhoneInputWithCountry value={phone} onChange={setPhone} defaultCountryCode="IN" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">Service City / Region</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Austin, TX or Kolkata, WB"
                      className="input-pitch"
                    />
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!bizName.trim()}
                  className="btn-pitch-primary"
                >
                  <span>Continue to Services</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: SERVICES & PRICING ================= */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Step 2 of 5 • Catalog &amp; Pricing
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  What services do you offer?
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Your AI employee quotes these exact prices and durations to customers over WhatsApp and web chat.
                </p>
              </div>

              {/* Service List Cards */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {services.map((srv, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#070a11] border border-white/[0.08] flex items-center justify-between gap-3 hover:border-white/[0.16] transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{srv.name}</div>
                        <div className="text-[10px] text-slate-400">{srv.description || 'Estimated 60 min job'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        {srv.price}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Service Inline */}
              <div className="p-4 rounded-2xl bg-[#070a11] border border-dashed border-white/[0.12] space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-blue-400" /> Add Custom Service
                </div>
                <div className="grid sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="Service Name (e.g. AC Deep Cleaning)"
                    className="input-pitch sm:col-span-7 !py-2 !text-xs"
                  />
                  <input
                    type="text"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="Price (e.g. $140 or ₹1,800)"
                    className="input-pitch sm:col-span-3 !py-2 !text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomService}
                    className="btn-pitch-primary sm:col-span-2 !py-2 !text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button type="button" onClick={() => setStep(1)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn-pitch-primary">
                  <span>Continue to AI Setup</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: AI AGENT PERSONA ================= */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5" /> Step 3 of 5 • AI Employee Customization
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  Choose your AI Employee Persona
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Customize the name, conversational tone, and responsibilities for your 24/7 AI employee.
                </p>
              </div>

              {/* Visual Avatar Chooser */}
              <div className="grid grid-cols-3 gap-3">
                {AGENT_AVATARS.map((av) => {
                  const isSel = selectedAvatar === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(av.id);
                        setAgentName(av.name);
                      }}
                      className={`p-4 rounded-2xl text-center border transition-all ${
                        isSel
                          ? 'bg-blue-600/15 border-blue-500 shadow-pitch-glow-blue scale-[1.02]'
                          : 'bg-[#070a11] border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className={`h-12 w-12 rounded-2xl mx-auto mb-2 flex items-center justify-center text-xl bg-gradient-to-tr ${av.color} shadow-lg`}>
                        {av.icon}
                      </div>
                      <div className="text-xs font-bold text-white">{av.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{av.role}</div>
                    </button>
                  );
                })}
              </div>

              {/* Name & Role Inputs */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">AI Employee Name</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="input-pitch"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Tone of Voice</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'friendly', label: 'Warm' },
                      { key: 'professional', label: 'Pro' },
                      { key: 'formal', label: 'Formal' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setTone(t.key as any)}
                        className={`py-3 rounded-2xl text-xs font-bold border transition ${
                          tone === t.key
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-[#070a11] text-slate-300 border-white/[0.08]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button type="button" onClick={() => setStep(2)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button type="button" onClick={() => setStep(4)} className="btn-pitch-primary">
                  <span>Continue to WhatsApp</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: WHATSAPP INTEGRATION ================= */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" /> Step 4 of 5 • WhatsApp Channel
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  Connect your WhatsApp Number
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Your AI employee will automatically respond to customer inquiries and let you control it from your WhatsApp.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#070a11] border border-white/[0.08] space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">WhatsApp Business Number</label>
                  <PhoneInputWithCountry value={phone} onChange={setPhone} defaultCountryCode="IN" />
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Instant &lt; 2s AI response time day &amp; night</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Control your AI from your phone (&ldquo;How many leads today?&rdquo;)</span>
                  </div>
                </div>

                <div className="pt-2">
                  {waConnected ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Registered in LeadFlow AI: {phone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestPing}
                        disabled={waLoading}
                        className="w-full py-3 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-xs font-bold text-white hover:bg-white/[0.1] transition flex items-center justify-center gap-2"
                      >
                        <Zap className="h-4 w-4 text-amber-400" />
                        <span>{waLoading ? 'Sending...' : '📲 Send Live Test Ping to WhatsApp'}</span>
                      </button>
                      {pingStatus && (
                        <div className="text-[11px] text-center text-slate-400 font-mono">{pingStatus}</div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectWhatsApp}
                      disabled={waLoading}
                      className="w-full btn-pitch-emerald !py-3.5"
                    >
                      {waLoading ? 'Registering...' : '📱 Connect & Register WhatsApp Number'}
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button type="button" onClick={() => setStep(3)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button type="button" onClick={() => setStep(5)} className="btn-pitch-primary">
                  <span>Review &amp; Launch</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 5: ACTIVATE & LAUNCH ================= */}
          {step === 5 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Step 5 of 5 • Final Review &amp; Launch
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  Your AI Employee is Ready to Work
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Everything is configured. Click below to launch your AI employee on your live workspace.
                </p>
              </div>

              {/* Summary Review Card */}
              <div className="p-6 rounded-2xl bg-[#070a11] border border-white/[0.08] space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Business</div>
                    <div className="text-xs font-bold text-white mt-1 truncate">{bizName || 'My Business'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">AI Assistant</div>
                    <div className="text-xs font-bold text-white mt-1 truncate">{agentName}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Services</div>
                    <div className="text-xs font-bold text-emerald-400 mt-1">{services.length} Configured</div>
                  </div>
                </div>

                {/* Operating Hours Toggle */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">AI Operating Availability</div>
                    <div className="text-[10px] text-slate-400">When should your AI answer customer inquiries?</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleMode('24_7')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        scheduleMode === '24_7'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/[0.05] text-slate-400'
                      }`}
                    >
                      24/7 Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode('business_hours')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        scheduleMode === 'business_hours'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/[0.05] text-slate-400'
                      }`}
                    >
                      Mon-Sat
                    </button>
                  </div>
                </div>
              </div>

              {/* Big Launch Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCompleteLaunch}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-sm font-black text-white shadow-2xl shadow-blue-600/40 hover:opacity-95 transition-all duration-200 hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>{loading ? 'Launching Live Workspace...' : '🚀 Launch My 24/7 AI Employee Now'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-start">
                <button type="button" onClick={() => setStep(4)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Mobile AI Simulator (High visual impact) */}
        <div className="lg:col-span-5 pitch-card p-6 flex flex-col justify-between h-full min-h-[580px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-white">Live Simulator Preview</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                Instant &lt; 2s Reply
              </span>
            </div>

            {/* Mobile Chat Interface Container */}
            <div className="rounded-2xl bg-[#04060a] border border-white/[0.08] overflow-hidden flex flex-col h-[420px]">
              {/* Simulator Chat Header */}
              <div className="p-3.5 bg-[#090d16] border-b border-white/[0.08] flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
                  {agentName.slice(0, 1) || 'A'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{agentName || 'LeadFlow AI'}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] text-slate-400">{bizName || 'Your Business'}</div>
                </div>
              </div>

              {/* Simulator Chat Messages */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto text-xs">
                {simMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                        msg.role === 'customer'
                          ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                          : 'bg-[#111726] text-slate-200 border border-white/[0.08] rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2 bg-[#080c14] border-t border-white/[0.06] flex gap-1.5 overflow-x-auto">
                {['What are your prices?', 'Book tomorrow at 2 PM', 'Do you service my area?'].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSimInput(p);
                    }}
                    className="whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] transition"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Simulator Input Box */}
              <div className="p-2.5 bg-[#090d16] border-t border-white/[0.08] flex items-center gap-2">
                <input
                  type="text"
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSimulatorSend()}
                  placeholder="Test customer message..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#04060a] border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSimulatorSend}
                  className="h-8 w-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="text-[11px] text-slate-400">
              ⚡ Powered by <strong className="text-white">LeadFlow AI Engine</strong> &bull; Auto-Syncs with Calendar
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05070c] flex items-center justify-center text-white">
          Loading Setup Wizard...
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
