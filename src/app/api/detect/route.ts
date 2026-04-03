import { NextResponse } from 'next/server';
import { checkService, measureTPS } from '@/lib/detect';

export const maxDuration = 50; // Set maximum execution time to 50 seconds

export async function POST(request: Request) {
  let url = '';
  try {
    const { url: requestUrl } = await request.json();
    url = requestUrl;
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('Detecting service:', url);

    // Check service and get available models
    const models = await checkService(url);
    
    // If service unavailable, return empty result
    if (!models) {
      return NextResponse.json({
        server: url,
        models: [],
        tps: 0,
        lastUpdate: new Date().toISOString(),
        status: 'error'
      });
    }

    // If models available, test performance
    let tps = 0;
    let isFake = false;
    
    if (models.length > 0) {
      try {
        const tpsResult = await measureTPS(url, models[0]);
        
        // Check if it's fake-ollama
        if (typeof tpsResult === 'object' && 'isFake' in tpsResult) {
          isFake = true;
          tps = 0;
        } else {
          tps = tpsResult as number;
        }
      } catch (error) {
        console.error('Performance test failed:', error);
      }
    }

    // Return result
    return NextResponse.json({
      server: url,
      models: models.map(model => model.name),
      tps,
      lastUpdate: new Date().toISOString(),
      status: isFake ? 'fake' : 'success',
      isFake
    });

  } catch (error) {
    console.error('Detection error:', error);
    return NextResponse.json({
      server: url,
      models: [],
      tps: 0,
      lastUpdate: new Date().toISOString(),
      status: 'error'
    });
  }
}