import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Modal } from './Modal';
import { OllamaService } from '@/types';

interface HeaderProps {
  countdown: number;
  detectingServices: Set<string>;
  detectedResults: OllamaService[];
  onDetect: (urls: string[]) => Promise<void>;
  totalNodes: number;
  onlineNodes: number;
}

export function Header({ 
  countdown, 
  detectingServices, 
  detectedResults, 
  onDetect,
  totalNodes,
  onlineNodes
}: HeaderProps) {
  const t = useTranslations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [detectResults, setDetectResults] = useState<OllamaService[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetect = async () => {
    const urls = urlInput.split('\n').filter(url => url.trim());
    if (urls.length === 0) return;
    
    setIsDetecting(true);
    try {
      const existingUrls = new Set(detectResults.map(result => result.server));
      const newUrls = urls.filter(url => !existingUrls.has(url));
      
      setDetectResults(prev => prev.map(result => 
        urls.includes(result.server) 
          ? { ...result, loading: true, status: 'loading' as const }
          : result
      ));

      if (newUrls.length > 0) {
        const initialServices = newUrls.map(url => ({
          server: url,
          models: [],
          tps: 0,
          lastUpdate: new Date().toISOString(),
          loading: true,
          status: 'loading' as const
        }));
        setDetectResults(prev => [...prev, ...initialServices]);
      }
      
      await onDetect(urls);
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    setDetectResults(prev => 
      prev.map(result => {
        const isDetecting = detectingServices.has(result.server);
        const latestResult = detectedResults.find(r => r.server === result.server);
        
        if (latestResult && !isDetecting) {
          return {
            ...latestResult,
            loading: false,
            status: latestResult.models.length > 0 ? 'success' as const : 'error' as const
          };
        }
        
        return {
          ...result,
          loading: isDetecting,
          status: isDetecting ? 'loading' as const : result.models.length > 0 ? 'success' as const : 'error' as const
        };
      })
    );
  }, [detectingServices, detectedResults]);

  const handleNewDetection = () => {
    setDetectResults([]);
    setUrlInput('');
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(detectResults, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ollama-nodes-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="w-full space-y-6">
      {/* Global Stats Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border border-[#2d2d2d] rounded text-[10px] font-black uppercase tracking-widest text-zinc-500">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <CircleStackIcon className="w-3 h-3 text-zinc-600" />
            <span>Total Nodes: <span className="text-zinc-200">{totalNodes}</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="w-3 h-3 text-emerald-500/50" />
            <span>Online: <span className="text-emerald-500">{onlineNodes}</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircleIcon className="w-3 h-3 text-rose-500/50" />
            <span>Pruned/Offline: <span className="text-rose-500">{totalNodes - onlineNodes}</span></span>
          </div>
        </div>
        <div className="flex items-center space-x-2 opacity-50">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Systems Nominal</span>
        </div>
      </div>

      <div className="flex items-end justify-between border-b border-[#2d2d2d] pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">
            {t('title')}
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest opacity-80">
            Automated Ollama Node Monitoring & Discovery
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setDetectResults([]);
            setUrlInput('');
          }}
          disabled={isDetecting || countdown > 0}
          className={`flex items-center px-4 py-2 border border-[#2d2d2d] bg-zinc-900 text-[10px] font-black uppercase tracking-widest
            transition-colors duration-200
            ${isDetecting || countdown > 0 
              ? 'opacity-30 cursor-not-allowed' 
              : 'hover:bg-zinc-800 text-cyan-500 hover:text-cyan-400'
            }`}
        >
          <MagnifyingGlassIcon className={`mr-2 h-3.5 w-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
          {isDetecting ? 'Scanning' :
           countdown > 0 ? `Reset in ${countdown}s` : 'Scan Nodes'}
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Node Discovery Scan"
      >
        <div className="space-y-4">
          {detectResults.length === 0 ? (
            <>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest opacity-80 mb-2">
                Enter Ollama Node Addresses (One Per Line)
              </p>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://192.168.1.10:11434"
                className="w-full h-40 px-3 py-2 text-xs bg-black border border-[#2d2d2d] rounded-sm 
                  text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-cyan-500/50 
                  resize-none font-mono"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDetect}
                  disabled={!urlInput.trim() || isDetecting || countdown > 0}
                  className={`px-6 py-2 border text-[10px] font-black uppercase tracking-widest shadow-sm
                    ${!urlInput.trim() || isDetecting || countdown > 0
                      ? 'border-zinc-800 bg-zinc-950 text-zinc-700 cursor-not-allowed'
                      : 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 active:scale-95'
                    }`}
                >
                  Confirm Scan
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {detectResults.map((result) => (
                  <div key={result.server} className={`px-4 py-3 bg-zinc-900 border border-[#2d2d2d] rounded-sm ${result.loading ? 'animate-pulse' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-zinc-200">{result.server}</span>
                        {result.status === 'error' && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            Failed
                          </span>
                        )}
                        {result.status === 'success' && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Live
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 font-bold">
                        {result.loading ? '...' : result.status === 'error' ? '0.00 TPS' : `${result.tps.toFixed(2)} TPS`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#2d2d2d]">
                <button
                  onClick={handleNewDetection}
                  disabled={countdown > 0}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest
                    ${countdown > 0 ? 'text-zinc-800' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  New Scan
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-6 py-2 bg-zinc-900 border border-[#2d2d2d] text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:bg-zinc-800"
                >
                  <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-2" />
                  Save Export
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}