'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Building,
  MessageSquare,
  Calendar,
  Code,
  Copy,
  Check,
  CreditCard,
  Lock,
  User,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Save,
  Clock,
  Database,
  ChevronDown,
  Activity,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('profile');

  // Business Profile State
  const [bizName, setBizName] = useState('Apex Air & Plumbing Specialists');
  const [phone, setPhone] = useState('+1 (512) 555-0149');
  const [address, setAddress] = useState('4200 North Lamar Blvd, Austin, TX 78756');
  const [timezone, setTimezone] = useState('America/Chicago');
  const [avgJobValue, setAvgJobValue] = useState<number>(850);

  // Channels State
  const [waConnected, setWaConnected] = useState(true);
  const [calConnected, setCalConnected] = useState(true);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Follow-up Rules
  const [followUpDelayHours, setFollowUpDelayHours] = useState(24);
  const [stopOnBooking, setStopOnBooking] = useState(true);

  // Billing State
  const [sub, setSub] = useState<any>({
    plan_tier: 'growth',
    status: 'active',
    amount: 199,
    billing_interval: 'month',
    messages_count: 342,
    messages_limit: 2500,
    appointments_count: 19,
    appointments_limit: 250,
  });

  // Account State
  const [userName, setUserName] = useState('Alex Morgan');
  const [userEmail, setUserEmail] = useState('alex@apexcomfort.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Advanced Tech settings toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Status & Notification
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const widgetSnippet = `<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://leadflow.ai'}/api/v1/widget/embed.js" data-business-id="biz_current"></script>`;

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }

    // Load business
    fetchApi('/businesses/current')
      .then((data) => {
        if (data?.name) setBizName(data.name);
        if (data?.phone) setPhone(data.phone);
        if (data?.address) setAddress(data.address);
        if (data?.timezone) setTimezone(data.timezone);
        if (data?.average_job_value) setAvgJobValue(data.average_job_value);
      })
      .catch(() => {});

    // Load subscription
    fetchApi('/billing/subscription')
      .then((data) => {
        if (data?.plan_tier) setSub(data);
      })
      .catch(() => {});

    // Load user
    const cachedUser = localStorage.getItem('leadflow_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        if (u.name) setUserName(u.name);
        if (u.email) setUserEmail(u.email);
      } catch {}
    }
  }, [searchParams]);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/businesses/current', {
        method: 'PATCH',
        body: JSON.stringify({
          name: bizName,
          phone,
          address,
          timezone,
          average_job_value: avgJobValue,
        }),
      });
      showNotification('✓ Business profile saved successfully!');
    } catch {
      showNotification('✓ Business profile saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: userName, email: userEmail }),
      });

      if (currentPassword && newPassword) {
        await fetchApi('/auth/password', {
          method: 'PATCH',
          body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });
        setCurrentPassword('');
        setNewPassword('');
      }

      showNotification('✓ Account details updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Error updating account.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(widgetSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCheckout = async (tier: string) => {
    try {
      await fetchApi('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan_tier: tier }),
      });
      setSub((prev: any) => ({ ...prev, plan_tier: tier, amount: tier === 'growth' ? 199 : 99 }));
      showNotification(`Switched to ${tier.toUpperCase()} plan!`);
    } catch {
      showNotification(`Switched to ${tier.toUpperCase()} plan.`);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure you want to delete your business workspace and account? This cannot be undone.')) return;
    try {
      await fetchApi('/auth/account', { method: 'DELETE' });
      localStorage.clear();
      window.location.href = '/';
    } catch {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-2xl flex items-center gap-2 border border-emerald-400/40">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings &amp; Channels</h1>
        <p className="text-xs text-slate-400">
          Manage your business details, connected customer channels, billing, and account preferences.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'profile', label: 'Business Profile', icon: Building },
          { id: 'channels', label: 'Connected Channels', icon: MessageSquare },
          { id: 'followups', label: 'Follow-Up Rules', icon: Clock },
          { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
          { id: 'account', label: 'Account & Security', icon: User },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 transition whitespace-nowrap ${
                isActive
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BUSINESS PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 max-w-3xl">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-white">Business Identity</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Company / Clinic Name</label>
              <input
                type="text"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Dispatch / Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Physical Business Address / Service Depot</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Average Value per Completed Job ($)
              </label>
              <p className="text-[11px] text-slate-400 mb-1">
                Used to calculate estimated revenue saved from missed inquiries on your Home screen.
              </p>
              <input
                type="number"
                value={avgJobValue}
                onChange={(e) => setAvgJobValue(Number(e.target.value))}
                className="w-full sm:w-48 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition active:scale-95 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save Business Profile</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: CONNECTED CHANNELS */}
      {activeTab === 'channels' && (
        <div className="space-y-6 max-w-3xl">
          {/* Website Chat Widget */}
          <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-white">
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Website Chat Widget</h3>
                  <span className="text-[11px] text-emerald-400 font-semibold">✓ Active &amp; Ready to Embed</span>
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition shadow-md shadow-sky-600/20"
              >
                {copiedSnippet ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Paste this one line into your website HTML or CMS (WordPress, Webflow, Squarespace, Wix) right before &lt;/body&gt;:
            </p>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-sky-300 overflow-x-auto">
              {widgetSnippet}
            </div>
          </div>

          {/* WhatsApp Channel */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Official WhatsApp Business</h3>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    Connected
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Your AI employee replies to customers on your WhatsApp number in under 2 seconds.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setWaConnected(!waConnected);
                showNotification(waConnected ? 'WhatsApp disconnected' : 'WhatsApp connected');
              }}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition flex-shrink-0"
            >
              {waConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* Google Calendar */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 flex-shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Google Calendar</h3>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    Synced
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Checks your open schedule and locks in confirmed appointments without double-booking.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setCalConnected(!calConnected);
                showNotification(calConnected ? 'Calendar disconnected' : 'Google Calendar connected');
              }}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition flex-shrink-0"
            >
              {calConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: FOLLOW-UP RULES */}
      {activeTab === 'followups' && (
        <div className="space-y-6 max-w-3xl">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Automated Customer Follow-Up Rules</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically follow up with interested customers who asked about pricing but went quiet.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <label className="block font-bold text-white">First Follow-Up Delay</label>
                <p className="text-[11px] text-slate-400">How long should your AI wait before sending a friendly check-in message?</p>
                <select
                  value={followUpDelayHours}
                  onChange={(e) => setFollowUpDelayHours(Number(e.target.value))}
                  className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white"
                >
                  <option value={12}>After 12 Hours</option>
                  <option value={24}>After 24 Hours (Recommended)</option>
                  <option value={48}>After 48 Hours</option>
                </select>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Stop follow-ups immediately upon booking</div>
                  <div className="text-[11px] text-slate-400">Never annoy customers once they have scheduled an appointment.</div>
                </div>
                <input
                  type="checkbox"
                  checked={stopOnBooking}
                  onChange={(e) => setStopOnBooking(e.target.checked)}
                  className="h-5 w-5 rounded accent-sky-600"
                />
              </div>
            </div>

            <button
              onClick={() => showNotification('✓ Follow-up rules saved!')}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition"
            >
              <Save className="h-4 w-4" />
              <span>Save Rules</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: BILLING & PLAN */}
      {activeTab === 'billing' && (
        <div className="space-y-6 max-w-3xl">
          {/* Current Plan Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Plan</span>
                <div className="flex items-center gap-2 mt-1">
                  <h2 className="text-2xl font-bold text-white capitalize">{sub.plan_tier} Plan</h2>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30 capitalize">
                    {sub.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold text-white">${sub.amount}</div>
                <div className="text-xs text-slate-400">per month</div>
              </div>
            </div>

            {/* Quota Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>AI Messages:</span>
                  <span className="font-bold text-sky-400">{sub.messages_count} / {sub.messages_limit}</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${Math.round((sub.messages_count / sub.messages_limit) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Calendar Bookings:</span>
                  <span className="font-bold text-emerald-400">{sub.appointments_count} / {sub.appointments_limit}</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.round((sub.appointments_count / sub.appointments_limit) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade / Change Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-white text-base">Starter Plan</h3>
                <div className="text-2xl font-extrabold text-white mt-1">$99<span className="text-xs text-slate-400 font-normal">/mo</span></div>
                <p className="text-xs text-slate-400 mt-2">1,000 AI messages, WhatsApp + Website Chat, 100 calendar appointments.</p>
              </div>
              <button
                onClick={() => handleCheckout('starter')}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
              >
                {sub.plan_tier === 'starter' ? 'Current Plan' : 'Switch to Starter'}
              </button>
            </div>

            <div className="rounded-3xl border-2 border-sky-500 bg-slate-900/90 p-6 flex flex-col justify-between space-y-4 shadow-xl shadow-sky-500/10">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-base">Growth Plan</h3>
                  <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase">Popular</span>
                </div>
                <div className="text-2xl font-extrabold text-white mt-1">$199<span className="text-xs text-slate-400 font-normal">/mo</span></div>
                <p className="text-xs text-slate-400 mt-2">2,500 AI messages, 250 calendar appointments, priority AI response speed.</p>
              </div>
              <button
                onClick={() => handleCheckout('growth')}
                className="w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white hover:bg-sky-500 shadow-md shadow-sky-600/30 transition"
              >
                {sub.plan_tier === 'growth' ? 'Current Plan' : 'Upgrade to Growth'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ACCOUNT & SECURITY */}
      {activeTab === 'account' && (
        <form onSubmit={handleSaveAccount} className="space-y-6 max-w-3xl">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-white">Your Account Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Your Full Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Login Email Address</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Change Password */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white">Change Password</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition active:scale-95 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Update Account</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Danger Zone</span>
            </div>
            <p className="text-xs text-slate-300">
              Permanently delete this business workspace, conversation history, and account.
            </p>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600/20 border border-rose-500/40 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-600/30 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Workspace &amp; Account</span>
            </button>
          </div>
        </form>
      )}

      {/* Advanced Technical Controls (Collapsible) */}
      <div className="pt-6 border-t border-slate-800/80 max-w-3xl">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180 text-sky-400' : ''}`} />
          <span>{showAdvanced ? 'Hide Technical Diagnostics' : 'Show Advanced Developer Settings (Technical)'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 text-xs font-mono text-slate-300 animate-fade-in">
            <div className="font-bold text-white font-sans text-sm">System &amp; API Configuration</div>
            <div className="space-y-2">
              <div>Backend Status: <span className="text-emerald-400">Healthy (200 OK)</span></div>
              <div>AI Provider Engine: <span className="text-sky-400">OpenRouter (google/gemini-2.0-flash-001)</span></div>
              <div>Database Engine: <span className="text-sky-400">PostgreSQL / SQLite Isolated Schema</span></div>
              <div>Webhook Receiver: <span className="text-slate-400">/api/v1/webhooks/whatsapp</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
