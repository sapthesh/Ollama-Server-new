'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function verifyAdmin(password: string) {
  // During build, environment variables might be missing
  if (!ADMIN_PASSWORD) return false;
  return password === ADMIN_PASSWORD;
}

export async function purgeDatabase() {
  if (!supabase) return { success: false, error: 'Database not initialized' };
  
  try {
    // Delete all rows from the nodes table
    const { error } = await supabase
      .from('nodes')
      .delete()
      .neq('server', 'FORCE_DELETE_ALL'); // Common trick to delete all rows

    if (error) throw error;
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Purge error:', error);
    return { success: false, error: message };
  }
}

export async function purgeStaticCache() {
  try {
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function getSystemHealth() {
  if (!supabase) return { status: 'OFFLINE' as const, error: 'Database not initialized', timestamp: new Date().toISOString() };

  try {
    const startTime = Date.now();
    const { count, error } = await supabase.from('nodes').select('*', { count: 'exact', head: true });
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
