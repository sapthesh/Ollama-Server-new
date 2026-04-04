'use server';

import { adminSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Admin Session Verification
 */
export async function verifyAdmin(password: string) {
  if (!ADMIN_PASSWORD) return false;
  return password === ADMIN_PASSWORD;
}

/**
 * Bulk Ingest IPs
 * Deduplicates, formats, and pushes to upload_queue.
 */
export async function bulkIngestIPs(rawList: string) {
  if (!adminSupabase) return { success: false, error: 'Database not initialized' };
  
  try {
    const lines = rawList.split('\n').map(l => l.trim()).filter(Boolean);
    const deduplicated = Array.from(new Set(lines));
    
    const formatted = deduplicated.map(ip => {
      let cleanIp = ip;
      if (!cleanIp.startsWith('http://') && !cleanIp.startsWith('https://')) {
        cleanIp = `http://${cleanIp}`;
      }
      if (!cleanIp.includes(':', 7)) { // basic check for port
        cleanIp = `${cleanIp}:11434`;
      }
      return { raw_ip: cleanIp, status: 'pending' };
    });

    if (formatted.length === 0) return { success: false, error: 'No valid IPs found' };

    const { error } = await adminSupabase
      .from('upload_queue')
      .upsert(formatted, { onConflict: 'raw_ip' });

    if (error) throw error;
    
    return { success: true, count: formatted.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Get Queue Progress
 */
export async function getQueueCount() {
  if (!adminSupabase) return 0;
  try {
    const { count, error } = await adminSupabase
      .from('upload_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Queue count error:', error);
    return 0;
  }
}

/**
 * Purge Database
 */
export async function purgeDatabase() {
  if (!adminSupabase) return { success: false, error: 'Admin database not initialized' };
  
  try {
    const { error } = await adminSupabase
      .from('nodes')
      .delete()
      .neq('server', 'FORCE_DELETE_ALL');

    if (error) throw error;
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Force Revalidate
 */
export async function purgeStaticCache() {
  try {
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Get System Health
 */
export async function getSystemHealth() {
  if (!adminSupabase) {
    return { status: 'OFFLINE' as const, error: 'Database not initialized', timestamp: new Date().toISOString() };
  }

  try {
    const startTime = Date.now();
    const { count, error } = await adminSupabase.from('nodes').select('*', { count: 'exact', head: true });
    const latency = Date.now() - startTime;

    if (error) throw error;

    return {
      status: 'ONLINE' as const,
      latency: `${latency}ms`,
      count: count || 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'OFFLINE' as const,
      error: message,
      timestamp: new Date().toISOString(),
    };
  }
}
