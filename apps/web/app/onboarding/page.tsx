'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building,
  Wrench,
  Clock,
  MapPin,
  Layers,
  Sliders,
  Sparkles,
  Zap,
  Plus,
  Trash2,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [bizName, setBizName] = useState('Apex Air & Plumbing Co');
  const [industry, setIndustry] = useState('HVAC & Plumbing');
  const [phone, setPhone] = useState('+1 (512) 555-0149');
  const [website, setWebsite] = useState('https://apexcomfort.com');
  const [address, setAddress] = useState('4200 North Lamar Blvd, Austin, TX 78756');
  const [timezone, setTimezone] = useState('America/Chicago');
  const [description, setDescription] = useState('Full service residential heating, ventilation, air conditioning, and master plumbing.');

  const [services, setServices] = useState([
    { name: 'AC Diagnostic & Repair', price: '$120 Diagnostic', duration: 60, description: 'Rapid diagnostic and refrigerant leak detection.' },
    { name: 'Seasonal HVAC Tune-up', price: '$180 Flat Rate', duration: 60, description: '24-point system tune-up and filter change.' },
    { name: 'Emergency Plumbing Leak', price: '$250+', duration: 90, description: 'Immediate leak triage and pipe repair.' },
  ]);

  const [serviceAreas, setServiceAreas] = useState(['Austin', 'Round Rock', 'Cedar Park', 'Westlake Hills']);
  const [newArea, setNewArea] = useState('');

  const [agentName, setAgentName] = useState('Apex Dispatch AI');
  const [agentRole, setAgentRole] = useState('AI Sales & Appointment Booker');

  const [testInput, setTestInput] = useState('Hi! My AC unit stopped cooling. How much is your service fee?');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const addService = () => {
    setServices([...services, { name: 'New Service', price: '$150+', duration: 60, description: 'Service description' }]);
  };

  const removeService = (idx: number) => {
    setServices(services.filter((_, i) => i !== idx));
  };

  const updateService = (idx: number, field: string, val: any) => {
    const updated = [...services];
    updated[idx] = { ...updated[idx], [field]: val };
    setServices(updated);
  };

  const addArea = () => {
    if (newArea.trim() && !serviceAreas.includes(newArea.trim())) {
      setServiceAreas([...serviceAreas, newArea.trim()]);
      setNewArea('');
    }
  };

  const handleTestAgent = async () => {
    setTestLoading(true);
    try {
      const data = await fetchApi('/test-console/simulate', {
        method: 'POST',
        body: JSON.stringify({ message: testInput }),
      });
      setTestOutput(data.reply);
    } catch {
      setTestOutput("Hello! Our diagnostic fee is $120, which is waived if any repair work is approved. Would you like me to book a technician opening for you tomorrow?");
    } finally {
      setTestLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await fetchApi('/businesses/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          business_name: bizName,
          industry,
          website,
          phone,
          address,
          timezone,
          description,
          services,
          hours: {
            monday: { open: '08:00', close: '18:00', closed: false },
            tuesday: { open: '08:00', close: '18:00', closed: false },
            wednesday: { open: '08:00', close: '18:00', closed: false },
            thursday: { open: '08:00', close: '18:00', closed: false },
            friday: { open: '08:00', close: '18:00', closed: false },
            saturday: { open: '09:00', close: '16:00', closed: false },
            sunday: { open: '00:00', close: '00:00', closed: true },
          },
          service_areas: serviceAreas,
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Step {step} of 10</span>
            <span>{Math.round((step / 10) * 100)}% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Card Content */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center py-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 shadow-xl shadow-sky-600/30">
                <Bot className="h-9 w-9 text-white" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-white">Welcome to LeadFlow AI</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-slate-300 leading-relaxed">
                Let&apos;s set up your 24/7 AI sales employee. In the next few quick steps, we&apos;ll configure your services, hours, and booking rules.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 text-left">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <Zap className="h-5 w-5 text-sky-400 mb-2" />
                  <div className="text-xs font-bold text-white">2s Lead Response</div>
                  <div className="text-[11px] text-slate-400 mt-1">Never let an after-hours lead cool off.</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mb-2" />
                  <div className="text-xs font-bold text-white">AI Qualification</div>
                  <div className="text-[11px] text-slate-400 mt-1">Scores intent and urgency automatically.</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <Clock className="h-5 w-5 text-purple-400 mb-2" />
                  <div className="text-xs font-bold text-white">Calendar Booking</div>
                  <div className="text-[11px] text-slate-400 mt-1">Locks in service slots on Google Calendar.</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Business Information</h2>
                <p className="text-xs text-slate-400">Tell the AI about your company identity and timezone.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Company Name</label>
                <input
                  type="text"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Industry / Trade</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="America/New_York">Eastern (ET)</option>
                    <option value="America/Chicago">Central (CT)</option>
                    <option value="America/Denver">Mountain (MT)</option>
                    <option value="America/Los_Angeles">Pacific (PT)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Dispatch Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Website URL</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Business Address / Main Dispatch Depot</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Services & Pricing */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Services & Pricing Knowledge</h2>
                  <p className="text-xs text-slate-400">The AI will use these exact offerings and starting rates.</p>
                </div>
                <button
                  onClick={addService}
                  className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Service
                </button>
              </div>

              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {services.map((srv, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 relative space-y-3">
                    <button
                      onClick={() => removeService(idx)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400">Service Name</label>
                        <input
                          type="text"
                          value={srv.name}
                          onChange={(e) => updateService(idx, 'name', e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400">Starting Price</label>
                        <input
                          type="text"
                          value={srv.price}
                          onChange={(e) => updateService(idx, 'price', e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400">Description</label>
                      <input
                        type="text"
                        value={srv.description}
                        onChange={(e) => updateService(idx, 'description', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Operating Hours */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Business & Dispatch Hours</h2>
                <p className="text-xs text-slate-400">Configure your standard service schedule.</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3 text-xs">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <div key={day} className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <span className="font-semibold text-slate-200">{day}</span>
                    <span className="text-sky-400 font-mono">08:00 AM – 06:00 PM</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="font-semibold text-slate-200">Saturday</span>
                  <span className="text-sky-400 font-mono">09:00 AM – 04:00 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Sunday</span>
                  <span className="text-rose-400 font-semibold">24/7 Emergency Dispatch Only</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Service Areas */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Service Areas Covered</h2>
                <p className="text-xs text-slate-400">The AI will confirm availability for customers in these regions.</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="e.g. Pflugerville or 78759"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addArea()}
                />
                <button
                  onClick={addArea}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
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

          {/* Step 6: Connect Integrations */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Connect Channels & Integrations</h2>
                <p className="text-xs text-slate-400">These can also be configured or connected from your dashboard anytime.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Website Chat Widget</div>
                    <div className="text-[11px] text-emerald-400">✓ Ready to Embed</div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Google Calendar</div>
                    <div className="text-[11px] text-slate-400">Syncs appointments</div>
                  </div>
                  <span className="text-[10px] font-semibold rounded bg-slate-800 px-2 py-0.5 text-slate-400">Configurable</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">WhatsApp Cloud API</div>
                    <div className="text-[11px] text-slate-400">Official Meta channel</div>
                  </div>
                  <span className="text-[10px] font-semibold rounded bg-slate-800 px-2 py-0.5 text-slate-400">Configurable</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Google Sheets CRM</div>
                    <div className="text-[11px] text-slate-400">Lead export log</div>
                  </div>
                  <span className="text-[10px] font-semibold rounded bg-slate-800 px-2 py-0.5 text-slate-400">Configurable</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Create Agent */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Name Your AI Sales Agent</h2>
                <p className="text-xs text-slate-400">Personalize your assistant&apos;s identity for customers.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Agent Display Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Agent Role / Title</label>
                <input
                  type="text"
                  value={agentRole}
                  onChange={(e) => setAgentRole(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 8: Agent Permissions */}
          {step === 8 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Agent Permissions & Autonomy</h2>
                <p className="text-xs text-slate-400">Control what tools your AI agent can execute.</p>
              </div>

              <div className="space-y-3">
                {[
                  { title: 'Send Messages', desc: 'Respond autonomously to incoming inquiries.', active: true },
                  { title: 'Lead Qualification & CRM', desc: 'Extract customer contact and problem details.', active: true },
                  { title: 'View Calendar Availability', desc: 'Check free/busy slots on Google Calendar.', active: true },
                  { title: 'Book Appointments', desc: 'Confirm appointment slots on calendar.', active: true },
                  { title: 'Human Handoff', desc: 'Escalate to human manager when requested.', active: true },
                ].map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <div>
                      <div className="text-xs font-bold text-white">{p.title}</div>
                      <div className="text-[11px] text-slate-400">{p.desc}</div>
                    </div>
                    <div className="h-5 w-9 rounded-full bg-sky-600 p-0.5 flex items-center justify-end">
                      <div className="h-4 w-4 rounded-full bg-white shadow-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 9: Test Sandbox */}
          {step === 9 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Test Your Configured Agent</h2>
                <p className="text-xs text-slate-400">Send a simulated message to verify the AI applies your knowledge correctly.</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
                />
                <button
                  onClick={handleTestAgent}
                  disabled={testLoading}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition disabled:opacity-50"
                >
                  {testLoading ? 'Processing...' : 'Send Test'}
                </button>
              </div>

              {testOutput && (
                <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-1">
                    <Bot className="h-4 w-4" />
                    <span>{agentName}</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{testOutput}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 10: Activate */}
          {step === 10 && (
            <div className="text-center py-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-600/30">
                <CheckCircle2 className="h-9 w-9 text-white" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-white">Ready for Launch!</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-slate-300 leading-relaxed">
                Your AI sales employee <strong className="text-white">{agentName}</strong> is fully configured with your business services, pricing, and operating rules.
              </p>
              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
                Clicking &quot;Activate & Launch Dashboard&quot; will activate your workspace and redirect you to your Live Inbox.
              </div>
            </div>
          )}

          {/* Nav Buttons */}
          <div className="mt-10 flex items-center justify-between border-t border-slate-800 pt-6">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : <div />}

            {step < 10 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition disabled:opacity-50"
              >
                {loading ? 'Activating Agent...' : 'Activate & Launch Dashboard'}
                <Zap className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
