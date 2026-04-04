export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import { DashboardClient } from '@/components/DashboardClient';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Main Dashboard - Server Component
 * 
 * Strictly exports Next.js segment config to drive dynamic rendering
 * and prevent static build-time caching of the IP list.
 */
export default function Home() {
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
