'use client';

import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export default function FollowUpsPage() {
  const [stage1Delay, setStage1Delay] = useState('24');
  const [stage1Msg, setStage1Msg] = useState('Hi there! Just checking back from our service team. Did you still want us to get you scheduled for service this week?');

  const [stage2Delay, setStage2Delay] = useState('72');
  const [stage2Msg, setStage2Msg] = useState('Hello! Following up to see if you have any questions or need a quick price estimate on your service request. Let us know how we can help!');

  const [stage3Delay, setStage3Delay] = useState('168');
  const [stage3Msg, setStage3Msg] = useState("Hi! We're closing out this week's inquiries. If you still need assistance, simply reply here and we'll be glad to help.");

  const [quietHoursStart, setQuietHoursStart] = useState('21:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Scheduled Follow-Up Engine</h1>
          <p className="text-xs text-slate-400">Automated multi-stage re-engagement cadences and quiet hours enforcement.</p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition shadow-lg shadow-sky-600/20"
        >
          <Save className="h-4 w-4" />
          Save Cadence Rules
        </button>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Follow-up schedule and stop conditions updated successfully!</span>
        </div>
      )}

      {/* Stop Conditions Guardrails Banner */}
      <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Autonomous Stop Conditions (Active)</span>
        </div>
        <p className="text-xs text-slate-300">
          Follow-up messages are automatically cancelled and discarded whenever:
        </p>
        <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Customer replies or calls back</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Appointment is confirmed on calendar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Lead is marked Won, Lost, or Closed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Customer expresses &quot;stop&quot; or opt-out</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Stage 1 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600/20 text-sky-400 text-xs font-bold font-mono">
                #1
              </div>
              <h2 className="text-sm font-bold text-white">Stage 1 Re-engagement (+24 Hours)</h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Send after:</span>
              <select
                value={stage1Delay}
                onChange={(e) => setStage1Delay(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-white font-mono"
              >
                <option value="12">12 Hours</option>
                <option value="24">24 Hours</option>
                <option value="36">36 Hours</option>
              </select>
            </div>
          </div>
          <textarea
            rows={2}
            value={stage1Msg}
            onChange={(e) => setStage1Msg(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white leading-relaxed focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Stage 2 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600/20 text-sky-400 text-xs font-bold font-mono">
                #2
              </div>
              <h2 className="text-sm font-bold text-white">Stage 2 Follow-Up (+72 Hours)</h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Send after:</span>
              <select
                value={stage2Delay}
                onChange={(e) => setStage2Delay(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-white font-mono"
              >
                <option value="48">48 Hours</option>
                <option value="72">72 Hours (3 Days)</option>
                <option value="96">96 Hours</option>
              </select>
            </div>
          </div>
          <textarea
            rows={2}
            value={stage2Msg}
            onChange={(e) => setStage2Msg(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white leading-relaxed focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Stage 3 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600/20 text-sky-400 text-xs font-bold font-mono">
                #3
              </div>
              <h2 className="text-sm font-bold text-white">Stage 3 Final Check (+7 Days)</h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Send after:</span>
              <select
                value={stage3Delay}
                onChange={(e) => setStage3Delay(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-white font-mono"
              >
                <option value="120">5 Days</option>
                <option value="168">7 Days (1 Week)</option>
                <option value="240">10 Days</option>
              </select>
            </div>
          </div>
          <textarea
            rows={2}
            value={stage3Msg}
            onChange={(e) => setStage3Msg(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white leading-relaxed focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Quiet Hours */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Clock className="h-4 w-4 text-sky-400" />
            <span>Quiet Hours & Communication Windows</span>
          </div>
          <p className="text-xs text-slate-400">
            Messages scheduled during quiet hours are queued and delivered at the start of next morning&apos;s communication window.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Quiet Hours Start</label>
              <input
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Quiet Hours End</label>
              <input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
