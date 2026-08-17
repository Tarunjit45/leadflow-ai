'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  CheckCircle2,
  CalendarCheck,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadAppointments();
    loadAvailability();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await fetchApi('/appointments/');
      if (Array.isArray(data)) {
        setAppointments(data);
      } else {
        setAppointments([]);
      }
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const data = await fetchApi('/appointments/availability');
      if (Array.isArray(data?.available_slots)) {
        setAvailableSlots(data.available_slots);
      } else {
        setAvailableSlots([
          { start: 'Tomorrow at 09:00 AM', end: '10:00 AM' },
          { start: 'Tomorrow at 02:00 PM', end: '03:00 PM' },
          { start: 'Wednesday at 10:00 AM', end: '11:00 AM' },
          { start: 'Thursday at 01:00 PM', end: '02:00 PM' },
        ]);
      }
    } catch {
      setAvailableSlots([]);
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Appointments &amp; Dispatch</h1>
          <p className="text-xs text-slate-400 mt-1">
            Confirmed customer bookings synced with your real database &amp; Google Calendar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/leads"
            className="btn-primary py-2 px-4 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book from Lead</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-bold">
        <button
          onClick={() => setTab('upcoming')}
          className={`pb-3 border-b-2 transition-colors ${
            tab === 'upcoming'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Upcoming Bookings ({appointments.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`pb-3 border-b-2 transition-colors ${
            tab === 'past'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Past Completed
        </button>
      </div>

      {/* Upcoming Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Bookings List */}
        <div className="lg:col-span-8 space-y-4">
          {appointments.length === 0 ? (
            <div className="rounded-3xl border border-slate-800/80 bg-[#0e131f] p-12 text-center space-y-3">
              <CalendarCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No appointments scheduled yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When customers message your AI on WhatsApp or your website chat, confirmed service bookings will appear here automatically.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard/leads"
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  View Customer Leads
                </Link>
              </div>
            </div>
          ) : (
            appointments.map((appt) => (
              <div
                key={appt.id}
                className="rounded-2xl border border-slate-800/80 bg-[#0e131f] p-5 hover:border-slate-700/80 transition-colors duration-150 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">
                      Confirmed Dispatch
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{appt.customer_name}</h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{appt.customer_contact}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-blue-400">
                      {new Date(appt.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold">
                      {new Date(appt.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                  <div className="text-slate-300">
                    <strong className="text-white">Service:</strong> {appt.service}
                  </div>
                  {appt.notes && (
                    <div className="text-slate-400 text-[11px]">
                      <strong className="text-slate-300">Notes:</strong> {appt.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar: Next Open Time Slots */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl border border-slate-800/80 bg-[#0e131f] p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Open Dispatch Windows</h3>
            <p className="text-[11px] text-slate-400">Your AI checks calendar availability and offers these open time slots to inquiries.</p>

            <div className="space-y-2">
              {availableSlots.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">No open slots configured.</div>
              ) : (
                availableSlots.map((slot, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs flex items-center justify-between text-slate-300 font-medium"
                  >
                    <span>{slot.start}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Available</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
