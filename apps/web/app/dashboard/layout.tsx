'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('leadflow_token');
    if (!token) {
      localStorage.setItem('leadflow_token', 'mock_jwt_demo_token');
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070c] text-slate-300">
        Loading LeadFlow AI Workspace...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#05070c] text-slate-100 font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[#05070c] bg-ambient-pitch">
          {children}
        </main>
      </div>
    </div>
  );
}
