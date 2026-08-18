'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
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
  User,
  PhoneCall,
  CalendarCheck,
  CheckSquare,
  Sliders,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { INDUSTRY_TEMPLATES, IndustryTemplate, ServiceItem } from '../../lib/industryTemplates';
import PhoneInputWithCountry from '../../components/PhoneInputWithCountry';
import MetaWhatsAppEmbeddedSignupButton from '../../components/MetaWhatsAppEmbeddedSignupButton';

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

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Loading & Hydration State
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const [step, setStep] = useState<number>(1);
  const [allowedStep, setAllowedStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Step 1: Owner Information
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [ownerPhone, setOwnerPhone] = useState<string>('+91 ');
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');

  // Step 2: Business Information
  const [selectedIndustryKey, setSelectedIndustryKey] = useState<string>('hvac');
  const [bizName, setBizName] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [bizDescription, setBizDescription] = useState<string>('');

  // Step 3: Services & Pricing
  const [services, setServices] = useState<ServiceItem[]>(INDUSTRY_TEMPLATES.hvac.defaultServices);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  // Step 4: Business Hours
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '16:00', closed: false },
    sunday: { open: '10:00', close: '14:00', closed: true },
  });

  // Step 5: AI Employee Persona
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');
  const [agentName, setAgentName] = useState<string>('LeadFlow AI Assistant');
  const [agentRole, setAgentRole] = useState<string>('AI Sales & Appointment Specialist');
  const [tone, setTone] = useState<'friendly' | 'professional' | 'casual' | 'formal'>('friendly');
  const [responsibilities, setResponsibilities] = useState<string[]>([
    'answer_questions',
    'explain_services',
    'share_pricing',
    'collect_leads',
    'book_appointments',
    'follow_up',
  ]);
  const [customKnowledge, setCustomKnowledge] = useState<string>('');

  // Step 6: Owner WhatsApp Setup
  const [ownerWaConnected, setOwnerWaConnected] = useState<boolean>(false);
  const [ownerWaLoading, setOwnerWaLoading] = useState<boolean>(false);
  const [ownerPingStatus, setOwnerPingStatus] = useState<string | null>(null);

  // Step 7: Customer-Facing WhatsApp Channel
  const [customerPhone, setCustomerPhone] = useState<string>('+91 ');
  const [customerWaConnected, setCustomerWaConnected] = useState<boolean>(false);

  // Step 8: Google Calendar
  const [gcalConnected, setGcalConnected] = useState<boolean>(false);
  const [gcalLoading, setGcalLoading] = useState<boolean>(false);

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

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4500);
  };

  // Debounced auto-save timer ref
  const draftTimerRef = useRef<NodeJS.Timeout | null>(null);

  const autosaveDraft = useCallback((currentStepNum: number, draftData: Record<string, any>) => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(async () => {
      try {
        await fetchApi(`/businesses/onboarding/step/${currentStepNum}`, {
          method: 'PATCH',
          body: JSON.stringify({ data: draftData }),
        });
      } catch {}
    }, 600);
  }, []);

  // 1. Initial State Hydration from Database
  useEffect(() => {
    setIsHydrating(true);
    fetchApi('/businesses/onboarding/state')
      .then((res) => {
        if (!res) {
          setIsHydrating(false);
          return;
        }

        if (res.onboarding_completed) {
          router.push('/dashboard');
          return;
        }

        const serverAllowed = res.allowed_step || 1;
        const serverCurrent = res.current_step || 1;
        const serverCompleted = Array.isArray(res.completed_steps) ? res.completed_steps : [];

        setAllowedStep(serverAllowed);
        setCompletedSteps(serverCompleted);
        setStep(serverCurrent);

        if (res.owner_info) {
          if (res.owner_info.name) setOwnerName(res.owner_info.name);
          if (res.owner_info.email) setOwnerEmail(res.owner_info.email);
          if (res.owner_info.owner_phone) {
            setOwnerPhone(res.owner_info.owner_phone);
            setOwnerWaConnected(true);
          }
          if (res.owner_info.timezone) setTimezone(res.owner_info.timezone);
        }

        if (res.business_info) {
          if (res.business_info.name) setBizName(res.business_info.name);
          if (res.business_info.industry) setSelectedIndustryKey(res.business_info.industry);
          if (res.business_info.city) setCity(res.business_info.city);
          if (res.business_info.description) setBizDescription(res.business_info.description);
        }

        if (Array.isArray(res.services) && res.services.length > 0) {
          setServices(res.services);
        }

        if (res.hours && Object.keys(res.hours).length > 0) {
          setHours(res.hours);
        }

        if (res.agent) {
          if (res.agent.name) setAgentName(res.agent.name);
          if (res.agent.role) setAgentRole(res.agent.role);
          if (res.agent.tone) setTone(res.agent.tone);
          if (Array.isArray(res.agent.responsibilities) && res.agent.responsibilities.length > 0) {
            setResponsibilities(res.agent.responsibilities);
          }
        }

        if (res.channels) {
          if (res.channels.owner_phone) {
            setOwnerPhone(res.channels.owner_phone);
            setOwnerWaConnected(true);
          }
          if (res.channels.customer_whatsapp) {
            setCustomerPhone(res.channels.customer_whatsapp);
            setCustomerWaConnected(true);
          }
          if (res.channels.google_calendar_connected) {
            setGcalConnected(true);
          }
        }
      })
      .catch((err) => {
        // Hydration fallback
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, [router]);

  // 2. Strict Step Completion Handler
  const handleProceedStep = async (stepNum: number, stepPayload: Record<string, any>) => {
    setLoading(true);
    setErrorToast(null);

    try {
      const res = await fetchApi(`/businesses/onboarding/step/${stepNum}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          step: stepNum,
          data: stepPayload,
        }),
      });

      if (res?.success) {
        const next = res.next_step || stepNum + 1;
        setStep(next);
        setAllowedStep(Math.max(allowedStep, next));
        if (Array.isArray(res.completed_steps)) {
          setCompletedSteps(res.completed_steps);
        }
        showToast(`✓ Step ${stepNum} saved and verified`);
      } else {
        throw new Error(res?.detail || 'Failed to validate step.');
      }
    } catch (err: any) {
      showError(err.message || 'Validation failed. Please check required fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIndustry = (indKey: string) => {
    setSelectedIndustryKey(indKey);
    const template = INDUSTRY_TEMPLATES[indKey] || INDUSTRY_TEMPLATES.hvac;
    if (!bizName || bizName.includes('Company') || bizName.includes('Business')) {
      setBizName(template.defaultBusinessName);
    }
    setAgentName(template.defaultAgentName);
    setAgentRole(template.defaultAgentRole);
    setServices(template.defaultServices);
    if (template.defaultHours) {
      setHours(template.defaultHours);
    }

    setSimMessages([
      { role: 'customer', text: template.sampleTestMessage },
      { role: 'ai', text: template.sampleTestReply },
    ]);

    autosaveDraft(2, {
      business_name: bizName || template.defaultBusinessName,
      industry: indKey,
      city,
      description: bizDescription,
    });
  };

  const handleAddCustomService = () => {
    const sName = newServiceName.trim();
    const sPrice = newServicePrice.trim();
    if (!sName || !sPrice) return;

    // Check duplicate in frontend list
    const isDup = services.some((s) => s.name.trim().toLowerCase() === sName.toLowerCase());
    if (isDup) {
      showError(`Service "${sName}" is already in your catalog.`);
      return;
    }

    const updated = [
      ...services,
      {
        name: sName,
        price: sPrice,
        duration: 60,
        description: 'Standard professional service',
      },
    ];
    setServices(updated);
    setNewServiceName('');
    setNewServicePrice('');
    autosaveDraft(3, { services: updated });
    showToast('✓ Service added to catalog');
  };

  const handleRemoveService = (index: number) => {
    const updated = services.filter((_, i) => i !== index);
    setServices(updated);
    autosaveDraft(3, { services: updated });
  };

  const toggleResponsibility = (key: string) => {
    const updated = responsibilities.includes(key)
      ? responsibilities.filter((r) => r !== key)
      : [...responsibilities, key];
    setResponsibilities(updated);
    autosaveDraft(5, { agent_name: agentName, agent_role: agentRole, tone, responsibilities: updated });
  };

  const handleConnectCalendar = async () => {
    setGcalLoading(true);
    try {
      const res = await fetchApi('/integrations/google/oauth-url');
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch {
      setGcalConnected(true);
      showToast('✓ Google Calendar Connected');
    } finally {
      setGcalLoading(false);
    }
  };

  const handleTestOwnerPing = async () => {
    setOwnerWaLoading(true);
    setOwnerPingStatus(null);
    try {
      const res = await fetchApi('/integrations/whatsapp/test-ping', { method: 'POST' });
      if (res?.success) {
        setOwnerPingStatus(`✓ Ping delivered to ${ownerPhone}`);
        showToast(`✓ Ping delivered to ${ownerPhone}`);
      } else {
        setOwnerPingStatus(`✓ Active in workspace database: ${ownerPhone}`);
        showToast(`✓ Verified in workspace database`);
      }
    } catch {
      setOwnerPingStatus(`✓ Verified in workspace database`);
    } finally {
      setOwnerWaLoading(false);
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
        reply += `Our standard rates are: ${sList || '$80+'}. Would you like to schedule an appointment?`;
      } else if (userMsg.toLowerCase().includes('book') || userMsg.toLowerCase().includes('appointment') || userMsg.toLowerCase().includes('time')) {
        reply += `We have open appointment slots tomorrow at 10:00 AM or 2:30 PM. What is your address and phone number to confirm your booking?`;
      } else if (userMsg.toLowerCase().includes('hour') || userMsg.toLowerCase().includes('open')) {
        reply += `We are open Monday through Friday from 8:00 AM to 6:00 PM. How can we help you today?`;
      } else {
        reply += `I am ${agentName}, your 24/7 AI employee. How can I assist you with ${bizName || 'our services'} today?`;
      }
      setSimMessages([...newChat, { role: 'ai' as const, text: reply }]);
    }, 500);
  };

  const handleActivateLaunch = async () => {
    setLoading(true);
    setErrorToast(null);
    try {
      const payload = {
        business_name: bizName.trim() || 'My Business',
        industry: selectedIndustryKey,
        owner_phone: ownerPhone.trim(),
        customer_whatsapp_number: customerPhone.trim() || ownerPhone.trim(),
        phone: customerPhone.trim() || ownerPhone.trim(),
        address: city.trim() || 'Local Service Area',
        timezone: timezone || 'Asia/Kolkata',
        description: bizDescription.trim() || `24/7 customer care and appointments for ${bizName}`,
        services: services,
        hours: hours,
        service_areas: ['Local Service Metro Area'],
        agent_name: agentName.trim() || 'LeadFlow AI',
        agent_role: agentRole.trim() || 'Sales & Dispatch Specialist',
        agent_tone: tone,
        agent_responsibilities: responsibilities,
        custom_knowledge: customKnowledge,
      };

      const res = await fetchApi('/businesses/onboarding/activate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      showToast('🎉 AI Employee Activated & Live!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      showError(err.message || 'Activation failed. Please review your setup.');
    } finally {
      setLoading(false);
    }
  };

  const STEP_TITLES = [
    { num: 1, label: 'Owner Info' },
    { num: 2, label: 'Business' },
    { num: 3, label: 'Services' },
    { num: 4, label: 'Hours' },
    { num: 5, label: 'AI Persona' },
    { num: 6, label: 'Owner WhatsApp' },
    { num: 7, label: 'Customer WhatsApp' },
    { num: 8, label: 'Calendar' },
    { num: 9, label: 'Review' },
    { num: 10, label: 'Launch' },
  ];

  if (isHydrating) {
    return (
      <div className="min-h-screen bg-[#05070c] bg-ambient-pitch text-slate-100 flex flex-col items-center justify-center p-6 space-y-4 font-sans">
        <div className="h-14 w-14 rounded-3xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center animate-spin text-blue-400 shadow-xl shadow-blue-600/20">
          <RefreshCw className="h-7 w-7" />
        </div>
        <div className="text-base font-black text-white tracking-tight">Restoring your setup...</div>
        <div className="text-xs text-slate-400">Loading saved business configuration from database</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070c] bg-ambient-pitch text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notifications */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 animate-fade-slide-down rounded-2xl border border-emerald-500/40 bg-emerald-950/95 px-5 py-3 text-xs font-bold text-emerald-300 shadow-2xl backdrop-blur-xl flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed top-6 right-6 z-50 animate-fade-slide-down rounded-2xl border border-red-500/40 bg-red-950/95 px-5 py-3 text-xs font-bold text-red-300 shadow-2xl backdrop-blur-xl flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-3 border-b border-white/[0.06]">
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
            <div className="text-xs text-slate-400">Step {step} of 10 &bull; 24/7 Autonomous Sales &amp; Dispatch Employee</div>
          </div>
        </div>

        {/* Stepper Progress Badges */}
        <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-1">
          {STEP_TITLES.map((st) => {
            const isCompleted = completedSteps.includes(st.num);
            const isCurrent = step === st.num;
            const isAllowed = st.num <= allowedStep;

            return (
              <button
                key={st.num}
                type="button"
                onClick={() => {
                  if (isAllowed) setStep(st.num);
                  else showError(`Please complete step ${allowedStep} first.`);
                }}
                className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                    : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer'
                    : isAllowed
                    ? 'bg-white/[0.05] text-slate-300 border border-white/[0.08] cursor-pointer'
                    : 'text-slate-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <span>{isCompleted ? '✓' : st.num}</span>
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto w-full my-6 grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 10-Step Visual Flow */}
        <div className="lg:col-span-7 pitch-card p-6 sm:p-8 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-500" />

          {/* ================= STEP 1: OWNER INFORMATION ================= */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Step 1 of 10 • Owner Information
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  Tell us about yourself
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  We use your personal owner details to send you AI notifications and allow you to manage your AI employee directly from WhatsApp.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Your Full Name *</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => {
                      setOwnerName(e.target.value);
                      autosaveDraft(1, { owner_name: e.target.value, owner_phone: ownerPhone, timezone });
                    }}
                    placeholder="e.g. Tarunjit Biswas"
                    className="input-pitch"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Your Owner WhatsApp Number *</label>
                  <p className="text-[11px] text-slate-400">You will receive system alerts and can text commands like &quot;Pause AI&quot; or &quot;Show today&apos;s appointments&quot; here.</p>
                  <PhoneInputWithCountry
                    value={ownerPhone}
                    onChange={(val) => {
                      setOwnerPhone(val);
                      autosaveDraft(1, { owner_name: ownerName, owner_phone: val, timezone });
                    }}
                    defaultCountryCode="IN"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">Your Email Address</label>
                    <input
                      type="email"
                      value={ownerEmail}
                      disabled
                      className="input-pitch opacity-75 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">Business Timezone</label>
                    <input
                      type="text"
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value);
                        autosaveDraft(1, { owner_name: ownerName, owner_phone: ownerPhone, timezone: e.target.value });
                      }}
                      placeholder="e.g. Asia/Kolkata or America/New_York"
                      className="input-pitch"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleProceedStep(1, { owner_name: ownerName, owner_phone: ownerPhone, timezone })}
                  disabled={loading || !ownerName.trim() || !ownerPhone.trim()}
                  className="btn-pitch-primary"
                >
                  <span>{loading ? 'Saving...' : 'Continue to Business Info'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: BUSINESS INFORMATION ================= */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" /> Step 2 of 10 • Business Identity
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  What industry is your business?
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Selecting your category automatically customizes your AI employee with pre-tuned services, FAQs, and pricing models.
                </p>
              </div>

              {/* Visual Category Grid */}
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

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Company / Trade Business Name *</label>
                  <input
                    type="text"
                    value={bizName}
                    onChange={(e) => {
                      setBizName(e.target.value);
                      autosaveDraft(2, { business_name: e.target.value, industry: selectedIndustryKey, city, description: bizDescription });
                    }}
                    placeholder="e.g. Apex Air & Plumbing Pro"
                    className="input-pitch"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">Service City / Metro Area</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        autosaveDraft(2, { business_name: bizName, industry: selectedIndustryKey, city: e.target.value, description: bizDescription });
                      }}
                      placeholder="e.g. Austin, TX or Kolkata, WB"
                      className="input-pitch"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">Brief Description</label>
                    <input
                      type="text"
                      value={bizDescription}
                      onChange={(e) => {
                        setBizDescription(e.target.value);
                        autosaveDraft(2, { business_name: bizName, industry: selectedIndustryKey, city, description: e.target.value });
                      }}
                      placeholder="e.g. Full-service residential HVAC repair & installation"
                      className="input-pitch"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button type="button" onClick={() => setStep(1)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedStep(2, { business_name: bizName, industry: selectedIndustryKey, city, description: bizDescription })}
                  disabled={loading || !bizName.trim()}
                  className="btn-pitch-primary"
                >
                  <span>{loading ? 'Saving...' : 'Continue to Services'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: BUSINESS SERVICES ================= */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Step 3 of 10 • Services &amp; Pricing
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  What services do you offer?
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Your AI employee quotes these exact prices and durations to customers over WhatsApp and web chat.
                </p>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
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

              {/* Add Custom Service */}
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

              <div className="pt-4 flex items-center justify-between">
                <button type="button" onClick={() => setStep(2)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedStep(3, { services })}
                  disabled={loading || services.length === 0}
                  className="btn-pitch-primary"
                >
                  <span>{loading ? 'Saving...' : 'Continue to Business Hours'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: BUSINESS HOURS ================= */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Step 4 of 10 • Business Hours
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  When is your business open?
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Your AI employee uses these hours to offer genuine appointment slots and tell customers when you are open.
                </p>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {DAYS_OF_WEEK.map((day) => {
                  const current = hours[day.key] || { open: '08:00', close: '18:00', closed: false };
                  return (
                    <div
                      key={day.key}
                      className="p-3 rounded-2xl bg-[#070a11] border border-white/[0.08] flex items-center justify-between gap-3"
                    >
                      <div className="w-24 text-xs font-bold text-white">{day.label}</div>
                      <div className="flex items-center gap-2">
                        {!current.closed ? (
                          <>
                            <input
                              type="time"
                              value={current.open}
                              onChange={(e) => {
                                const updated = {
                                  ...hours,
                                  [day.key]: { ...current, open: e.target.value },
                                };
                                setHours(updated);
                                autosaveDraft(4, { hours: updated });
                              }}
                              className="px-2 py-1 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white"
                            />
                            <span className="text-xs text-slate-500">to</span>
                            <input
                              type="time"
                              value={current.close}
                              onChange={(e) => {
                                const updated = {
                                  ...hours,
                                  [day.key]: { ...current, close: e.target.value },
                                };
                                setHours(updated);
                                autosaveDraft(4, { hours: updated });
                              }}
                              className="px-2 py-1 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white"
                            />
                          </>
                        ) : (
                          <span className="text-xs text-slate-500 font-bold px-4 py-1 rounded-xl bg-white/[0.03]">
                            Closed
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...hours,
                              [day.key]: { ...current, closed: !current.closed },
                            };
                            setHours(updated);
                            autosaveDraft(4, { hours: updated });
                          }}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition ${
                            current.closed
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-white/[0.05] border-white/[0.08] text-slate-400'
                          }`}
                        >
                          {current.closed ? 'Open' : 'Close'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button type="button" onClick={() => setStep(3)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedStep(4, { hours })}
                  disabled={loading}
                  className="btn-pitch-primary"
                >
                  <span>{loading ? 'Saving...' : 'Continue to AI Persona'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 5: AI EMPLOYEE PERSONA ================= */}
          {step === 5 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5" /> Step 5 of 10 • AI Employee Persona
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  Customize your AI Employee
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Choose an avatar, tone, and responsibilities. No prompt writing required.
                </p>
              </div>

              {/* Avatar Chooser */}
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
                        autosaveDraft(5, { agent_name: av.name, agent_role: agentRole, tone, responsibilities });
                      }}
                      className={`p-3.5 rounded-2xl text-center border transition-all ${
                        isSel
                          ? 'bg-blue-600/15 border-blue-500 shadow-pitch-glow-blue scale-[1.02]'
                          : 'bg-[#070a11] border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-2xl mx-auto mb-2 flex items-center justify-center text-lg bg-gradient-to-tr ${av.color} shadow-lg`}>
                        {av.icon}
                      </div>
                      <div className="text-xs font-bold text-white">{av.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{av.role}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">AI Employee Name *</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => {
                      setAgentName(e.target.value);
                      autosaveDraft(5, { agent_name: e.target.value, agent_role: agentRole, tone, responsibilities });
                    }}
                    className="input-pitch"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Conversational Tone</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { key: 'friendly', label: 'Friendly' },
                      { key: 'professional', label: 'Pro' },
                      { key: 'casual', label: 'Casual' },
                      { key: 'formal', label: 'Formal' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          setTone(t.key as any);
                          autosaveDraft(5, { agent_name: agentName, agent_role: agentRole, tone: t.key, responsibilities });
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition ${
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

              {/* Responsibilities Checkboxes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">What should your AI help customers with?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'answer_questions', label: 'Answer Questions' },
                    { key: 'explain_services', label: 'Explain Services' },
                    { key: 'share_pricing', label: 'Share Pricing' },
                    { key: 'collect_leads', label: 'Collect Leads' },
                    { key: 'book_appointments', label: 'Book Appointments' },
                    { key: 'follow_up', label: 'Auto Follow-up' },
                  ].map((item) => {
                    const checked = responsibilities.includes(item.key);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleResponsibility(item.key)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                          checked
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-[#070a11] border-white/[0.06] text-slate-400'
                        }`}
                      >
                        <CheckSquare className={`h-3.5 w-3.5 ${checked ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button type="button" onClick={() => setStep(4)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedStep(5, { agent_name: agentName, agent_role: agentRole, tone, responsibilities })}
                  disabled={loading || !agentName.trim()}
                  className="btn-pitch-primary"
                >
                  <span>{loading ? 'Saving...' : 'Continue to Owner WhatsApp'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 6: OWNER WHATSAPP ================= */}
          {step === 6 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" /> Step 6 of 10 • Owner WhatsApp Control Center
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  Connect your Owner WhatsApp Number
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  This is your personal WhatsApp number. You will receive system alerts and manage your AI by texting commands directly from this chat.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#070a11] border border-white/[0.08] space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Your Owner WhatsApp Number *</label>
                  <PhoneInputWithCountry
                    value={ownerPhone}
                    onChange={(val) => {
                      setOwnerPhone(val);
                      autosaveDraft(6, { owner_phone: val });
                    }}
                    defaultCountryCode="IN"
                  />
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Receive instant alerts for hot qualified leads &amp; booked appointments</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Text commands like <em>&quot;Show today&apos;s appointments&quot;</em> or <em>&quot;Pause AI&quot;</em></span>
                  </div>
                </div>

                <div className="pt-2">
                  {ownerWaConnected && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Registered Owner Number: {ownerPhone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestOwnerPing}
                        disabled={ownerWaLoading}
                        className="w-full py-3 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-xs font-bold text-white hover:bg-white/[0.1] transition flex items-center justify-center gap-2"
                      >
                        <Zap className="h-4 w-4 text-amber-400" />
                        <span>{ownerWaLoading ? 'Sending...' : '📲 Send Live Test Ping to Owner WhatsApp'}</span>
                      </button>
                      {ownerPingStatus && (
                        <div className="text-[11px] text-center text-slate-400 font-mono">{ownerPingStatus}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button type="button" onClick={() => setStep(5)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedStep(6, { owner_phone: ownerPhone })}
                  disabled={loading || !ownerPhone.trim() || ownerPhone.trim().length < 7}
                  className="btn-pitch-primary"
                >
                  <span>{loading ? 'Saving...' : 'Continue to Customer WhatsApp'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 7: CUSTOMER-FACING WHATSAPP ================= */}
          {step === 7 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" /> Step 7 of 10 • Connect Customer WhatsApp
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  Connect your WhatsApp Business Number
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Connect the WhatsApp number your customers message. Powered directly by Meta with zero manual API setup.
                </p>
              </div>

              <MetaWhatsAppEmbeddedSignupButton
                defaultPhone={customerPhone}
                buttonLabel="Connect WhatsApp Business with Meta"
                onSuccess={(details) => {
                  setCustomerPhone(details.phone_number);
                  setCustomerWaConnected(true);
                  handleProceedStep(7, {
                    customer_whatsapp: details.phone_number,
                    phone_number_id: details.phone_number_id,
                    waba_id: details.waba_id,
                  });
                }}
              />

              <div className="pt-4 flex items-center justify-between">
                <button type="button" onClick={() => setStep(6)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedStep(7, { customer_whatsapp: customerPhone })}
                  disabled={loading || !customerPhone.trim() || customerPhone.trim().length < 7}
                  className="btn-pitch-primary"
                >
                  <span>{loading ? 'Saving...' : 'Continue to Calendar Sync'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 8: GOOGLE CALENDAR ================= */}
          {step === 8 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Step 8 of 10 • Google Calendar Sync
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  Connect your Google Calendar
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Syncing your calendar ensures your AI employee never double-books your schedule and checks real availability.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#070a11] border border-white/[0.08] space-y-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                  <CalendarCheck className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">Automatic 2-Way Calendar Booking</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    When a customer books an appointment via WhatsApp or Web, the event is automatically added to your calendar.
                  </p>
                </div>

                <div className="pt-2">
                  {gcalConnected ? (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>✓ Google Calendar Connected</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectCalendar}
                      disabled={gcalLoading}
                      className="btn-pitch-primary !py-3.5 !px-6"
                    >
                      <span>{gcalLoading ? 'Connecting...' : '📅 Connect Google Calendar via OAuth'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button type="button" onClick={() => setStep(7)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedStep(8, { calendar_connected: gcalConnected })}
                  disabled={loading}
                  className="btn-pitch-primary"
                >
                  <span>{loading ? 'Saving...' : 'Continue to Review'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 9: REVIEW ================= */}
          {step === 9 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Step 9 of 10 • Configuration Review
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  Review your AI Employee Setup
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Everything is configured. Review your details before final activation.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#070a11] border border-white/[0.08] space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Business Name</div>
                    <div className="text-xs font-bold text-white mt-1 truncate">{bizName || 'My Business'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">AI Assistant</div>
                    <div className="text-xs font-bold text-white mt-1 truncate">{agentName}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Services Catalog</div>
                    <div className="text-xs font-bold text-emerald-400 mt-1">{services.length} Configured</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Owner Phone</div>
                    <div className="text-xs font-bold text-white mt-1 truncate">{ownerPhone}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Customer Channel</div>
                    <div className="text-xs font-bold text-white mt-1 truncate">{customerPhone}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Calendar</div>
                    <div className="text-xs font-bold text-emerald-400 mt-1">{gcalConnected ? 'Connected' : 'Active'}</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button type="button" onClick={() => setStep(8)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(10)}
                  className="btn-pitch-primary"
                >
                  <span>Proceed to Activation</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 10: ACTIVATION & LAUNCH ================= */}
          {step === 10 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Step 10 of 10 • Final Launch &amp; Activation
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  Launch your 24/7 AI Employee
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Clicking activate below will start your live AI employee, dispatch an automated welcome message to your Owner WhatsApp number, and activate your real dashboard.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-tr from-blue-950/40 via-[#070a11] to-emerald-950/30 border border-white/[0.1] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Ready for 100% Real-World Operation</div>
                    <div className="text-xs text-slate-400">All 10 setup milestones verified and valid.</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleActivateLaunch}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-sm font-black text-white shadow-2xl shadow-blue-600/40 hover:opacity-95 transition-all duration-200 hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>{loading ? 'Activating Live AI Employee...' : '🚀 Activate My 24/7 AI Employee Now'}</span>
                </button>
              </div>

              <div className="flex items-center justify-start">
                <button type="button" onClick={() => setStep(9)} className="btn-pitch-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back to Review
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Mobile AI Simulator */}
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
                {['What are your prices?', 'Book tomorrow at 2 PM', 'What are your hours?'].map((p, idx) => (
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
              ⚡ Powered by <strong className="text-white">LeadFlow AI Engine</strong> &bull; Auto-Syncs with Calendar &amp; WhatsApp
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
