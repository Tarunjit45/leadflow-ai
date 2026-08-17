'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KnowledgeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/agent?tab=services');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-xs text-slate-400">
      Redirecting to AI Employee Services...
    </div>
  );
}
