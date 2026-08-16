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
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          notes: 'Outdoor fan motor check and capacitor testing',
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
        { slot_id: '1', label: 'Tomorrow - 10:00 AM' },
        { slot_id: '2', label: 'Tomorrow - 02:00 PM' },
        { slot_id: '3', label: 'Day after Tomorrow - 09:00 AM' },
      ]);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Appointments & Dispatch Calendar</h1>
          <p className="text-xs text-slate-400">Autonomous calendar bookings synchronized with Google Calendar.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadAppointments(); loadAvailability(); }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Calendar
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Appointments List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirmed Service Visits</h2>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-xs text-slate-500">
              Loading calendar bookings...
            </div>
          ) : appointments.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-xs text-slate-500">
              No appointments scheduled yet. The AI automatically schedules appointments when leads agree to a slot.
            </div>
          ) : (
            appointments.map((appt) => (
              <div
                key={appt.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 flex-shrink-0">
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
                      <span>{appt.customer_contact || 'No phone'}</span>
                    </div>
                    {appt.notes && (
                      <div className="text-[11px] text-slate-400 italic mt-1">&quot;{appt.notes}&quot;</div>
                    )}
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 space-y-1 flex-shrink-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 sm:justify-end">
                    <Clock className="h-3.5 w-3.5 text-sky-400" />
                    <span>{new Date(appt.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Live Open Slots Preview (1 Col) */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Real-Time Open Slots</h2>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="text-xs text-slate-300">
              The AI agent offers these real-time openings when customers request scheduling:
            </div>
            <div className="space-y-2 pt-2">
              {availableSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between text-xs text-slate-300"
                >
                  <span className="font-semibold text-white">{slot.label || slot.display}</span>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">Available</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
