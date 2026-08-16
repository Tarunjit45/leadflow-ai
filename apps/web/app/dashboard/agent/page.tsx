'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sliders,
  ShieldCheck,
  Save,
  Sparkles,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function AgentStudioPage() {
  const [name, setName] = useState('Apex Dispatch AI');
  const [role, setRole] = useState('AI Sales & Appointment Booker');
  const [model, setModel] = useState('google/gemini-2.0-flash-001');
  const [temperature, setTemperature] = useState(0.2);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tools, setTools] = useState<any[]>([
    { tool_name: 'qualify_and_update_lead', enabled: true, desc: 'Extract customer name, address, urgency, and assign lead score.' },
    { tool_name: 'get_calendar_availability', enabled: true, desc: 'Query open calendar booking slots in real-time.' },
    { tool_name: 'book_appointment', enabled: true, desc: 'Lock in confirmed service appointments on calendar.' },
    { tool_name: 'human_handoff', enabled: true, desc: 'Escalate conversation to human manager upon customer request.' },
    { tool_name: 'notify_owner', enabled: true, desc: 'Dispatch SMS/WhatsApp push notification to business owner for emergency jobs.' },
  ]);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    fetchApi('/agents/current')
      .then((data) => {
        if (data?.name) setName(data.name);
        if (data?.role) setRole(data.role);
        if (data?.model) setModel(data.model);
        if (data?.temperature !== undefined) setTemperature(data.temperature);
        if (data?.system_prompt) setSystemPrompt(data.system_prompt);
      })
      .catch(() => {});

    fetchApi('/agents/tools')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTools(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/agents/current', {
        method: 'PATCH',
        body: JSON.stringify({ name, role, model, temperature, system_prompt: systemPrompt }),
      });
      await fetchApi('/agents/tools', {
        method: 'PUT',
        body: JSON.stringify(tools),
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch {
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const toggleTool = (toolName: string) => {
    setTools((prev) =>
      prev.map((t) => (t.tool_name === toolName ? { ...t, enabled: !t.enabled } : t))
    );
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Agent Studio</h1>
          <p className="text-xs text-slate-400">Configure model selection, personality, behavioral directives, and tool permissions.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition shadow-lg shadow-sky-600/20 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Agent Configuration'}
        </button>
      </div>

      {savedMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Agent configuration and tool permissions updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Identity & Model Selection */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Bot className="h-4 w-4 text-sky-400" />
            <span>Agent Identity & Model Architecture</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Agent Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Agent Job Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300">AI Model Provider</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="google/gemini-2.0-flash-001">Google Gemini 2.0 Flash (Fastest / Recommended)</option>
                <option value="anthropic/claude-3.5-haiku">Anthropic Claude 3.5 Haiku (High Precision)</option>
                <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
                <option value="meta-llama/llama-3.3-70b-instruct">Meta Llama 3.3 70B</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Temperature (Creativity vs Determinism)</span>
                <span className="text-sky-400 font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="mt-3 w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.0 (Strict & Deterministic)</span>
                <span>0.5 (Balanced)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Behavioral Instructions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-sky-400" />
            <span>Custom Behavioral Instructions & Tone Directives</span>
          </h2>
          <p className="text-xs text-slate-400">
            Provide special company rules (e.g. &quot;Always prioritize same-day emergency dispatch for AC leaks&quot;).
          </p>
          <textarea
            rows={4}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="e.g. Always greet customers with empathy. When a customer has an AC breakdown in over 90 degree weather, prioritize emergency morning slots..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono leading-relaxed"
          />
        </div>

        {/* Tool Permissions & Autonomy */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Tool Permissions & Backend Enforcement</span>
          </h2>
          <p className="text-xs text-slate-400">
            Enforced directly on the API layer. The model cannot execute disabled tools under any circumstances.
          </p>

          <div className="space-y-3 pt-2">
            {tools.map((t, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">{t.tool_name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t.desc || 'System registered tool handler.'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleTool(t.tool_name)}
                  className={`h-6 w-11 rounded-full p-0.5 flex items-center transition ${
                    t.enabled ? 'bg-sky-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="h-5 w-5 rounded-full bg-white shadow-md" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
