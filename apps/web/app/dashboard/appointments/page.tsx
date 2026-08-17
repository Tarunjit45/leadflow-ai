'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Plus,
  RefreshCw,
  CalendarCheck,
  ExternalLink,
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
      setAppointments(data);
    } catch {
      // Demo fallback
      setAppointments([
        {
          id: 'appt_1',
          customer_name: 'Sarah Jenkins',
          customer_contact: '+1 (512) 555-9821',
          service: 'AC Emergency Repair',
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 90000000).toISOString(),
          status: 'confirmed',
          notes: 'Customer reported humming fan noise in outdoor condenser unit.',
        },
        {
          id: 'appt_2',
          customer_name: 'Michael Chang',
          customer_contact: '+1 (512) 555-8820',
          service: 'Seasonal HVAC Tune-up',
          start_time: new Date(Date.now() + 172800000).toISOString(),
          end_time: new Date(Date.now() + 176400000).toISOString(),
          status: 'confirmed',
          notes: '24-point check and new filter change.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const data = await fetchApi('/appointments/availability?days_ahead=3');
      setAvailableSlots(data.available_slots || []);
    } catch {
      setAvailableSlots([
        { slot_id: '1', label: 'Tomorrow - 09:00 AM' },
        { slot_id: '2', label: 'Tomorrow - 10:00 AM' },
        { slot_id: '3', label: 'Tomorrow - 02:00 PM' },
        { slot_id: '4', label: 'Day after Tomorrow - 11:00 AM' },
      ]);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Appointments</h1>
          <p className="text-xs text-slate-400">
            Confirmed service visits booked automatically by your AI employee and synced with Google Calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Google Calendar Synced</span>
          </div>

          <button
            onClick={() => {
              loadAppointments();
              loadAvailability();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setTab('upcoming')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === 'upcoming'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Upcoming Bookings ({appointments.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === 'past'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Past Bookings
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Appointments List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center text-xs text-slate-500">
              Loading calendar bookings...
            </div>
          ) : appointments.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center space-y-3">
              <CalendarCheck className="h-10 w-10 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-white">No upcoming appointments scheduled yet</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When incoming customers choose a time slot on WhatsApp or your website, their appointment appears here instantly.
              </p>
            </div>
          ) : (
            appointments.map((appt) => (
              <div
                key={appt.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 flex-shrink-0">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{appt.customer_name}</span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 capitalize">
                        {appt.status}
                      </span>
                    </div>
                    <div className="text-xs text-sky-300 font-semibold">{appt.service}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-500" />
                      <span>{appt.customer_contact || 'No phone provided'}</span>
                    </div>
                    {appt.notes && (
                      <div className="text-[11px] text-slate-400 italic mt-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        &quot;{appt.notes}&quot;
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 space-y-1 flex-shrink-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 sm:justify-end">
                    <Clock className="h-3.5 w-3.5 text-sky-400" />
                    <span>
                      {new Date(appt.start_time).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-sky-400 font-semibold">
                    {new Date(appt.start_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="text-[10px] text-emerald-400">✓ On Google Calendar</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Real-time Open Slots Info (1 Col) */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Open Booking Slots Offered by AI
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              When customers ask for an appointment, your AI employee automatically suggests these available times based on your calendar:
            </p>

            <div className="space-y-2 pt-1">
              {availableSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-white">{slot.label || slot.display}</span>
                  <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Open Slot
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              Times automatically update as new events are added to your Google Calendar.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
