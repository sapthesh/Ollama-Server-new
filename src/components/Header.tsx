import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  XCircleIcon,
  FingerPrintIcon
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
  dbStatus?: 'ONLINE' | 'OFFLINE' | 'CHECKING';
}

export function Header({ 
  detectingServices, 
  detectedResults, 
  onDetect,
  totalNodes,
  onlineNodes,
  dbStatus = 'CHECKING'
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
      setIsModalOpen(false);
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
      {/* Stealth Global Stats Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-black border border-border text-[10px] font-bold uppercase tracking-widest text-muted">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <CircleStackIcon className="w-3 h-3" />
            <span>Nodes: <span className="text-foreground">{totalNodes}</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="w-3 h-3 text-emerald-500" />
            <span>Online: <span className="text-emerald-500">{onlineNodes}</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircleIcon className="w-3 h-3 text-rose-500" />
            <span>Pruned: <span className="text-rose-500">{totalNodes - onlineNodes}</span></span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* DB Connectivity Indicator */}
          <div className="flex items-center space-x-2 mr-4 border-r border-border pr-4 h-4">
            <div className={`w-1.5 h-1.5 rounded-none ${
              dbStatus === 'ONLINE' ? 'bg-emerald-500' : 
              dbStatus === 'OFFLINE' ? 'bg-rose-500 animate-pulse' : 'bg-charcoal'
            }`} />
            <span className="text-[9px] font-black">DB: {dbStatus}</span>
          </div>

          <div className="flex items-center space-x-2 opacity-50 mr-4">
            <div className="w-1 h-1 rounded-none bg-emerald-500"></div>
            <span>Operational</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex items-end justify-between border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <FingerPrintIcon className="w-4 h-4 text-foreground" />
            <h1 className="text-xl font-black text-foreground tracking-widest uppercase">
              {_t('title')}
            </h1>
          </div>
          <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] opacity-60">
            Automated Ollama Node Monitoring // Stealth Edition
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setDetectResults([]);
            setUrlInput('');
          }}
          disabled={isDetecting}
          className={`flex items-center px-4 py-2 border border-border bg-background text-[10px] font-black uppercase tracking-widest
            transition-all duration-100 active:scale-95
            ${isDetecting
              ? 'opacity-30 cursor-not-allowed' 
              : 'hover:bg-foreground hover:text-background text-foreground'
            }`}
        >
          <MagnifyingGlassIcon className={`mr-2 h-3.5 w-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
          {isDetecting ? 'Scanning' : 'Start Multi-Scan'}
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="NODE_DISCOVERY_BATCH"
      >
        <div className="space-y-4">
          {detectResults.length === 0 ? (
            <>
              <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2">
                &gt; Enter Targets (Newline Separated)
              </p>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://10.0.0.1:11434"
                className="w-full h-40 px-3 py-2 text-[10px] bg-white dark:bg-black border border-border rounded-none 
                  text-foreground placeholder-muted focus:outline-none focus:border-foreground resize-none font-mono tracking-tight"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDetect}
                  disabled={!urlInput.trim() || isDetecting}
                  className={`px-6 py-2 border text-[10px] font-black uppercase tracking-widest
                    ${!urlInput.trim() || isDetecting
                      ? 'border-border text-muted cursor-not-allowed'
                      : 'border-foreground bg-foreground text-background active:scale-95'
                    }`}
                >
                  Confirm Batch
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {detectResults.map((result) => (
                  <div key={result.server} className="px-4 py-3 bg-background border border-border rounded-none">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] font-bold text-foreground">{result.server}</span>
                        {result.status === 'error' && (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-rose-500 text-white">
                            Pruned
                          </span>
                        )}
                        {result.status === 'success' && (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-emerald-500 text-white">
                            Resolved
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
                  className="inline-flex items-center px-6 py-2 bg-background border border-border text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background"
                >
                  <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-2" />
                  Save Manifest
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}