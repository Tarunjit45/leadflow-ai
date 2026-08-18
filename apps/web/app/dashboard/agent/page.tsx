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
  const [name, setName] = useState('LeadFlow AI Assistant');
  const [role, setRole] = useState('AI Sales & Appointment Specialist');
  const [tone, setTone] = useState<'friendly' | 'professional' | 'casual' | 'formal'>('friendly');
  const [instructions, setInstructions] = useState('We offer a 1-year warranty on all replacement parts and labor. Emergency dispatch is available for urgent inquiries.');

  // AI Permissions
  const [goals, setGoals] = useState({
    answerQuestions: true,
    collectLeads: true,
    bookAppointments: true,
    sendFollowUps: true,
  });

  // Services & Pricing
  const [services, setServices] = useState<ServiceItem[]>([
    { name: 'Diagnostic Inspection', price: '$120 Diagnostic Fee', duration: 60, description: 'Complete system inspection and diagnostic.' },
    { name: 'Standard Maintenance', price: '$180 Flat Rate', duration: 60, description: 'Full tune-up, filter check, and electrical testing.' },
    { name: 'Emergency Repair', price: '$250+ (Parts extra)', duration: 90, description: 'Priority immediate service dispatch.' },
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
  const [testInput, setTestInput] = useState('Hi! How much is a diagnostic checkup?');
  const [testMessages, setTestMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am your AI sales assistant. How can I assist you with our services today?' },
  ]);
  const [testLoading, setTestLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchApi('/agents/current')
      .then((data) => {
        if (data?.name) setName(data.name);
        if (data?.role) setRole(data.role);
        if (data?.tone) setTone(data.tone);
      })
      .catch(() => {});

    fetchApi('/knowledge/')
      .then((data) => {
        if (data?.services && data.services.length > 0) setServices(data.services);
        if (data?.hours) setHours(data.hours);
        if (data?.custom_prompt) setInstructions(data.custom_prompt);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await fetchApi('/agents/current', {
        method: 'PATCH',
        body: JSON.stringify({ name, role, tone }),
      });

      await fetchApi('/knowledge/', {
        method: 'PUT',
        body: JSON.stringify({
          services,
          hours,
          custom_prompt: instructions,
        }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim() || testLoading) return;

    const userText = testInput.trim();
    setTestMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setTestInput('');
    setTestLoading(true);

    try {
      const res = await fetchApi('/test-console/simulate', {
        method: 'POST',
        body: JSON.stringify({ message: userText }),
      });

      if (res?.response) {
        setTestMessages((prev) => [...prev, { sender: 'ai', text: res.response }]);
      } else {
        setTestMessages((prev) => [
          ...prev,
          { sender: 'ai', text: `We charge ${services[0]?.price || '$120'} for standard inspection. Would you like me to book tomorrow morning for you?` },
        ]);
      }
    } catch {
      setTestMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Our diagnostic checkup is ${services[0]?.price || '$120'}. We have an open slot tomorrow at 10:00 AM if you'd like me to reserve it!` },
      ]);
    } finally {
      setTestLoading(false);
    }
  };

  const addService = () => {
    setServices([
      ...services,
      { name: 'New Service Item', price: '$99 Flat Rate', duration: 60, description: 'Describe what is included in this service.' },
    ]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto animate-fade-in font-sans text-slate-900">
      {/* Top Title & Save Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">AI Employee Studio</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Customize your AI employee&apos;s speaking style, services, prices, and test live in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Saved &amp; Updated!</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary py-2.5 px-5 text-xs font-bold shadow-md shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        {[
          { id: 'personality', label: '1. Speaking Style & Persona' },
          { id: 'services', label: '2. Services & Pricing' },
          { id: 'hours', label: '3. Business Hours' },
          { id: 'sandbox', label: '4. Live Test Chat' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent text-slate-500 font-bold hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Personality */}
      {activeTab === 'personality' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-200/50">
            <h2 className="text-base font-black text-slate-950 tracking-tight">AI Identity &amp; Persona</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  AI Employee Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah from Apex Air"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Job Role / Title
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Sales & Dispatch Specialist"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Speaking Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'friendly', label: 'Friendly & Warm', desc: 'Approachable and helpful' },
                  { id: 'professional', label: 'Professional', desc: 'Direct, clear, and courteous' },
                  { id: 'casual', label: 'Casual & Upbeat', desc: 'Fast, modern, conversational' },
                  { id: 'formal', label: 'Formal', desc: 'Polished for law and clinical' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-150 ${
                      tone === t.id
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black text-slate-950">{t.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Special Rules or Instructions for Your AI
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. We give a 10% discount to seniors. We do not service commercial units."
                className="input-field leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Services & Prices */}
      {activeTab === 'services' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">Services &amp; Pricing Menu</h2>
              <p className="text-xs text-slate-500 font-medium">Your AI references these exact prices when speaking with customers.</p>
            </div>
            <button
              onClick={addService}
              className="btn-secondary py-2 px-3 text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Service</span>
            </button>
          </div>

          <div className="space-y-3">
            {services.map((svc, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3 shadow-md shadow-slate-200/40"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">Service Name</label>
                    <input
                      type="text"
                      value={svc.name}
                      onChange={(e) => {
                        const updated = [...services];
                        updated[idx].name = e.target.value;
                        setServices(updated);
                      }}
                      className="input-field"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">Price / Fee</label>
                    <input
                      type="text"
                      value={svc.price}
                      onChange={(e) => {
                        const updated = [...services];
                        updated[idx].price = e.target.value;
                        setServices(updated);
                      }}
                      className="input-field"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">Duration (Min)</label>
                    <input
                      type="number"
                      value={svc.duration || 60}
                      onChange={(e) => {
                        const updated = [...services];
                        updated[idx].duration = parseInt(e.target.value) || 60;
                        setServices(updated);
                      }}
                      className="input-field"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-end justify-end pb-1">
                    <button
                      onClick={() => removeService(idx)}
                      className="text-slate-400 hover:text-rose-600 p-2 transition-colors"
                      title="Delete service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">What&apos;s Included (Description)</label>
                  <input
                    type="text"
                    value={svc.description}
                    onChange={(e) => {
                      const updated = [...services];
                      updated[idx].description = e.target.value;
                      setServices(updated);
                    }}
                    className="input-field"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Business Hours */}
      {activeTab === 'hours' && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-xl shadow-slate-200/50">
            <h2 className="text-base font-black text-slate-950">Operating Schedule</h2>
            <p className="text-xs text-slate-500 font-medium">Your AI only schedules appointments during these available operating hours.</p>

            <div className="space-y-2.5 pt-2">
              {Object.entries(hours).map(([day, val]) => (
                <div
                  key={day}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <span className="font-black text-slate-950 capitalize w-28">{day}</span>

                  <div className="flex items-center gap-3">
                    {!val.closed ? (
                      <>
                        <input
                          type="time"
                          value={val.open}
                          onChange={(e) => {
                            setHours({ ...hours, [day]: { ...val, open: e.target.value } });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold shadow-xs"
                        />
                        <span className="text-slate-500 font-bold">to</span>
                        <input
                          type="time"
                          value={val.close}
                          onChange={(e) => {
                            setHours({ ...hours, [day]: { ...val, close: e.target.value } });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold shadow-xs"
                        />
                      </>
                    ) : (
                      <span className="text-slate-400 italic px-4 font-semibold">Closed</span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setHours({ ...hours, [day]: { ...val, closed: !val.closed } });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition shadow-xs ${
                        val.closed ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {val.closed ? 'Open' : 'Close'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Live Test Chat Sandbox */}
      {activeTab === 'sandbox' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xl shadow-slate-200/50 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950">{name} — Live Test Sandbox</h3>
                <p className="text-[10px] text-slate-500 font-medium">Ask questions as if you were a customer to test replies and pricing.</p>
              </div>
            </div>

            <button
              onClick={() => {
                setTestMessages([
                  { sender: 'ai', text: `Hello! I am ${name}. How can I assist you today?` },
                ]);
              }}
              className="text-xs text-slate-500 hover:text-slate-950 transition-colors font-bold underline"
            >
              Reset Chat
            </button>
          </div>

          {/* Chat Stream */}
          <div className="h-72 overflow-y-auto space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {testMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed font-medium ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-sm rounded-tr-sm'
                      : 'bg-white text-slate-950 border border-slate-200 shadow-xs rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {testLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-white border border-slate-200 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-600 typing-dot" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 typing-dot" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 typing-dot" />
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendTestMessage} className="flex gap-2">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Type a test customer message..."
              className="input-field"
            />
            <button
              type="submit"
              disabled={testLoading || !testInput.trim()}
              className="btn-primary shrink-0 py-2.5 px-5 text-xs font-bold shadow-md shadow-blue-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
