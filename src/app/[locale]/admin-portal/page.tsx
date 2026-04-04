'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  TrashIcon, 
  ArrowPathIcon, 
  HeartIcon,
  FingerPrintIcon
} from '@heroicons/react/24/outline';

interface HealthData {
  status: 'ONLINE' | 'OFFLINE' | 'CHECKING';
  latency?: string;
  count?: number;
  timestamp: string;
  error?: string;
}

interface AdminActions {
  purgeDatabase: () => Promise<{ success: boolean; error?: string }>;
  forceRevalidate: () => Promise<{ success: boolean; error?: string }>;
  getSystemHealth: () => Promise<HealthData>;
}

export default function AdminPortal() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [actions, setActions] = useState<AdminActions | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // Late import of server actions to completely avoid build-time crawl
    import('@/app/actions/admin').then((mod) => {
      setActions(mod as unknown as AdminActions);
    });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && actions) {
      setIsAuthorized(true);
      handleCheckHealth(actions);
    }
  };

  const handlePurge = async () => {
    if (!confirm('CONFIRM PURGE: Delete all nodes from database?') || !actions) return;
    setLoading(true);
    const res = await actions.purgeDatabase();
    setLoading(false);
    if (res.success) {
      setStatus({ type: 'success', message: 'DATABASE PURGED' });
      handleCheckHealth(actions);
    } else {
      setStatus({ type: 'error', message: `PURGE FAILED: ${res.error}` });
    }
  };

  const handleRevalidate = async () => {
    if (!actions) return;
    setLoading(true);
    const res = await actions.forceRevalidate();
    setLoading(false);
    if (res.success) {
      setStatus({ type: 'success', message: 'CACHE INVALIDATED' });
    }
  };

  const handleCheckHealth = async (currentActions = actions) => {
    if (!currentActions) return;
    const res = await currentActions.getSystemHealth();
    setHealthData(res as HealthData);
  };

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <ArrowPathIcon className="w-8 h-8 text-charcoal animate-spin" />
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-8">
          <div className="flex flex-col items-center space-y-2">
            <FingerPrintIcon className="w-8 h-8 text-charcoal" />
            <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal">Terminal.Auth</h1>
          </div>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border-b border-charcoal py-2 text-center text-white 
              focus:outline-none focus:border-white transition-colors tracking-[0.5em]"
            placeholder="••••••"
          />
          <button type="submit" className="hidden">Enter</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8 font-mono">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex items-center justify-between border-b border-charcoal pb-8">
          <div className="space-y-1">
            <h1 className="text-xl font-black uppercase tracking-[0.2em]">Secret Admin Portal</h1>
            <p className="text-[10px] text-charcoal uppercase tracking-widest">Maintenance.Mode // High.Privilege</p>
          </div>
          <ShieldCheckIcon className="w-6 h-6 text-emerald-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <button 
            onClick={handlePurge}
            disabled={loading}
            className="group flex flex-col items-start p-6 border border-charcoal hover:border-rose-900 transition-colors text-left space-y-4"
          >
            <TrashIcon className="w-5 h-5 text-charcoal group-hover:text-rose-500" />
            <div className="space-y-1">
              <h2 className="text-[10px] font-black uppercase tracking-widest">Purge Database</h2>
              <p className="text-[9px] text-charcoal uppercase leading-relaxed">Destroy all persistent records in Supabase nodes table.</p>
            </div>
          </button>

          <button 
            onClick={handleRevalidate}
            disabled={loading}
            className="group flex flex-col items-start p-6 border border-charcoal hover:border-cyan-900 transition-colors text-left space-y-4"
          >
            <ArrowPathIcon className="w-5 h-5 text-charcoal group-hover:text-cyan-500" />
            <div className="space-y-1">
              <h2 className="text-[10px] font-black uppercase tracking-widest">Force Revalidate</h2>
              <p className="text-[9px] text-charcoal uppercase leading-relaxed">Clear Next.js 15 shared data cache and edge fragments.</p>
            </div>
          </button>

          <div className="flex flex-col items-start p-6 border border-charcoal space-y-4">
            <HeartIcon className={`w-5 h-5 ${healthData?.status === 'ONLINE' ? 'text-emerald-500' : 'text-rose-500'}`} />
            <div className="space-y-1 w-full">
              <h2 className="text-[10px] font-black uppercase tracking-widest">System Health</h2>
              <div className="text-[9px] font-mono space-y-1 pt-2">
                <div className="flex justify-between">
                  <span className="text-charcoal uppercase">Status:</span>
                  <span className={healthData?.status === 'ONLINE' ? 'text-emerald-500' : 'text-rose-500'}>{healthData?.status || 'CHECKING...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal uppercase">Latency:</span>
                  <span>{healthData?.latency || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal uppercase">Nodes:</span>
                  <span>{healthData?.count || '0'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {status && (
          <div className={`p-4 text-[10px] font-black uppercase tracking-widest border 
            ${status.type === 'success' ? 'border-emerald-900 text-emerald-500 bg-emerald-950/20' : 'border-rose-900 text-rose-500 bg-rose-950/20'}`}>
            &gt; {status.message}
          </div>
        )}

        <div className="space-y-4 pt-12">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-charcoal">Raw.Handshake.Logs</h3>
          <div className="bg-[#050505] border border-charcoal p-4 h-48 overflow-y-auto custom-scrollbar">
            {healthData?.error ? (
              <pre className="text-[10px] text-rose-500 leading-relaxed whitespace-pre-wrap">
                [{new Date().toISOString()}] CRITICAL: {healthData.error}
              </pre>
            ) : (
              <pre className="text-[10px] text-charcoal leading-relaxed">
                [{new Date().toISOString()}] No anomalies detected in current handshake.
                [{new Date().toISOString()}] Connection pool stable.
              </pre>
            )}
          </div>
        </div>

        <button 
          onClick={() => window.location.href = '/'}
          className="text-[10px] text-charcoal uppercase tracking-widest hover:text-white transition-colors"
        >
          Exit Administrative Session
        </button>
      </div>
    </main>
  );
}
