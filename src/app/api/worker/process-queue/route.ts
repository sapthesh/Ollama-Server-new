import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Increase Vercel timeout limit

/**
 * Hands-Free Recursive Background Worker
 * Processes upload_queue in batches of 50 and self-triggers.
 */
export async function POST(req: Request) {
  if (!adminSupabase) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });
  
  const baseUrl = new URL(req.url).origin;

  try {
    // 1. Fetch next 50 unprocessed rows
    const { data: queue, error: fetchError } = await adminSupabase
      .from('upload_queue')
      .select('raw_ip')
      .eq('status', 'pending')
      .limit(50);

    if (fetchError) throw fetchError;
    if (!queue || queue.length === 0) {
      return NextResponse.json({ status: 'complete', message: 'Queue is empty' });
    }

    const ips = queue.map(r => r.raw_ip);

    // 1.5 Deduplication Check
    const { data: existingNodes } = await adminSupabase
      .from('nodes')
      .select('server')
      .in('server', ips);

    const existingIps = new Set((existingNodes || []).map(n => n.server));
    const newIpsToTest = ips.filter(ip => !existingIps.has(ip));

    // 2. Parallel Handshake Verification (5s Timeout) - Only test new IPs
    const results = await Promise.all(
      newIpsToTest.map(async (url) => {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 5000);

        try {
          const res = await fetch(`${url}/api/tags`, {
            signal: abortController.signal,
            headers: { 'Accept': 'application/json' }
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (data.models) {
              return { url, status: 'success', models: data.models.map((m: { name: string }) => m.name) };
            }
          }
          return { url, status: 'fail' };
        } catch (_e) {
          clearTimeout(timeoutId);
          return { url, status: 'fail' };
        }
      })
    );

    // 3. Promote & Prune
    const successfulNodes = results
      .filter(r => r.status === 'success')
      .map(r => ({
        server: r.url,
        models: r.models,
        status: 'success',
        lastUpdate: new Date().toISOString()
      }));

    if (successfulNodes.length > 0) {
      await adminSupabase.from('nodes').upsert(successfulNodes, { onConflict: 'server' });
    }

    // Mark processed (Delete from queue to keep table lean)
    await adminSupabase.from('upload_queue').delete().in('raw_ip', ips);

    // 4. Recursive Self-Trigger (Fire and Forget)
    // We check if more records remain before triggering
    const { count } = await adminSupabase
      .from('upload_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (count && count > 0) {
      // Non-blocking fetch to self-trigger
      fetch(`${baseUrl}/api/worker/process-queue`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => console.error('Self-trigger failed:', err));
    } else {
      // Final revalidate of dashboard
      revalidatePath('/', 'layout');
    }

    return NextResponse.json({ 
      status: 'processing', 
      processed: ips.length, 
      promoted: successfulNodes.length,
      remaining: count || 0
    });

  } catch (error) {
    console.error('Queue worker error:', error);
    return NextResponse.json({ error: 'Worker failed' }, { status: 500 });
  }
}
