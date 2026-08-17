import Link from 'next/link';
import { Bot, ArrowLeft, Shield } from 'lucide-react';

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
          <p className="text-xs text-slate-500 mt-2">Last updated: August 2026</p>
        </div>

        <div className="prose prose-invert prose-slate text-sm space-y-6 text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By creating a workspace or accessing the LeadFlow AI platform, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the authority to bind such entity to these terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. Description of Service</h2>
            <p>
              LeadFlow AI provides autonomous digital employee software designed for customer messaging, lead qualification, and appointment scheduling across WhatsApp and web chat interfaces.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. User Responsibilities & Account Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your workspace credentials and for all activities that occur under your account. You agree to notify LeadFlow AI immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. WhatsApp & Third-Party Integrations</h2>
            <p>
              Usage of WhatsApp Cloud API integrations is subject to Meta&apos;s WhatsApp Business Policy and Terms of Service. You agree not to use LeadFlow AI to send unsolicited spam or violate third-party messaging policies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">5. Subscription & Cancellation</h2>
            <p>
              Paid subscription plans are billed in advance on a recurring monthly basis. You may cancel your subscription at any time directly through your dashboard settings.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
