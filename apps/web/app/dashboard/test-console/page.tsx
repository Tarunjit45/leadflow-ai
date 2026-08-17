'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestConsoleRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/agent?tab=sandbox');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-xs text-slate-400">
      Redirecting to Live Test Sandbox...
    </div>
  );
}
