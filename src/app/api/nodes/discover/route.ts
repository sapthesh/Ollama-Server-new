import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { urls } = await req.json();

  if (!urls || !Array.isArray(urls)) {
    return NextResponse.json({ error: 'Invalid URLs' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: { 
        status: string; 
        total?: number; 
        current?: number; 
        url?: string; 
        progress?: number; 
        message: string;
      }) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      sendUpdate({ status: 'start', total: urls.length, message: `Starting discovery with Service Role elevation...` });

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const progress = Math.round(((i + 1) / urls.length) * 100);
        
        sendUpdate({ 
          status: 'scanning', 
          current: i + 1, 
          url: maskIP(url), 
          progress,
          message: `Scanning [${i + 1}/${urls.length}]: ${maskIP(url)}` 
        });

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 5000);

        try {
          // 5s Strict Timeout Check
          const models = await fetch(`${url}/api/tags`, {
            signal: abortController.signal,
            headers: { 'Accept': 'application/json' }
          }).then(res => res.ok ? res.json() : null)
            .catch(() => null);

          clearTimeout(timeoutId);

          if (models && models.models) {
            // Success: Upsert to Supabase with Service Role
            if (adminSupabase) {
              const { error } = await adminSupabase.from('nodes').upsert({
                server: url,
                models: models.models.map((m: { name: string }) => m.name),
                status: 'success',
                lastUpdate: new Date().toISOString()
              }, { onConflict: 'server' });

              if (error) {
                console.error(`Supabase Upsert Failed for ${url}:`, error);
                sendUpdate({ status: 'error', url: maskIP(url), message: `DB ERROR: ${error.message}` });
              } else {
                sendUpdate({ status: 'success', url: maskIP(url), message: `Success: ${maskIP(url)} saved to database.` });
              }
            } else {
              sendUpdate({ status: 'error', url: maskIP(url), message: 'DB ERROR: adminSupabase not initialized.' });
            }
          } else {
            // Failure: Immediate Prune with Service Role
            if (adminSupabase) {
              const { error } = await adminSupabase.from('nodes').delete().eq('server', url);
              if (error) {
                console.error(`Supabase Delete Failed for ${url}:`, error);
                sendUpdate({ status: 'error', url: maskIP(url), message: `DB ERROR: ${error.message}` });
              } else {
                sendUpdate({ status: 'fail', url: maskIP(url), message: `Pruned: ${maskIP(url)} is offline.` });
              }
            }
          }
        } catch (err) {
          clearTimeout(timeoutId);
          // Timeout or abort: Immediate Prune with Service Role
          if (adminSupabase) {
            const { error } = await adminSupabase.from('nodes').delete().eq('server', url);
            if (error) {
              console.error(`Supabase Delete Failed for ${url}:`, error);
              sendUpdate({ status: 'error', url: maskIP(url), message: `DB ERROR: ${error.message}` });
            } else {
              sendUpdate({ status: 'fail', url: maskIP(url), message: `Timeout/Error: ${maskIP(url)} pruned (err: ${err instanceof Error ? err.message : 'timeout'}).` });
            }
          }
        }
      }

      sendUpdate({ status: 'complete', message: 'Discovery process finished.' });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function maskIP(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const parts = host.split('.');
    if (parts.length === 4) {
      return `${u.protocol}//${parts[0]}.${parts[1]}.x.x${u.port ? ':' + u.port : ''}`;
    }
    return url;
  } catch {
    return url;
  }
}
