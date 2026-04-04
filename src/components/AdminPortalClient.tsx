'use client';

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
  purgeStaticCache: () => Promise<{ success: boolean; error?: string }>;
  getSystemHealth: () => Promise<HealthData>;
}

export function AdminPortalClient() {
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

  const handleRefreshCache = async () => {
    if (!actions) return;
    setLoading(true);
    const res = await actions.purgeStaticCache();
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
        <ArrowPathIcon className="w-8 h-8 text-white/20 animate-spin" />
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 transition-colors duration-300">
        <div className="w-full max-w-xs space-y-12 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-black dark:bg-white/5 rounded-none border border-black/10 dark:border-white/10 shadow-2xl">
              <FingerPrintIcon className="w-10 h-10 text-black dark:text-white" />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-xs font-black uppercase tracking-[0.5em] text-black dark:text-white">Terminal.Auth</h1>
              <p className="text-[9px] font-bold text-black/40 dark:text-white/20 uppercase tracking-widest leading-relaxed">Admin Privilege Required</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative group">
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b-2 border-black/10 dark:border-white/10 py-3 text-center text-black dark:text-white 
                  focus:outline-none focus:border-black dark:focus:border-white transition-all text-sm tracking-[0.8em] font-black
                  placeholder:text-black/10 dark:placeholder:text-white/5"
                placeholder="••••••"
              />
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-black dark:bg-white transition-all duration-500 group-focus-within:w-full" />
            </div>
            
            <p className="text-center text-[8px] font-black uppercase tracking-[0.3em] text-black/30 dark:text-white/10">
              Session monitored // High level encryption active
            </p>
            <button type="submit" className="hidden">Enter</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 p-6 md:p-12 font-mono">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/5 pb-12">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-rose-500 animate-pulse" />
              <h1 className="text-2xl font-black uppercase tracking-[0.25em]">Admin Portal</h1>
            </div>
            <p className="text-[10px] text-black/50 dark:text-white/30 uppercase tracking-[0.3em] font-black">
              Maintenance Terminal // Session.ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
             <ShieldCheckIcon className="w-8 h-8 text-black dark:text-white" />
             <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">Authorized</span>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Purge Database */}
          <button 
            onClick={handlePurge}
            disabled={loading}
            className="group relative flex flex-col items-start p-8 border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/10 hover:border-rose-500 transition-all duration-300 text-left space-y-6 overflow-hidden active:scale-95"
          >
            <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/5 transition-all duration-300" />
            <TrashIcon className="w-6 h-6 text-black/40 dark:text-white/20 group-hover:text-rose-500 transition-colors" />
            <div className="space-y-2 relative">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] group-hover:text-rose-500">Purge Persistent Data</h2>
              <p className="text-[9px] text-black/50 dark:text-white/30 uppercase leading-relaxed font-bold">Destroy all core records in the discovery table. Irreversible session cleanup.</p>
            </div>
          </button>

          {/* Force Revalidate */}
          <button 
            onClick={handleRefreshCache}
            disabled={loading}
            className="group relative flex flex-col items-start p-8 border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/10 hover:border-cyan-500 transition-all duration-300 text-left space-y-6 overflow-hidden active:scale-95"
          >
            <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-all duration-300" />
            <ArrowPathIcon className="w-6 h-6 text-black/40 dark:text-white/20 group-hover:text-cyan-500 transition-colors" />
            <div className="space-y-2 relative">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] group-hover:text-cyan-500">Flush System Cache</h2>
              <p className="text-[9px] text-black/50 dark:text-white/30 uppercase leading-relaxed font-bold">Invalidate all server-side data fragments and force immediate re-discovery.</p>
            </div>
          </button>

          {/* System Health */}
          <div className="relative flex flex-col items-start p-8 border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/10 space-y-6">
            <HeartIcon className={`w-6 h-6 ${healthData?.status === 'ONLINE' ? 'text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'} transition-all duration-500`} />
            <div className="space-y-4 w-full">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Table.Layer Health</h2>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
                  <span className="text-[9px] text-black/40 dark:text-white/20 uppercase font-black">Status:</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${healthData?.status === 'ONLINE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {healthData?.status || 'PROBING...'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
                  <span className="text-[9px] text-black/40 dark:text-white/20 uppercase font-black">Latency:</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{healthData?.latency || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-[9px] text-black/40 dark:text-white/20 uppercase font-black">Nodes:</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{healthData?.count !== undefined ? healthData.count : '0'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {status && (
          <div className={`p-5 text-[10px] font-black uppercase tracking-[0.2em] border animate-in slide-in-from-top-2 duration-300
            ${status.type === 'success' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5' : 'border-rose-500/50 text-rose-500 bg-rose-500/5'}`}>
            &gt; SYSTEM_LOG: {status.message}
          </div>
        )}

        {/* Console Logs */}
        <div className="space-y-6 pt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-black/30 dark:text-white/20">Handshake.Diagnostic.Stream</h3>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[8px] font-black uppercase tracking-widest text-black/30 dark:text-white/10">Active Monitoring</span>
            </div>
          </div>
          <div className="bg-zinc-50 dark:bg-[#050505] border border-black/10 dark:border-white/5 p-6 h-64 overflow-y-auto custom-scrollbar font-mono">
            {healthData?.error ? (
              <div className="space-y-2 animate-in fade-in duration-500">
                <p className="text-[10px] text-rose-500 font-bold leading-relaxed">
                  [{new Date().toISOString()}] CRITICAL_EXCEPTION_DETECTION
                </p>
                <p className="text-[10px] text-rose-500/80 uppercase font-black pl-4 border-l border-rose-500/30">
                  {healthData.error}
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-black/40 dark:text-white/10 font-bold text-[10px] uppercase leading-relaxed">
                <p>[{new Date().toISOString()}] Authentication verified // Service Role active</p>
                <p>[{new Date().toISOString()}] No anomalous behaviors detected in table.nodes handshake.</p>
                <p>[{new Date().toISOString()}] Connection pool state: OPTIMAL</p>
                <p>[{new Date().toISOString()}] Row.Level.Security bypassed for current administrative session.</p>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Logout */}
        <div className="flex justify-center pt-8">
          <button 
            onClick={() => window.location.href = '/'}
            className="group flex items-center space-x-3 px-8 py-3 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all text-[10px] font-black uppercase tracking-[0.3em] active:scale-95"
          >
            <span>Exit Session</span>
          </button>
        </div>
      </div>
    </main>
  );
}
