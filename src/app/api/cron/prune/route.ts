import { NextResponse } from 'next/server';
import { pruneServersAction } from '@/app/actions/prune';

// Security check for Vercel Cron
// In Vercel, CRON_SECRET is an environment variable provided automatically
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Only check if CRON_SECRET is configured
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await pruneServersAction();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
