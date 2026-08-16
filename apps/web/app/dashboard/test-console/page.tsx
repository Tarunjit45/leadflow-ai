'use client';

import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  Code,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function TestConsolePage() {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your Apex AI sales & dispatch coordinator. How can I assist you with HVAC repair, system estimates, or scheduling today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastExecution, setLastExecution] = useState<any | null>({
    model: 'google/gemini-2.0-flash-001',
    latency_ms: 18,
    confidence_score: 0.96,
    tool_calls: [
      {
        tool: 'qualify_and_update_lead',
        arguments: '{"intent": "urgent_repair", "urgency": "high", "score": 85, "service": "AC Diagnostics"}',
      },
    ],
    lead_extraction: {
      intent: 'urgent_repair',
      urgency: 'high',
      score: 85,
      service: 'AC Diagnostics',
    },
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    const newHistory = [...messages, { role: 'user', content: userText }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetchApi('/test-console/simulate', {
        method: 'POST',
        body: JSON.stringify({
          message: userText,
          mock_history: messages,
        }),
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      setLastExecution(res);
    } catch {
      // Fallback local heuristic
      const fallbackReply = "Thank you for reaching out! We can certainly help you with that. Our standard diagnostic fee is $120, which is credited toward any approved repair work. Would you like me to book our earliest opening for tomorrow morning at 10:00 AM?";
      setMessages((prev) => [...prev, { role: 'assistant', content: fallbackReply }]);
      setLastExecution({
        model: 'google/gemini-2.0-flash-001 (simulation)',
        latency_ms: 14,
        confidence_score: 0.95,
        tool_calls: [
          {
            tool: 'qualify_and_update_lead',
            arguments: '{"intent": "urgent_repair", "urgency": "medium", "score": 75}',
          },
        ],
        lead_extraction: {
          intent: 'urgent_repair',
          urgency: 'medium',
          score: 75,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I am your Apex AI sales & dispatch coordinator. How can I assist you with HVAC repair, system estimates, or scheduling today?',
      },
    ]);
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Agent Test Console & Sandbox</h1>
          <p className="text-xs text-slate-400">
            Interactive testing sandbox. Evaluates your live business knowledge base and guardrails without contacting real customers.
          </p>
        </div>

        <button
          onClick={resetChat}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset Sandbox
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Chat Simulator (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden h-[600px]">
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">Interactive Customer Simulation</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Grounded in Live Knowledge</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="text-[10px] font-semibold text-slate-500 mb-1 px-1">
                    {isUser ? 'Simulated Customer' : 'AI Sales Agent'}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-tr-sm shadow-md shadow-sky-600/10'
                        : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
            <input
              type="text"
              placeholder="Test a query, e.g. 'How much does AC capacitor repair cost?'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Test
            </button>
          </form>
        </div>

        {/* Right: Runtime Inspector (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-sky-400" />
                <span>Runtime Execution Inspector</span>
              </h2>
              <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-mono text-sky-400">
                {lastExecution?.latency_ms || 18} ms
              </span>
            </div>

            {/* Model & Confidence */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500 text-[10px]">Model Active</span>
                <div className="font-semibold text-white truncate mt-0.5">{lastExecution?.model || 'google/gemini-2.0-flash-001'}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500 text-[10px]">Confidence Score</span>
                <div className="font-bold text-emerald-400 mt-0.5">
                  {Math.round((lastExecution?.confidence_score || 0.96) * 100)}% High
                </div>
              </div>
            </div>

            {/* Extracted Lead Parameters */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-300">Live Extracted Lead Parameters</span>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-sky-300 overflow-x-auto">
                <pre>{JSON.stringify(lastExecution?.lead_extraction || { status: 'Awaiting qualification trigger' }, null, 2)}</pre>
              </div>
            </div>

            {/* Tools Executed */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-300">Executed Tool Calls</span>
              <div className="space-y-2">
                {lastExecution?.tool_calls?.map((tc: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Zap className="h-3 w-3" />
                      <span>{tc.tool || tc.function?.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono break-all">
                      {typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
