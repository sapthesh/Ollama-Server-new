'use client';

import { useState } from 'react';
import { FingerPrintIcon } from '@heroicons/react/24/outline';
import { loginGlobal } from '@/app/actions/admin';

export default function GlobalLoginGate() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await loginGlobal(password);
      if (res.success) {
        // Force hard reload to re-run server components and bypass cache
        window.location.reload();
      } else {
        setError(res.error || 'Access Denied');
      }
    } catch (_err) {
      setError('System Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4 font-mono transition-colors duration-300">
      <div className="w-full max-w-xs space-y-12 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-white/5 rounded-none border border-white/10 shadow-2xl">
            <FingerPrintIcon className="w-10 h-10 text-white" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xs font-black uppercase tracking-[0.5em] text-white">System.Lock</h1>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">Global Authorization Required</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative group">
            <input
              type="password"
              autoFocus
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b-2 border-white/10 py-3 text-center text-white 
                focus:outline-none focus:border-white transition-all text-sm tracking-[0.8em] font-black
                placeholder:text-white/5 disabled:opacity-50"
              placeholder="••••••"
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-white transition-all duration-500 group-focus-within:w-full" />
          </div>
          {error && (
            <div className="text-[9px] text-rose-500 text-center font-black uppercase tracking-widest animate-pulse">
              {error}
            </div>
          )}
          <button type="submit" className="hidden">Enter</button>
        </form>
      </div>
    </main>
  );
}
