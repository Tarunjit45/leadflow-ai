import Link from 'next/link';
import { Bot, ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900/40 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">LeadFlow<span className="text-sky-400">.ai</span></span>
          </Link>
          <Link href="/signup" className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Signup
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Data Protection</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-500 mt-2">Last updated: August 2026</p>
        </div>

        <div className="prose prose-invert prose-slate text-sm space-y-6 text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when creating a workspace, configuring your AI employee, or integrating third-party messaging channels (such as WhatsApp or Google Calendar).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. How We Use Information</h2>
            <p>
              We use collected information solely to provide, maintain, and improve the LeadFlow AI service, train your dedicated AI agent with your business services, and facilitate automated appointment dispatch. We never sell your business or customer data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. Data Security & Encryption</h2>
            <p>
              All customer conversation records and integration tokens are encrypted in transit using TLS 1.3 and at rest using AES-256 encryption within dedicated PostgreSQL cloud clusters.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Your Data Rights & Deletion</h2>
            <p>
              You maintain full ownership of your data. You may export or permanently delete your account, workspace, customer dossiers, and conversation histories at any time through the Settings hub.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
