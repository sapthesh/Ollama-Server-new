export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { AdminPortalClient } from '@/components/AdminPortalClient';

/**
 * Secret Admin Portal - Server Component
 * 
 * Strictly exports Next.js segment config to drive dynamic rendering
 * and prevent static build-time crawling of administrative logic.
 */
export default function AdminPortalPage() {
  return <AdminPortalClient />;
}
