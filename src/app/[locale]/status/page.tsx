'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  CommandLineIcon, 
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';

interface LogEntry {
  id: string;
  timestamp: string;
  status: 'scanning' | 'success' | 'fail' | 'complete' | 'error';
  message: string;
  url?: string;
  progress?: number;
}

function StatusContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const startDiscovery = async (urls: string[]) => {
    setIsScanning(true);
    setLogs([]);
    setProgress(0);

    try {
      const response = await fetch('/api/nodes/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      if (!response.body) throw new Error('No stream body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim());

        lines.forEach(line => {
          try {
            const data = JSON.parse(line);
            const entry: LogEntry = {
              id: Math.random().toString(36).substr(2, 9),
              timestamp: new Date().toLocaleTimeString(),
              ...data
            };
            
            setLogs(prev => [...prev.slice(-100), entry]); // Max 100 logs
            if (data.progress !== undefined) setProgress(data.progress);
            if (data.status === 'complete') setIsScanning(false);
          } catch (e) {
            console.error('Failed to parse stream chunk:', e);
          }
        });
      }
    } catch (error) {
      console.error('Discovery stream failed:', error);
      setIsScanning(false);
      setLogs(prev => [...prev, {
        id: 'err',
        timestamp: new Date().toLocaleTimeString(),
        status: 'error',
        message: 'CONNECTION INTERRUPTED'
      }]);
    }
  };

  useEffect(() => {
    const urlsParam = searchParams.get('urls');
    if (urlsParam) {
      const urls = urlsParam.split(',').filter(u => u.trim());
      if (urls.length > 0) {
        startDiscovery(urls);
      }
    }

    // Ephemeral state: clears logs after 1 hour automatically
    const timer = setTimeout(() => setLogs([]), 3600000);
    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-12 border-b border-border pb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm transition-colors text-zinc-500"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black uppercase tracking-[0.2em]">{t('statusMonitor')}</h1>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-muted">
          <div className={`status-indicator ${isScanning ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>{isScanning ? 'Streaming Discovery' : 'Standby'}</span>
        </div>
      </div>

      {/* Minimal Progress Bar */}
      <div className="mb-12 space-y-3">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted">
          <span>Global Queue Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cyan-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Activity Log Terminal */}
      <div className="bg-white dark:bg-black/40 border border-border shadow-sm rounded-sm overflow-hidden flex flex-col h-[60vh]">
        <div className="px-4 py-2 border-b border-border bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CommandLineIcon className="w-3.5 h-3.5 text-muted" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Core.Discovery.Logs</span>
          </div>
          {isScanning && <ArrowPathIcon className="w-3 h-3 text-cyan-500 animate-spin" />}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono custom-scrollbar">
          {logs.length === 0 && !isScanning && (
            <div className="h-full flex flex-col items-center justify-center text-muted opacity-30 gap-3">
              <CommandLineIcon className="w-8 h-8" />
              <p className="text-[10px] font-black uppercase tracking-widest">No active stream found</p>
            </div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-3 text-[11px] animate-in fade-in slide-in-from-left-1 duration-300">
              <span className="text-zinc-400 dark:text-zinc-600 shrink-0">[{log.timestamp}]</span>
              <span className={`uppercase font-black tracking-tighter shrink-0 w-16
                ${log.status === 'success' ? 'text-emerald-500' : 
                  log.status === 'fail' ? 'text-rose-500' : 
                  log.status === 'scanning' ? 'text-cyan-500' : 
                  log.status === 'complete' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {log.status}
              </span>
              <span className="text-zinc-700 dark:text-zinc-300 truncate tracking-wide">
                {log.message}
              </span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        <div className="px-4 py-6 border-t border-border flex justify-end bg-zinc-50 dark:bg-zinc-900/10">
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-2 border border-border bg-background hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Return to Dashboard
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-[9px] font-black text-muted uppercase tracking-widest opacity-60">
        Stateful privacy enabled // IP masking [v1.0] // All local logs purged after 60m
      </p>
    </div>
  );
}

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-background dark:bg-[#0f1117] text-foreground transition-colors duration-300">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <ArrowPathIcon className="w-6 h-6 text-cyan-500 animate-spin" />
        </div>
      }>
        <StatusContent />
      </Suspense>
    </main>
  );
}
