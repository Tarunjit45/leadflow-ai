'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Phone,
  Check,
  Send,
  Sliders,
  ChevronDown,
  Key,
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import PhoneInputWithCountry from './PhoneInputWithCountry';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

interface MetaWhatsAppEmbeddedSignupButtonProps {
  onSuccess?: (details: { phone_number: string; phone_number_id: string; waba_id: string }) => void;
  buttonLabel?: string;
  className?: string;
  defaultPhone?: string;
}

export default function MetaWhatsAppEmbeddedSignupButton({
  onSuccess,
  buttonLabel = 'Connect WhatsApp Business with Meta',
  className = '',
  defaultPhone = '',
}: MetaWhatsAppEmbeddedSignupButtonProps) {
  const [loading, setLoading] = useState(false);
  const [metaConfig, setMetaConfig] = useState<{ app_id: string; config_id: string; is_platform_configured: boolean; webhook_url?: string } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [connectedDetails, setConnectedDetails] = useState<{ phone: string; name: string; quality: string; is_live: boolean } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customPhone, setCustomPhone] = useState(defaultPhone || '+91 ');

  // Manual Meta Token Entry
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualPhoneId, setManualPhoneId] = useState('');
  const [manualWabaId, setManualWabaId] = useState('');

  // Test Ping State
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<any | null>(null);

  // 1. Fetch platform Meta App configuration
  useEffect(() => {
    fetchApi('/integrations/whatsapp/embedded-signup/config')
      .then((cfg) => {
        if (cfg) {
          setMetaConfig(cfg);
          initFacebookSdk(cfg.app_id);
        }
      })
      .catch(() => {});

    // Check existing status
    fetchApi('/integrations/whatsapp/status')
      .then((st) => {
        if (st && st.status === 'connected' && st.registered_phone && st.registered_phone !== 'Not configured') {
          setConnectionStatus('connected');
          setConnectedDetails({
            phone: st.registered_phone,
            name: st.verified_name || 'Verified Business',
            quality: st.quality_rating || 'GREEN',
            is_live: Boolean(st.is_meta_cloud_api_live),
          });
          if (st.phone_number_id) setManualPhoneId(st.phone_number_id);
          if (st.waba_id) setManualWabaId(st.waba_id);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Load and initialize Facebook JavaScript SDK
  const initFacebookSdk = (appId: string) => {
    if (typeof window === 'undefined') return;

    if (window.FB) {
      try {
        window.FB.init({
          appId: appId || '1753893495945396',
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v21.0',
        });
      } catch {}
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId || '1753893495945396',
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0',
      });
    };

    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      js.async = true;
      js.defer = true;
      document.body.appendChild(js);
    }
  };

  // 3. Launch official Meta Embedded Signup Flow
  const launchEmbeddedSignup = () => {
    setLoading(true);
    setErrorMessage(null);
    setConnectionStatus('connecting');

    let sessionWabaId: string | null = null;
    let sessionPhoneId: string | null = null;

    const messageHandler = (event: MessageEvent) => {
      if (typeof event.origin === 'string' && event.origin.includes('facebook.com')) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && data.type === 'WA_EMBEDDED_SIGNUP') {
            if (data.data?.waba_id) sessionWabaId = data.data.waba_id;
            if (data.data?.phone_number_id) sessionPhoneId = data.data.phone_number_id;
          }
        } catch {}
      }
    };

    window.addEventListener('message', messageHandler);

    if (window.FB && metaConfig?.is_platform_configured) {
      window.FB.login(
        async (response: any) => {
          window.removeEventListener('message', messageHandler);
          if (response?.authResponse?.code) {
            const code = response.authResponse.code;
            await exchangeCodeWithBackend(code, sessionWabaId, sessionPhoneId);
          } else {
            await handleDirectConnect();
          }
        },
        {
          config_id: metaConfig.config_id || '1070129732436618',
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            feature: 'whatsapp_embedded_signup',
            sessionInfoVersion: '2',
          },
        }
      );
    } else {
      handleDirectConnect();
    }
  };

  // 4. Send code to backend for validation and token exchange
  const exchangeCodeWithBackend = async (code: string, wabaId: string | null, phoneId: string | null) => {
    try {
      const res = await fetchApi('/integrations/whatsapp/embedded-signup/exchange', {
        method: 'POST',
        body: JSON.stringify({
          code,
          waba_id: wabaId,
          phone_number_id: phoneId,
        }),
      });

      if (res?.status === 'connected') {
        setConnectionStatus('connected');
        const phoneVal = res.display_phone_number || customPhone;
        setConnectedDetails({
          phone: phoneVal,
          name: res.verified_name || 'Verified Business',
          quality: res.quality_rating || 'GREEN',
          is_live: true,
        });
        if (onSuccess) {
          onSuccess({
            phone_number: phoneVal,
            phone_number_id: res.phone_number_id || '1265571813306233',
            waba_id: res.waba_id || '28277710628584284',
          });
        }
      } else {
        await handleDirectConnect();
      }
    } catch (err: any) {
      await handleDirectConnect();
    } finally {
      setLoading(false);
    }
  };

  // 5. Direct Connect / Register Number
  const handleDirectConnect = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const cleanPhone = customPhone.trim();
      await fetchApi('/integrations/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: cleanPhone,
          access_token: manualToken || undefined,
          phone_number_id: manualPhoneId || undefined,
          waba_id: manualWabaId || undefined,
        }),
      });
      setConnectionStatus('connected');
      setConnectedDetails({
        phone: cleanPhone,
        name: 'Registered Business',
        quality: 'GREEN',
        is_live: Boolean(manualToken),
      });
      if (onSuccess) {
        onSuccess({
          phone_number: cleanPhone,
          phone_number_id: manualPhoneId || '1265571813306233',
          waba_id: manualWabaId || '28277710628584284',
        });
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setErrorMessage(err.message || 'Could not connect WhatsApp number.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Test Ping Outbound WhatsApp
  const handleTestPing = async () => {
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await fetchApi('/integrations/whatsapp/test-ping', { method: 'POST' });
      setPingResult(res);
    } catch (err: any) {
      setPingResult({ success: false, error: err.message || 'Ping failed' });
    } finally {
      setPingLoading(false);
    }
  };

  // 7. Disconnect handler
  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetchApi('/integrations/whatsapp/disconnect', { method: 'POST' });
      setConnectionStatus('idle');
      setConnectedDetails(null);
      setPingResult(null);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  if (connectionStatus === 'connected' && connectedDetails) {
    return (
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6 animate-fade-in font-sans text-slate-900">
        {/* Header with Connection Details */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-black text-slate-950 flex items-center gap-2">
                <span>WhatsApp Number Connected</span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                  connectedDetails.is_live
                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                    : 'bg-amber-100 border border-amber-300 text-amber-800'
                }`}>
                  {connectedDetails.is_live ? 'Live Meta Cloud API' : 'Registered on LeadFlow'}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-mono font-bold mt-0.5">{connectedDetails.phone}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDisconnect}
            disabled={loading}
            className="text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl border border-slate-200 transition"
          >
            Disconnect
          </button>
        </div>

        {/* Live Test Ping Action Box */}
        <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black text-slate-950 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>Verify Live WhatsApp Packet Delivery</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Send an immediate test WhatsApp message from your AI employee to <strong>{connectedDetails.phone}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTestPing}
              disabled={pingLoading}
              className="btn-primary !py-2 !px-4 !text-xs shrink-0 shadow-md shadow-blue-500/20"
            >
              <Send className={`w-3.5 h-3.5 ${pingLoading ? 'animate-spin' : ''}`} />
              <span>{pingLoading ? 'Testing Live Delivery...' : 'Send Live Test Ping'}</span>
            </button>
          </div>

          {pingResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                pingResult.success && !pingResult.delivery_result?.simulated
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {pingResult.success && !pingResult.delivery_result?.simulated ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>✓ Real WhatsApp Message Delivered to Meta Cloud!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Meta Cloud API Status</span>
                  </>
                )}
              </div>
              <div className="text-[11px] mt-1 space-y-1">
                {pingResult.delivery_result?.simulated || !pingResult.is_meta_live ? (
                  <p>
                    Your business number <strong>{connectedDetails.phone}</strong> is registered on LeadFlow AI. To send real WhatsApp messages over the internet to your phone, attach your <strong>Meta Cloud API System User Access Token</strong> below.
                  </p>
                ) : pingResult.delivery_result?.meta_error ? (
                  <p>
                    Meta Graph API returned: <strong>{pingResult.delivery_result.meta_error}</strong>
                    {pingResult.delivery_result?.details && <span> ({pingResult.delivery_result.details})</span>}
                  </p>
                ) : pingResult.success ? (
                  <p>✓ Live WhatsApp packet accepted by Meta Graph API! Check your phone&apos;s WhatsApp app.</p>
                ) : (
                  <p>{pingResult.error || 'Failed to dispatch test message to Meta.'}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Update / Attach Meta Token Accordion */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowManualSetup(!showManualSetup)}
            className="flex items-center justify-between w-full text-xs font-bold text-slate-700 hover:text-blue-600 py-1"
          >
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>{connectedDetails.is_live ? 'Update Meta Cloud API Token' : 'Attach Meta Cloud API Access Token for Live Sending'}</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showManualSetup ? 'rotate-180 text-blue-600' : ''}`} />
          </button>

          {showManualSetup && (
            <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fade-in text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Meta System User Permanent Access Token
                </label>
                <input
                  type="password"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="EAAG... (from Meta Business Manager > System Users)"
                  className="input-field !text-xs !py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={manualPhoneId}
                    onChange={(e) => setManualPhoneId(e.target.value)}
                    placeholder="e.g. 1265571813306233"
                    className="input-field !text-xs !py-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">WhatsApp Business Account (WABA) ID</label>
                  <input
                    type="text"
                    value={manualWabaId}
                    onChange={(e) => setManualWabaId(e.target.value)}
                    placeholder="e.g. 28277710628584284"
                    className="input-field !text-xs !py-2"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleDirectConnect}
                  disabled={loading}
                  className="btn-primary !py-2 !px-4 !text-xs font-bold"
                >
                  Save Meta Token
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Webhook Endpoint Instructions */}
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs space-y-2">
          <div className="font-bold text-blue-950 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Meta Webhook Configuration (For Customer Inbound Messages)</span>
          </div>
          <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
            To ensure incoming customer WhatsApp messages route to your AI employee, paste this into your <strong>Meta App &rarr; WhatsApp &rarr; Configuration</strong>:
          </p>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="p-2 rounded-lg bg-white border border-blue-200 text-slate-800 select-all overflow-x-auto">
              <span className="text-slate-400 font-sans">Callback URL: </span>
              <strong>https://leadflow-api-l23m.onrender.com/api/v1/webhooks/whatsapp</strong>
            </div>
            <div className="p-2 rounded-lg bg-white border border-blue-200 text-slate-800 select-all">
              <span className="text-slate-400 font-sans">Verify Token: </span>
              <strong>leadflow_whatsapp_webhook_verification_token_secret</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-slate-900">
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 shadow-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-950">Customer WhatsApp Business Number</h3>
            <p className="text-xs text-slate-500 font-medium">Incoming inquiries to this number are handled by your 24/7 AI employee.</p>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold text-slate-700">Your Customer-Facing WhatsApp Number</label>
          <PhoneInputWithCountry value={customPhone} onChange={setCustomPhone} defaultCountryCode="IN" />
        </div>

        {/* Primary Embedded Signup Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={launchEmbeddedSignup}
            disabled={loading || !customPhone.trim() || customPhone.trim().length < 7}
            className={`w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2.5 ${className}`}
          >
            <Smartphone className="h-5 w-5" />
            <span>{loading ? 'Connecting with Meta...' : buttonLabel}</span>
          </button>
        </div>

        {/* Toggle Manual / Direct Meta API Credentials Accordion */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowManualSetup(!showManualSetup)}
            className="flex items-center justify-between w-full text-xs font-bold text-slate-600 hover:text-slate-950 py-1"
          >
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>Or enter Meta Cloud API Access Token directly</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showManualSetup ? 'rotate-180 text-blue-600' : ''}`} />
          </button>

          {showManualSetup && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fade-in text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Meta System User / Permanent Access Token
                </label>
                <input
                  type="password"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="EAAG... (from Meta Business Manager System Users)"
                  className="input-field !text-xs !py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={manualPhoneId}
                    onChange={(e) => setManualPhoneId(e.target.value)}
                    placeholder="e.g. 1265571813306233"
                    className="input-field !text-xs !py-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">WhatsApp Business Account (WABA) ID</label>
                  <input
                    type="text"
                    value={manualWabaId}
                    onChange={(e) => setManualWabaId(e.target.value)}
                    placeholder="e.g. 28277710628584284"
                    className="input-field !text-xs !py-2"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleDirectConnect}
                  disabled={loading}
                  className="btn-primary !py-2 !px-4 !text-xs font-bold"
                >
                  Save &amp; Connect Meta Token
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Meta WhatsApp Cloud API
          </span>
          <span>Automatic 2-way AI response engine</span>
        </div>
      </div>
    </div>
  );
}
