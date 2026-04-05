'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  TrashIcon, 
  ArrowPathIcon, 
  HeartIcon,
  FingerPrintIcon,
  CloudArrowUpIcon,
  QueueListIcon
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
  bulkIngestIPs: (rawList: string) => Promise<{ success: boolean; count?: number; error?: string }>;
  getQueueCount: () => Promise<number>;
}

export function AdminPortalClient() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [actions, setActions] = useState<AdminActions | null>(null);
  const [bulkList, setBulkList] = useState('');

  useEffect(() => {
    setIsMounted(true);
    // Late import of server actions to completely avoid build-time crawl
    import('@/app/actions/admin').then((mod) => {
      setActions(mod as unknown as AdminActions);
    });
  }, []);

  useEffect(() => {
    if (isAuthorized && actions) {
      const interval = setInterval(async () => {
        const count = await actions.getQueueCount();
        setQueueCount(count);
      }, 10000); // 10 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthorized, actions]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && actions) {
      setIsAuthorized(true);
      handleCheckHealth(actions);
    }
  };

  /**
   * Helper to chunk the IP list for sequential ingestion
   */
  const chunkList = (list: string[], size: number) => {
    const chunks = [];
    for (let i = 0; i < list.length; i += size) {
      chunks.push(list.slice(i, i + size));
    }
    return chunks;
  };

  const handleBulkUpload = async () => {
    if (!bulkList.trim() || !actions) return;
    setLoading(true);
    setStatus(null);

    const lines = bulkList.split('\n').map(l => l.trim()).filter(Boolean);
    const chunks = chunkList(lines, 500); // 500 IPs per chunk
    setUploadProgress({ current: 0, total: chunks.length });

    let successCount = 0;
    try {
      for (let i = 0; i < chunks.length; i++) {
        setUploadProgress({ current: i + 1, total: chunks.length });
        const res = await actions.bulkIngestIPs(chunks[i].join('\n'));
        
        if (!res.success) {
          throw new Error(res.error || 'CHUNK_UPLOAD_FAILED');
        }
        successCount += (res.count || 0);
      }

      setBulkList('');
      setStatus({ type: 'success', message: `QUEUED ${successCount} NODES ACROSS ${chunks.length} CHUNKS` });
      // Trigger background worker
      fetch('/api/worker/process-queue', { method: 'POST' }).catch(console.error);
    } catch (err) {
      console.error('Bulk Upload Failed:', err);
      setStatus({ type: 'error', message: `INGEST FAILED: ${err instanceof Error ? err.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
      setUploadProgress(null);
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
            <button type="submit" className="hidden">Enter</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 p-6 md:p-12 font-mono">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/5 pb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-rose-500 animate-pulse" />
              <h1 className="text-2xl font-black uppercase tracking-[0.25em]">Admin Portal</h1>
            </div>
            <p className="text-[10px] text-black/50 dark:text-white/30 uppercase tracking-[0.3em] font-black">
              Maintenance Terminal // Recursive Worker Active
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
             <ShieldCheckIcon className="w-8 h-8 text-black dark:text-white" />
             <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 px-2 py-0.5 rounded-none border border-emerald-500/20">Authorized</span>
          </div>
        </div>

        {/* Global Progress Ticker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/10 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <QueueListIcon className="w-6 h-6 text-cyan-500" />
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${queueCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${queueCount > 0 ? 'text-emerald-500' : 'text-white/40'}`}>
                      {queueCount > 0 ? 'WORKER: ACTIVE' : 'WORKER: SLEEPING'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500 bg-cyan-500/10 px-3 py-1">Live Worker Queue</span>
                  <button 
                    onClick={() => {
                      fetch('/api/worker/process-queue', { method: 'POST' }).catch(console.error);
                      setStatus({ type: 'success', message: 'WAKE SIGNAL SENT TO WORKER' });
                    }}
                    className="text-[8px] font-black uppercase tracking-widest text-black dark:text-white border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 px-3 py-1 transition-all active:scale-95"
                  >
                    Wake Worker
                  </button>
                </div>
             </div>
             <div className="space-y-1">
                <h2 className="text-[24px] font-black uppercase tracking-tighter">{queueCount.toLocaleString()}</h2>
                <p className="text-[10px] text-black/50 dark:text-white/30 uppercase tracking-widest font-black leading-relaxed">REMAINING IN UPLOAD_QUEUE // {Math.ceil(queueCount/50)} BATCHES TO GO</p>
             </div>
          </div>
          
          <div className="p-8 border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/10 space-y-4">
            <HeartIcon className={`w-6 h-6 ${healthData?.status === 'ONLINE' ? 'text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'} transition-all duration-500`} />
            <div className="space-y-2">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Table Nodes Health</h2>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest pt-2">
                 <span className="text-black/40 dark:text-white/20">System Latency:</span>
                 <span>{healthData?.latency || 'PROBING...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Ingest Section */}
        <div className="p-8 border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/10 space-y-6">
          <div className="flex items-center space-x-3">
            <CloudArrowUpIcon className="w-5 h-5 text-black/40 dark:text-white/20" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Bulk IP Ingestion (Chunked)</h2>
          </div>
          <textarea
            value={bulkList}
            onChange={(e) => setBulkList(e.target.value)}
            disabled={loading}
            placeholder="PASTE 5000+ IPs HERE (ONE PER LINE)..."
            className="w-full h-48 bg-black/5 dark:bg-[#050505] border border-black/10 dark:border-white/5 p-4 text-[10px] font-mono text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-all uppercase leading-relaxed custom-scrollbar"
          />
          <button 
            onClick={handleBulkUpload}
            disabled={loading || !bulkList.trim()}
            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black text-[11px] font-black uppercase tracking-[0.3em] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 relative overflow-hidden"
          >
            {loading ? (
               <span className="relative z-10">
                 {uploadProgress 
                   ? `Uploading Chunk ${uploadProgress.current}/${uploadProgress.total}...` 
                   : 'Processing Ingest...'}
               </span>
            ) : (
              'Initiate Background Scan & Deduplicate'
            )}
            {loading && uploadProgress && (
              <div 
                className="absolute inset-0 bg-emerald-500/10 transition-all duration-300 origin-left"
                style={{ transform: `scaleX(${uploadProgress.current / uploadProgress.total})` }}
              />
            )}
          </button>
          <p className="text-[9px] text-black/40 dark:text-white/10 uppercase italic">
            Automatic chunking enabled (500 IPs/sequenced batch). 10MB payload overhead active.
          </p>
        </div>

        {/* Maintenance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          <button 
            onClick={handleRefreshCache}
            disabled={loading}
            className="flex flex-col items-start p-8 border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/10 hover:border-cyan-500 transition-all text-left space-y-4"
          >
            <ArrowPathIcon className="w-5 h-5 text-black/40 dark:text-white/20 hover:text-cyan-500" />
            <div className="space-y-1">
               <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Force Revalidate</h2>
               <p className="text-[9px] text-black/50 dark:text-white/30 uppercase font-bold">Clear dashboard fragments and sync with newly promoted nodes.</p>
            </div>
          </button>

          <button 
            onClick={handlePurge}
            disabled={loading}
            className="flex flex-col items-start p-8 border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/10 hover:border-rose-500 transition-all text-left space-y-4"
          >
            <TrashIcon className="w-5 h-5 text-black/40 dark:text-white/20 hover:text-rose-500" />
            <div className="space-y-1">
               <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Purge Databases</h2>
               <p className="text-[9px] text-black/50 dark:text-white/30 uppercase font-bold">Wipe main nodes table. Use only for fleet reset.</p>
            </div>
          </button>
        </div>

        {status && (
          <div className={`p-4 text-[10px] font-black uppercase tracking-widest border animate-in slide-in-from-top-2
            ${status.type === 'success' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5' : 'border-rose-500/50 text-rose-500 bg-rose-500/5'}`}>
            &gt; {status.message}
          </div>
        )}

        {/* Console Logs Footer */}
        <div className="flex justify-center pt-8">
          <button 
            onClick={() => window.location.href = '/'}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 dark:text-white/10 hover:text-black dark:hover:text-white transition-colors"
          >
            Exit Terminal Session
          </button>
        </div>
      </div>
    </main>
  );
}
