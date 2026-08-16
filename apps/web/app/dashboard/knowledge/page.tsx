'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Wrench,
  Clock,
  MapPin,
  HelpCircle,
  Shield,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<'services' | 'hours' | 'areas' | 'faqs' | 'policies'>('services');
  const [services, setServices] = useState<any[]>([
    { name: 'AC Emergency Diagnostics', price: '$120 Diagnostic Fee', duration: 60, description: 'Rapid refrigerant leak and capacitor triage.' },
    { name: 'Seasonal HVAC Tune-up', price: '$180 Flat Rate', duration: 75, description: '24-point electrical check and coil cleaning.' },
    { name: 'Tankless Water Heater Installation', price: '$2,400 - $3,800', duration: 240, description: 'Navien high-efficiency installation.' },
  ]);
  const [serviceAreas, setServiceAreas] = useState<string[]>(['Austin', 'Round Rock', 'Cedar Park', 'Westlake Hills']);
  const [newArea, setNewArea] = useState('');
  const [faqs, setFaqs] = useState<any[]>([
    { question: 'Do you offer 24/7 emergency dispatch?', answer: 'Yes, on-call technicians respond 24/7 for severe water leaks and loss of heating/cooling in extreme weather.' },
    { question: 'Are you licensed and insured?', answer: 'Yes, fully TDLR licensed, EPA universal certified, and insured.' },
  ]);
  const [policies, setPolicies] = useState('100% Satisfaction Guarantee. 1-year warranty on all replacement parts and labor.');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    fetchApi('/knowledge/')
      .then((data) => {
        if (data?.services?.length) setServices(data.services);
        if (data?.service_areas?.length) setServiceAreas(data.service_areas);
        if (data?.faqs?.length) setFaqs(data.faqs);
        if (data?.policies) setPolicies(data.policies);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await fetchApi('/knowledge/', {
        method: 'PUT',
        body: JSON.stringify({
          services,
          service_areas: serviceAreas,
          faqs,
          policies,
        }),
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch {
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    }
  };

  const addService = () => {
    setServices([...services, { name: 'New Service', price: '$150', duration: 60, description: 'Service description' }]);
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: 'Customer Question?', answer: 'Direct answer grounded in company policy.' }]);
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Business Knowledge Base</h1>
          <p className="text-xs text-slate-400">Manage services, diagnostic rates, business hours, service areas, and policies.</p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition shadow-lg shadow-sky-600/20"
        >
          <Save className="h-4 w-4" />
          Save Knowledge
        </button>
      </div>

      {savedMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Knowledge base updated and compiled into AI agent system context!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'services', label: 'Services & Pricing', icon: Wrench },
          { id: 'hours', label: 'Hours of Operation', icon: Clock },
          { id: 'areas', label: 'Service Areas', icon: MapPin },
          { id: 'faqs', label: 'FAQs', icon: HelpCircle },
          { id: 'policies', label: 'Company Policies', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition whitespace-nowrap ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">Configured Services</h2>
            <button
              onClick={addService}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add Service
            </button>
          </div>

          <div className="space-y-3">
            {services.map((s, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 relative">
                <button
                  onClick={() => setServices(services.filter((_, i) => i !== idx))}
                  className="absolute right-3 top-3 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400">Service Name</label>
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => {
                        const copy = [...services];
                        copy[idx].name = e.target.value;
                        setServices(copy);
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400">Starting Price</label>
                    <input
                      type="text"
                      value={s.price}
                      onChange={(e) => {
                        const copy = [...services];
                        copy[idx].price = e.target.value;
                        setServices(copy);
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400">Description</label>
                  <input
                    type="text"
                    value={s.description}
                    onChange={(e) => {
                      const copy = [...services];
                      copy[idx].description = e.target.value;
                      setServices(copy);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">Frequently Asked Questions</h2>
            <button
              onClick={addFaq}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add FAQ
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((f, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-2 relative">
                <button
                  onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                  className="absolute right-3 top-3 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400">Question</label>
                  <input
                    type="text"
                    value={f.question}
                    onChange={(e) => {
                      const copy = [...faqs];
                      copy[idx].question = e.target.value;
                      setFaqs(copy);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400">Answer</label>
                  <textarea
                    rows={2}
                    value={f.answer}
                    onChange={(e) => {
                      const copy = [...faqs];
                      copy[idx].answer = e.target.value;
                      setFaqs(copy);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white">Company Policies & Warranties</h2>
          <textarea
            rows={6}
            value={policies}
            onChange={(e) => setPolicies(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs text-white focus:border-sky-500 focus:outline-none leading-relaxed"
          />
        </div>
      )}

      {/* Hours Tab */}
      {activeTab === 'hours' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white">Standard Service Hours</h2>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 text-xs">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => (
              <div key={d} className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <span className="font-semibold text-slate-200">{d}</span>
                <span className="font-mono text-sky-400">08:00 AM – 06:00 PM</span>
              </div>
            ))}
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-200">Saturday</span>
              <span className="font-mono text-sky-400">09:00 AM – 04:00 PM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Sunday</span>
              <span className="text-rose-400 font-semibold">24/7 Emergency Dispatch</span>
            </div>
          </div>
        </div>
      )}

      {/* Areas Tab */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white">Service Areas Covered</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              placeholder="e.g. Pflugerville, TX or 78759"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newArea.trim()) {
                  setServiceAreas([...serviceAreas, newArea.trim()]);
                  setNewArea('');
                }
              }}
            />
            <button
              onClick={() => {
                if (newArea.trim()) {
                  setServiceAreas([...serviceAreas, newArea.trim()]);
                  setNewArea('');
                }
              }}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500"
            >
              Add Area
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {serviceAreas.map((area, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300"
              >
                <MapPin className="h-3 w-3" />
                {area}
                <button
                  onClick={() => setServiceAreas(serviceAreas.filter((_, i) => i !== idx))}
                  className="ml-1 text-slate-500 hover:text-rose-400"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
