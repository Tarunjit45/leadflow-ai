'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function LeadsCrmPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadLeads();
  }, [statusFilter]);

  const loadLeads = async () => {
    try {
      const data = await fetchApi(`/leads/?status=${statusFilter}`);
      setLeads(data);
    } catch {
      // Demo mock fallback
      setLeads([
        {
          id: 'lead_demo_1',
          name: 'Sarah Jenkins',
          phone: '+1 (512) 555-9821',
          email: 'sarah.jenkins@gmail.com',
          service: 'AC Emergency Repair',
          problem: 'Outdoor condenser making humming sound, blowing warm air.',
          score: 95,
          status: 'booked',
          intent: 'urgent_repair',
          urgency: 'emergency',
          source: 'whatsapp',
          estimated_value: 850.0,
          created_at: new Date().toISOString(),
        },
        {
          id: 'lead_demo_2',
          name: 'Robert Miller',
          phone: '+1 (512) 555-4412',
          email: 'rmiller@austinlaw.com',
          service: 'Tankless Water Heater Installation',
          problem: 'Replacing 15-yr tank with Navien tankless system.',
          score: 75,
          status: 'human_review',
          intent: 'estimate',
          urgency: 'medium',
          source: 'website_chat',
          estimated_value: 3200.0,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'lead_demo_3',
          name: 'Elena Vance',
          phone: '+1 (512) 555-7731',
          service: 'Seasonal HVAC Tune-up',
          problem: 'Annual maintenance check.',
          score: 55,
          status: 'nurturing',
          intent: 'maintenance',
          urgency: 'low',
          source: 'whatsapp',
          estimated_value: 189.0,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.phone?.toLowerCase().includes(q) ||
      l.service?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leads & Pipeline CRM</h1>
          <p className="text-xs text-slate-400">Autonomous qualification, lead scoring, and customer contact records.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('New manual lead creation dialog')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition shadow-lg shadow-sky-600/20"
          >
            <Plus className="h-4 w-4" />
            Add Manual Lead
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search leads by name, phone, service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-semibold">
          {['all', 'booked', 'qualified', 'human_review', 'nurturing'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 capitalize transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Service Requested</th>
              <th className="p-4">Intent & Urgency</th>
              <th className="p-4">Lead Score</th>
              <th className="p-4">Status</th>
              <th className="p-4">Est. Value</th>
              <th className="p-4">Source</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">Loading leads...</td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">No leads match the selected criteria.</td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-900 transition">
                  <td className="p-4">
                    <div className="font-bold text-white">{lead.name || 'Anonymous Lead'}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{lead.phone || 'No phone'}</span>
                      {lead.email && <span>• {lead.email}</span>}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-200">{lead.service || 'Diagnostic'}</td>
                  <td className="p-4">
                    <div className="font-semibold capitalize text-slate-200">{lead.intent?.replace('_', ' ')}</div>
                    <div className="text-[10px] text-slate-500 capitalize">Urgency: {lead.urgency}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        lead.score >= 70
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : lead.score >= 40
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {lead.score} / 100
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                        lead.status === 'booked'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : lead.status === 'human_review'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {lead.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white">${lead.estimated_value || 850}</td>
                  <td className="p-4 text-slate-400 capitalize">{lead.source?.replace('_', ' ')}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over / Modal Lead Detail */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedLead.name}</h3>
                <div className="text-xs text-slate-400">Lead ID: {selectedLead.id}</div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Contact Phone:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedLead.phone || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedLead.email || 'N/A'}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-500">Service Category:</span>
                <div className="font-semibold text-sky-300 mt-0.5">{selectedLead.service}</div>
              </div>

              <div>
                <span className="text-slate-500">Reported Problem:</span>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-slate-200 mt-1 leading-relaxed">
                  {selectedLead.problem || 'No description provided.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-slate-500">Lead Score:</span>
                  <div className="font-bold text-emerald-400 text-sm mt-0.5">{selectedLead.score} / 100</div>
                </div>
                <div>
                  <span className="text-slate-500">Estimated Value:</span>
                  <div className="font-bold text-white text-sm mt-0.5">${selectedLead.estimated_value || 850}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
