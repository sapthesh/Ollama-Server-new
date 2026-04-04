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
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  countdown: number;
  detectingServices: Set<string>;
  detectedResults: OllamaService[];
  onDetect: (urls: string[]) => Promise<void>;
  totalNodes: number;
  onlineNodes: number;
}

export function Header({ 
  detectingServices, 
  detectedResults, 
  onDetect,
  totalNodes,
  onlineNodes
}: HeaderProps) {
  const _t = useTranslations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [detectResults, setDetectResults] = useState<OllamaService[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetect = async () => {
    const urls = urlInput.split('\n').filter(url => url.trim());
    if (urls.length === 0) return;
    
    setIsDetecting(true);
    try {
      await onDetect(urls);
      setIsModalOpen(false); // Navigate is handled by parent, close modal
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    setDetectResults(prev => 
      prev.map(result => {
        const isCurrentlyDetecting = detectingServices.has(result.server);
        const latestResult = detectedResults.find(r => r.server === result.server);
        
        if (latestResult && !isCurrentlyDetecting) {
          return {
            ...latestResult,
            loading: false,
            status: latestResult.models.length > 0 ? 'success' as const : 'error' as const
          };
        }
        
        return {
          ...result,
          loading: isCurrentlyDetecting,
          status: isCurrentlyDetecting ? 'loading' as const : result.models.length > 0 ? 'success' as const : 'error' as const
        };
      })
    );
  }, [detectingServices, detectedResults]);

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
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-zinc-900 border border-border rounded text-[10px] font-black uppercase tracking-widest text-muted">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <CircleStackIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
            <span>Total: <span className="text-zinc-800 dark:text-zinc-200">{totalNodes}</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="w-3 h-3 text-emerald-500/50" />
            <span>Nodes Online: <span className="text-emerald-500">{onlineNodes}</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircleIcon className="w-3 h-3 text-rose-500/50" />
            <span>Pruned: <span className="text-rose-500">{totalNodes - onlineNodes}</span></span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 opacity-50 mr-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Operational</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex items-end justify-between border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-zinc-800 dark:text-white tracking-widest uppercase">
            {_t('title')}
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-600 uppercase tracking-widest opacity-80">
            Automated Ollama Node Monitoring & Discovery
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setDetectResults([]);
            setUrlInput('');
          }}
          disabled={isDetecting}
          className={`flex items-center px-4 py-2 border border-border bg-white dark:bg-zinc-900 text-[10px] font-black uppercase tracking-widest
            transition-all duration-200 shadow-sm active:scale-95
            ${isDetecting
              ? 'opacity-30 cursor-not-allowed' 
              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-cyan-500'
            }`}
        >
          <MagnifyingGlassIcon className={`mr-2 h-3.5 w-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
          {isDetecting ? 'Scanning' : 'Start Multi-Scan'}
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
                Enter Addresses (One Per Line)
              </p>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://192.168.1.10:11434"
                className="w-full h-40 px-3 py-2 text-xs bg-white dark:bg-black border border-border rounded-sm 
                  text-zinc-800 dark:text-zinc-200 placeholder-zinc-300 dark:placeholder-zinc-700 
                  focus:outline-none focus:border-cyan-500/50 resize-none font-mono tracking-tight"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDetect}
                  disabled={!urlInput.trim() || isDetecting}
                  className={`px-6 py-2 border text-[10px] font-black uppercase tracking-widest shadow-sm
                    ${!urlInput.trim() || isDetecting
                      ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                      : 'border-cyan-500/50 bg-cyan-500/5 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 active:scale-95'
                    }`}
                >
                  Queue Discovery
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {detectResults.map((result) => (
                  <div key={result.server} className={`px-4 py-3 bg-white dark:bg-zinc-900 border border-border rounded-sm ${result.loading ? 'animate-pulse' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{result.server}</span>
                        {result.status === 'error' && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            Pruned
                          </span>
                        )}
                        {result.status === 'success' && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Valid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-6 py-2 bg-white dark:bg-zinc-900 border border-border text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
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