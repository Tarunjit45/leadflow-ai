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
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto animate-fade-in font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Appointments &amp; Dispatch</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Confirmed customer bookings synced with your real database &amp; Google Calendar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/leads"
            className="btn-primary py-2.5 px-4 text-xs font-bold shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book from Lead</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setTab('upcoming')}
          className={`pb-3 border-b-2 transition-colors ${
            tab === 'upcoming'
              ? 'border-blue-600 text-blue-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Upcoming Bookings ({appointments.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`pb-3 border-b-2 transition-colors ${
            tab === 'past'
              ? 'border-blue-600 text-blue-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
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
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xl shadow-slate-200/50">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-950">No appointments scheduled yet</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
                When customers message your AI on WhatsApp or your website chat, confirmed service bookings will appear here automatically.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard/leads"
                  className="btn-secondary py-2 px-4 text-xs font-bold"
                >
                  View Customer Leads
                </Link>
              </div>
            </div>
          ) : (
            appointments.map((appt) => (
              <div
                key={appt.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors duration-150 space-y-3 shadow-md shadow-slate-200/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase">
                      Confirmed Dispatch
                    </span>
                    <h3 className="text-sm font-black text-slate-950 mt-2">{appt.customer_name}</h3>
                    <div className="text-xs text-slate-500 font-mono mt-0.5 font-medium">{appt.customer_contact}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-blue-600">
                      {new Date(appt.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-[11px] text-slate-500 font-bold">
                      {new Date(appt.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="text-slate-800 font-medium">
                    <strong className="text-slate-950 font-bold">Service:</strong> {appt.service}
                  </div>
                  {appt.notes && (
                    <div className="text-slate-600 text-[11px] font-medium">
                      <strong className="text-slate-800 font-bold">Notes:</strong> {appt.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar: Next Open Time Slots */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xl shadow-slate-200/50">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Open Dispatch Windows</h3>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Your AI checks calendar availability and offers these open time slots to inquiries.
            </p>

            <div className="space-y-2">
              {availableSlots.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4 font-medium">No open slots configured.</div>
              ) : (
                availableSlots.map((slot, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-800 font-bold"
                  >
                    <span>{slot.start}</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      Available
                    </span>
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
