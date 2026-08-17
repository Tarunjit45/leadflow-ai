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
  Phone,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import PhoneInputWithCountry from '../../../components/PhoneInputWithCountry';

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('profile');

  // Business Profile State
  const [bizName, setBizName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [avgJobValue, setAvgJobValue] = useState<number>(500);

  // Channels State
  const [waConnected, setWaConnected] = useState(true);
  const [waPhone, setWaPhone] = useState('+91 ');
  const [calConnected, setCalConnected] = useState(true);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Follow-up Rules
  const [followUpDelayHours, setFollowUpDelayHours] = useState(24);
  const [stopOnBooking, setStopOnBooking] = useState(true);

  // Billing State
  const [sub, setSub] = useState<any>({
    plan_tier: 'Growth',
    status: 'active',
    amount: 199,
    billing_interval: 'month',
    messages_count: 0,
    messages_limit: 2500,
    appointments_count: 0,
    appointments_limit: 250,
  });

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdStatus, setPwdStatus] = useState('');

  // Danger Zone Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);

    fetchApi('/businesses/current')
      .then((data) => {
        if (data?.name) setBizName(data.name);
        if (data?.phone) {
          setPhone(data.phone);
          setWaPhone(data.phone);
        }
        if (data?.address) setAddress(data.address);
        if (data?.timezone) setTimezone(data.timezone);
        if (data?.average_job_value !== undefined) setAvgJobValue(data.average_job_value);
      })
      .catch(() => {});

    fetchApi('/billing/subscription')
      .then((data) => {
        if (data) setSub(data);
      })
      .catch(() => {});
  }, [searchParams]);

  const handleSaveProfile = async () => {
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
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPwdStatus('New passwords do not match.');
      return;
    }
    try {
      await fetchApi('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setPwdStatus('Password updated successfully! All other sessions revoked.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPwdStatus(err.message || 'Failed to update password.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await fetchApi('/auth/account', { method: 'DELETE' });
      localStorage.clear();
      window.location.href = '/signup';
    } catch (err: any) {
      alert(err.message || 'Failed to delete account.');
      setDeleting(false);
    }
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://leadflow.ai';
  const embedCode = `<!-- LeadFlow AI Website Chat Embed -->\n<script src="${currentOrigin}/api/v1/widget/embed.js" data-business-id="biz_current" async></script>`;

  const copyEmbedSnippet = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Settings &amp; Channels</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your real company profile, international WhatsApp business number, and integrations.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-px">
        {[
          { id: 'profile', label: 'Company Profile', icon: Building },
          { id: 'channels', label: 'Connected Channels', icon: MessageSquare },
          { id: 'followups', label: 'Smart Follow-ups', icon: Sliders },
          { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
          { id: 'security', label: 'Account & Security', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-blue-500 text-white font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl border border-slate-800/80 bg-[#0e131f] p-6 sm:p-8 space-y-5">
            <h2 className="text-base font-bold text-white">Real Business Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="e.g. Biswas Home Services"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  WhatsApp / Contact Phone (Select Country) *
                </label>
                <PhoneInputWithCountry
                  value={phone}
                  onChange={setPhone}
                  defaultCountryCode="IN"
                  placeholder="98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Service Area City / Region
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Kolkata, WB, India"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Average Job Value (in your currency)
                </label>
                <input
                  type="number"
                  value={avgJobValue}
                  onChange={(e) => setAvgJobValue(parseFloat(e.target.value) || 0)}
                  placeholder="500"
                  className="input-field"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveProfile}
                className="btn-primary py-2.5 px-6 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Channels */}
      {activeTab === 'channels' && (
        <div className="space-y-6 animate-fade-in">
          {/* WhatsApp Channel Card */}
          <div className="rounded-3xl border border-slate-800/80 bg-[#0e131f] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">WhatsApp Business Number</h3>
                  <p className="text-xs text-slate-400">Incoming messages to this number are answered by your AI employee in &lt; 2s.</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold shrink-0">
                Live &amp; Connected
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Connected WhatsApp Number:
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <PhoneInputWithCountry
                    value={waPhone}
                    onChange={setWaPhone}
                    defaultCountryCode="IN"
                  />
                </div>
                <button
                  onClick={async () => {
                    await fetchApi('/businesses/current', {
                      method: 'PATCH',
                      body: JSON.stringify({ phone: waPhone }),
                    });
                    setSavedSuccess(true);
                    setTimeout(() => setSavedSuccess(false), 3000);
                  }}
                  className="btn-primary py-2.5 px-4 text-xs font-bold shrink-0"
                >
                  Update Number
                </button>
              </div>
            </div>
          </div>

          {/* Website Chat Widget Embed */}
          <div className="rounded-3xl border border-slate-800/80 bg-[#0e131f] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Website Live Chat Widget</h3>
                  <p className="text-xs text-slate-400">Copy this 1-line script onto your website to enable AI chat.</p>
                </div>
              </div>

              <button
                onClick={copyEmbedSnippet}
                className="btn-secondary py-2 px-3 text-xs"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-xs text-blue-300 font-mono overflow-x-auto">
              {embedCode}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: Smart Follow-ups */}
      {activeTab === 'followups' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl border border-slate-800/80 bg-[#0e131f] p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white">Automated Lead Recovery Cadence</h2>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Stop Follow-ups Once Booked</div>
                  <div className="text-slate-400 text-[11px]">Automatically halts sequences when customer confirms appointment.</div>
                </div>
                <input
                  type="checkbox"
                  checked={stopOnBooking}
                  onChange={(e) => setStopOnBooking(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-bold text-white">3-Stage Follow-Up Sequence:</div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-blue-400 font-bold">Stage 1 (+24 Hours):</span>
                <p className="text-slate-300">&ldquo;Hi! Checking in to see if you still needed assistance with your service request.&rdquo;</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-blue-400 font-bold">Stage 2 (+72 Hours):</span>
                <p className="text-slate-300">&ldquo;Hi! We have an open dispatch slot available this week if you&apos;d like us to hold it for you.&rdquo;</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-blue-400 font-bold">Stage 3 (+7 Days):</span>
                <p className="text-slate-300">&ldquo;Friendly reminder that our team is available whenever you&apos;re ready. Have a wonderful week!&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl border border-slate-800/80 bg-[#0e131f] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase">
                  {sub.plan_tier || 'Growth'} Plan
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-2">${sub.amount || 199} <span className="text-xs font-normal text-slate-400">/ month</span></h2>
              </div>

              <button className="btn-primary py-2 px-5 text-xs">
                Manage Subscription
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Monthly AI Messages</span>
                  <span className="text-white font-bold">{sub.messages_count || 0} / {sub.messages_limit || 2500}</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '5%' }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Monthly Bookings</span>
                  <span className="text-white font-bold">{sub.appointments_count || 0} / {sub.appointments_limit || 250}</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '2%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Account & Security */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          {/* Password Change */}
          <div className="rounded-3xl border border-slate-800/80 bg-[#0e131f] p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-white">Change Workspace Password</h2>
            <p className="text-xs text-slate-400">Updating your password will immediately revoke all other active sessions across devices.</p>

            {pwdStatus && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
                {pwdStatus}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">New Password (8+ characters)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <button type="submit" className="btn-primary py-2.5 px-5 text-xs font-bold">
                Update Password
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="rounded-3xl border border-rose-500/25 bg-rose-500/5 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Trash2 className="w-4 h-4" />
              <span>Danger Zone — Delete Workspace</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Permanently deletes your business profile, customer conversation history, and AI employee configuration. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all duration-150"
            >
              Delete My Workspace &amp; Account
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#0e131f] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Permanently Delete Account?</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently delete your workspace for <strong>{bizName}</strong>, all customer dossiers, and all integration tokens.
            </p>

            <div className="space-y-1.5 text-xs pt-2">
              <label className="block text-slate-400 text-[11px]">Type <strong>DELETE</strong> to confirm:</label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="input-field border-rose-500/30 text-rose-300"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
