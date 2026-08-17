'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BillingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings?tab=billing');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-xs text-slate-400">
      Redirecting to Billing &amp; Plans...
    </div>
  );
}
