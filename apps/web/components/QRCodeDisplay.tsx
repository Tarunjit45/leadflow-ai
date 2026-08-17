'use client';

import React, { useState } from 'react';
import { generateQRCodeSVG } from '../lib/qr';
import { Smartphone, Copy, Check, ExternalLink } from 'lucide-react';

interface QRCodeDisplayProps {
  url: string;
  title?: string;
  subtitle?: string;
  size?: number;
}

export default function QRCodeDisplay({
  url,
  title = 'Continue on your phone',
  subtitle = 'Open your phone camera and point it at this QR code to continue setup seamlessly.',
  size = 180,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const svgString = generateQRCodeSVG(url, size);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-center shadow-xl backdrop-blur-md max-w-sm mx-auto">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 mb-3">
        <Smartphone className="h-5 w-5" />
      </div>

      <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-slate-300 leading-relaxed px-2">{subtitle}</p>

      {/* QR Code Container */}
      <div className="my-5 rounded-2xl bg-white p-3.5 shadow-2xl ring-4 ring-slate-800/80">
        <div
          dangerouslySetInnerHTML={{ __html: svgString }}
          className="flex items-center justify-center"
        />
      </div>

      <div className="w-full flex items-center justify-center gap-2">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition active:scale-95"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
          <span>{copied ? 'Link Copied!' : 'Copy Mobile Link'}</span>
        </button>

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-xl bg-sky-600/20 border border-sky-500/30 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-600/30 transition"
        >
          <span>Open</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Live session sync enabled</span>
      </div>
    </div>
  );
}
