export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { DashboardClient } from '@/components/DashboardClient';
import GlobalLoginGate from '@/components/GlobalLoginGate';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Main Dashboard - Server Component
 * 
 * Strictly exports Next.js segment config to drive dynamic rendering
 * and prevent static build-time caching of the IP list.
 */
export default async function Home() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('global_auth')?.value === 'authenticated';

  if (!isAuthenticated) {
    return <GlobalLoginGate />;
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <ArrowPathIcon className="w-8 h-8 text-charcoal animate-spin" />
      </div>
    }>
      <DashboardClient />
    </Suspense>
  );
}
