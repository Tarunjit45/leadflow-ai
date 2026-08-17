'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FollowUpsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings?tab=followups');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-xs text-slate-400">
      Redirecting to Follow-Up Rules...
    </div>
  );
}
