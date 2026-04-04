'use server';

import { adminSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Admin Session Verification
 * This is the gatekeeper for all administrative actions.
 */
export async function verifyAdmin(password: string) {
  // During build, environment variables might be missing
  if (!ADMIN_PASSWORD) return false;
  return password === ADMIN_PASSWORD;
}

/**
 * Purge Database
 * Destroys all node records using Service Role Key.
 * Bypasses RLS to ensure complete cleanup.
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
    console.error('CRITICAL: Purge error:', error);
    return { success: false, error: message };
  }
}

/**
 * Force Revalidate
 * Clears the Next.js cache and triggers a re-render.
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
 * Performs a table-level check to verify read/write connectivity.
 * Not just a ping; specifically verifies 'nodes' table access.
 */
export async function getSystemHealth() {
  if (!adminSupabase) {
    return { 
      status: 'OFFLINE' as const, 
      error: 'CRITICAL: adminSupabase not initialized.', 
      timestamp: new Date().toISOString() 
    };
  }

  try {
    const startTime = Date.now();
    // Test actual table accessibility with a count query
    const { count, error } = await adminSupabase
      .from('nodes')
      .select('*', { count: 'exact', head: true });
    
    const latency = Date.now() - startTime;

    if (error) {
      console.error('DB Connectivity Probe Failed:', error);
      throw error;
    }

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
      error: `Table Access Denied: ${message}`,
      timestamp: new Date().toISOString(),
    };
  }
}
