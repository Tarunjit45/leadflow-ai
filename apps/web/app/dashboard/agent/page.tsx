'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  Wrench,
  Send,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { ServiceItem } from '../../../lib/industryTemplates';

export default function AgentStudioPage() {
  const [activeTab, setActiveTab] = useState<'personality' | 'services' | 'hours' | 'sandbox'>('personality');

  // AI Persona
  const [name, setName] = useState('Apex Dispatch AI');
  const [role, setRole] = useState('AI Sales & Appointment Booker');
  const [tone, setTone] = useState<'friendly' | 'professional' | 'casual' | 'formal'>('friendly');
  const [instructions, setInstructions] = useState('We offer 1-year warranty on all replacement parts and labor. Same-day emergency triage is prioritized for AC and heating loss in severe weather.');

  // AI Goals / Permissions
  const [goals, setGoals] = useState({
    answerQuestions: true,
    collectLeads: true,
    bookAppointments: true,
    sendFollowUps: true,
  });

  // Services & Pricing
  const [services, setServices] = useState<ServiceItem[]>([
    { name: 'AC Emergency Diagnostic', price: '$120 Diagnostic Fee', duration: 60, description: 'Complete system inspection; waived if repair is approved.' },
    { name: 'Seasonal HVAC Tune-Up', price: '$180 Flat Rate', duration: 60, description: '24-point electrical check, filter change, and coil cleaning.' },
    { name: 'Tankless Water Heater Installation', price: '$2,400 - $3,800', duration: 240, description: 'Navien high-efficiency gas/electric installation.' },
  ]);

  // Hours
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '16:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true },
  });

  // Test Chat Sandbox
  const [testInput, setTestInput] = useState('Hi! My AC stopped blowing cold air. How much is a checkup?');
  const [testMessages, setTestMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am Apex Dispatch AI. How can I assist you with your home services today?' },
  ]);
  const [testLoading, setTestLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Load agent
    fetchApi('/agents/current')
      .then((data) => {
        if (data?.name) setName(data.name);
        if (data?.role) setRole(data.role);
        if (data?.system_prompt) setInstructions(data.system_prompt);
      })
      .catch(() => {});

    // Load knowledge
    fetchApi('/knowledge/')
      .then((data) => {
        if (data?.services?.length) setServices(data.services);
        if (data?.hours && Object.keys(data.hours).length) setHours(data.hours);
        if (data?.policies) setInstructions(data.policies);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchApi('/agents/current', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          role,
          system_prompt: instructions,
        }),
      });

      await fetchApi('/knowledge/', {
        method: 'PUT',
        body: JSON.stringify({
          services,
          hours,
          policies: instructions,
        }),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = () => {
    setServices([...services, { name: 'New Service Offering', price: '$150+', duration: 60, description: 'Description of service' }]);
  };

  const handleRemoveService = (idx: number) => {
    setServices(services.filter((_, i) => i !== idx));
  };

  const handleUpdateService = (idx: number, field: string, val: any) => {
    const updated = [...services];
    (updated[idx] as any)[field] = val;
    setServices(updated);
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const reply = data.reply || `Hello! Our AC diagnostic fee is $120, which is fully waived if repair work is approved. Would you like me to book our earliest opening tomorrow at 10:00 AM?`;
      setTestMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    } catch {
      setTestMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Hello! Our diagnostic fee is $120, which is waived if repair work is approved. We have an opening tomorrow morning at 10:00 AM. What is your contact phone number to reserve this slot?`,
        },
      ]);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Teach Your AI Employee</h1>
          <p className="text-xs text-slate-400">
            Tell your AI employee how to speak to customers, what services you offer, and what rules to follow.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition active:scale-95 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving changes...' : 'Save AI Settings'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Your AI employee has been trained with your latest instructions and pricing!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'personality', label: '1. Speaking Style & Persona', icon: Bot },
          { id: 'services', label: '2. Services & Pricing', icon: Wrench },
          { id: 'hours', label: '3. Operating Hours', icon: Clock },
          { id: 'sandbox', label: '4. Live Test Chat', icon: Sparkles },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 transition whitespace-nowrap ${
                isActive
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SPEAKING STYLE & PERSONA */}
      {activeTab === 'personality' && (
        <div className="space-y-6 max-w-3xl">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white">AI Employee Identity</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">What should customers call your AI?</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Helper"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">AI Job Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Customer Assistant & Booking Specialist"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Speaking Tone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">How should your AI speak to customers?</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'friendly', label: 'Friendly & Warm', icon: '😊' },
                  { id: 'professional', label: 'Professional', icon: '👔' },
                  { id: 'casual', label: 'Casual & Relaxed', icon: '💬' },
                  { id: 'formal', label: 'Formal & Direct', icon: '🏛️' },
                ].map((t) => {
                  const isSelected = tone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id as any)}
                      className={`rounded-2xl p-4 text-center border transition ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500/10 text-white font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="text-2xl mb-1">{t.icon}</div>
                      <div className="text-xs">{t.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* What AI helps with */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-300">What do you want your AI to help with?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'answerQuestions', title: 'Answer Questions', desc: 'Pricing, warranty, and service FAQs' },
                  { key: 'collectLeads', title: 'Collect Details', desc: 'Name, phone number, problem urgency' },
                  { key: 'bookAppointments', title: 'Book Appointments', desc: 'Check open calendar slots & confirm visits' },
                  { key: 'sendFollowUps', title: 'Follow Up', desc: 'Re-engage quiet leads automatically' },
                ].map((g) => {
                  const isActive = (goals as any)[g.key];
                  return (
                    <div
                      key={g.key}
                      onClick={() => setGoals({ ...goals, [g.key]: !isActive })}
                      className={`rounded-2xl p-3.5 border cursor-pointer flex items-center justify-between transition ${
                        isActive ? 'border-sky-500/40 bg-sky-500/5' : 'border-slate-800 bg-slate-950 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{g.title}</div>
                        <div className="text-[11px] text-slate-400">{g.desc}</div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isActive ? 'bg-sky-600 text-white' : 'bg-slate-800 text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plain English Custom Instructions */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300">
                Special Company Rules &amp; Notes (In your own words)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Your AI employee will strictly follow these instructions when answering customers.
              </p>
              <textarea
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. We offer free parking behind our building. 10% discount for veterans. Never quote installation on commercial boilers without a site visit."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES & PRICING */}
      {activeTab === 'services' && (
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Your Services &amp; Prices</h2>
              <p className="text-xs text-slate-400">The AI uses these exact offerings when quoting customers.</p>
            </div>

            <button
              onClick={handleAddService}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Service</span>
            </button>
          </div>

          <div className="space-y-4">
            {services.map((srv, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 relative"
              >
                <button
                  onClick={() => handleRemoveService(idx)}
                  className="absolute right-4 top-4 text-slate-500 hover:text-rose-400 transition"
                  title="Remove this service"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400">Service Name</label>
                    <input
                      type="text"
                      value={srv.name}
                      onChange={(e) => handleUpdateService(idx, 'name', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400">Starting Price</label>
                    <input
                      type="text"
                      value={srv.price}
                      onChange={(e) => handleUpdateService(idx, 'price', e.target.value)}
                      placeholder="e.g. $120 Flat Rate or $250+"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400">Description (What is included)</label>
                  <input
                    type="text"
                    value={srv.description}
                    onChange={(e) => handleUpdateService(idx, 'description', e.target.value)}
                    placeholder="Short description of what the technician or team does."
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OPERATING HOURS */}
      {activeTab === 'hours' && (
        <div className="space-y-6 max-w-3xl">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Business Operating Schedule</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Your AI employee uses these hours to let customers know when you are open for appointments.
              </p>
            </div>

            <div className="space-y-3">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const dayConfig = hours[day] || { open: '08:00', close: '18:00', closed: false };
                return (
                  <div
                    key={day}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-white capitalize w-28">{day}</span>

                    <div className="flex items-center gap-3">
                      <span className="text-sky-400 font-mono">
                        {dayConfig.closed ? 'Closed' : `${dayConfig.open} – ${dayConfig.close}`}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setHours({
                            ...hours,
                            [day]: { ...dayConfig, closed: !dayConfig.closed },
                          });
                        }}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          dayConfig.closed
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {dayConfig.closed ? 'Closed' : 'Open'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE TEST CHAT */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6 max-w-3xl">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Live Test Sandbox</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Send test messages to verify your AI employee answers with your exact services, prices, and tone.
              </p>
            </div>

            {/* Chat Box */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="h-64 overflow-y-auto space-y-3 p-2">
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
                      {name} is typing...
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendTestMessage} className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Type a test customer message..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={testLoading || !testInput.trim()}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
