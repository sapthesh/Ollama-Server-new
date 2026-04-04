import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

      sendUpdate({ status: 'start', total: urls.length, message: `Starting discovery for ${urls.length} nodes...` });

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
            // Success: Upsert to Supabase
            if (supabase) {
              await supabase.from('nodes').upsert({
                server: url,
                models: models.models.map((m: { name: string }) => m.name),
                status: 'success',
                lastUpdate: new Date().toISOString()
              }, { onConflict: 'server' });
            }
            sendUpdate({ status: 'success', url: maskIP(url), message: `Success: ${maskIP(url)} responded.` });
          } else {
            // Failure: Immediate Prune
            if (supabase) {
              await supabase.from('nodes').delete().eq('server', url);
            }
            sendUpdate({ status: 'fail', url: maskIP(url), message: `Pruned: ${maskIP(url)} is offline or invalid.` });
          }
        } catch (_error) {
          clearTimeout(timeoutId);
          // Timeout or abort: Immediate Prune
          if (supabase) {
            await supabase.from('nodes').delete().eq('server', url);
          }
          sendUpdate({ status: 'fail', url: maskIP(url), message: `Timeout/Error: ${maskIP(url)} removed.` });
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
