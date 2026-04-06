'use server';

import { adminSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Admin Session Verification
 */
export async function verifyAdmin(password: string) {
  if (!ADMIN_PASSWORD) return false;
  return password === ADMIN_PASSWORD;
}

/**
 * Global Lock: Verify password and set auth cookie.
 */
export async function loginGlobal(password: string) {
  if (!ADMIN_PASSWORD) return { success: false, error: 'Password not configured' };
  
  if (password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('global_auth', 'authenticated', {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return { success: true };
  }
  return { success: false, error: 'Access Denied' };
}

/**
 * Bulk Ingest IPs
 * Deduplicates, formats, and pushes to upload_queue.
 * Optimized for chunked ingestion with detailed error reporting.
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

    // Use ignoreDuplicates: true to prevent ingest failure on existing records
    // Chunk into batches of 100 on the backend to avoid transaction timeouts
    const BATCH_SIZE = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < formatted.length; i += BATCH_SIZE) {
      const batch = formatted.slice(i, i + BATCH_SIZE);
      const { error } = await adminSupabase
        .from('upload_queue')
        .upsert(batch, { 
          onConflict: 'raw_ip',
          ignoreDuplicates: true 
        });

      if (error) {
         console.error('Supabase Ingest Error:', error);
         return { 
           success: false, 
           error: `INGEST_FAILED. Code: ${error.code}, Message: ${error.message}, Details: ${error.details || 'None'}` 
         };
      }
      insertedCount += batch.length;
    }
    
    return { success: true, count: insertedCount };
  } catch (error: unknown) {
    const err = error as { message?: string, code?: string, details?: string }; // Handle unknown error safely for properties
    const message = err?.message || 'Unknown error';
    const code = err?.code || 'NO_CODE';
    const details = err?.details || 'No details';
    return { success: false, error: `INGEST_EXCEPTION. Code: ${code}, Message: ${message}, Details: ${details}` };
  }
}

/**
 * Get Queue Progress & Worker Activity
 */
export async function getQueueCount() {
  if (!adminSupabase) return { count: 0, lastActive: false };
  try {
    const { count, error } = await adminSupabase
      .from('upload_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (error) throw error;

    // Check if worker was active in last 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60000).toISOString();
    const { data: recentNode } = await adminSupabase
      .from('nodes')
      .select('lastUpdate')
      .gte('lastUpdate', tenMinsAgo)
      .limit(1);

    const lastActive = !!(recentNode && recentNode.length > 0);
    return { count: count || 0, lastActive };
  } catch (error) {
    console.error('Queue count error:', error);
    return { count: 0, lastActive: false };
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

/**
 * Trigger Worker
 * Safely kicks off the protected background worker API.
 */
export async function triggerWorker(origin: string) {
  if (!ADMIN_PASSWORD) return;
  fetch(`${origin}/api/worker/process-queue`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${ADMIN_PASSWORD}` 
    }
  }).catch(console.error);
}
