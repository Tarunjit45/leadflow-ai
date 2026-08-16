import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeadFlow AI — Turn Every Inbound Enquiry Into A Customer',
  description: 'AI-powered lead recovery, qualification, follow-up, and appointment-booking platform for home-service businesses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
