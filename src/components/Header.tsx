import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Modal } from './Modal';
import { OllamaService } from '@/types';

interface HeaderProps {
  countdown: number;
  detectingServices: Set<string>;
  detectedResults: OllamaService[];
  onDetect: (urls: string[]) => Promise<void>;
}

export function Header({ countdown, detectingServices, detectedResults, onDetect }: HeaderProps) {
  const t = useTranslations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [detectResults, setDetectResults] = useState<OllamaService[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // Keep track of servers that have already been updated
  const updatedServersRef = useRef(new Set<string>());

  const handleDetect = async () => {
    const urls = urlInput.split('\n').filter(url => url.trim());
    if (urls.length === 0) return;
    
    setIsDetecting(true);
    try {
      // Filter out new service addresses
      const existingUrls = new Set(detectResults.map(result => result.server));
      const newUrls = urls.filter(url => !existingUrls.has(url));
      
      // Update status of existing services to loading
      setDetectResults(prev => prev.map(result => 
        urls.includes(result.server) 
          ? { ...result, loading: true, status: 'loading' as const }
          : result
      ));

      // Add new services
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
      
      // Start detection
      await onDetect(urls);
    } finally {
      setIsDetecting(false);
    }
  };

  // Update status of detection results
  useEffect(() => {
    setDetectResults(prev => 
      prev.map(result => {
        const isDetecting = detectingServices.has(result.server);
        // Find latest detection result
        const latestResult = detectedResults.find(r => r.server === result.server);
        
        if (latestResult && !isDetecting) {
          // If detection is successful and has available models, and status has changed, 
          // and it hasn't been updated yet, asynchronously update the server list
          if (latestResult.status === 'success' && 
              latestResult.models.length > 0 && 
              result.status !== 'success' &&
              !updatedServersRef.current.has(latestResult.server) &&
              !latestResult.isFake) {
            // Mark this server as updated
            updatedServersRef.current.add(latestResult.server);
            
            fetch('/api/update-servers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ server: latestResult.server }),
            })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                console.log(data.exists 
                  ? `Server already in monitor list: ${latestResult.server}`
                  : `Server added to monitor list: ${latestResult.server}`
                );
              }
            })
            .catch(error => {
              // If update fails, remove the mark to retry later
              updatedServersRef.current.delete(latestResult.server);
              console.error('Failed to update server list:', error);
            });
          }
          
          // If there is a latest result and not currently detecting, use the latest result
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

  // Clear records of updated servers when resetting detection
  const handleNewDetection = () => {
    setDetectResults([]);
    setUrlInput('');
    updatedServersRef.current.clear();
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(detectResults, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ollama-detection-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1">
      <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
        {t('title')}
      </h1>
      <button
        onClick={() => {
          setIsModalOpen(true);
          setDetectResults([]);
          setUrlInput('');
        }}
        disabled={isDetecting || countdown > 0}
        className={`mt-6 inline-flex items-center px-6 py-3 rounded-xl shadow-lg text-sm font-semibold
          transition-all duration-300 ease-in-out glass-button
          ${isDetecting || countdown > 0 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:scale-105 active:scale-95 text-cyan-400 hover:text-cyan-300'
          }`}
      >
        <MagnifyingGlassIcon className={`-ml-1 mr-2 h-5 w-5 ${isDetecting ? 'animate-spin' : ''}`} />
        {isDetecting ? t('header.detecting') :
         countdown > 0 ? t('header.detectCountdown', { countdown }) : t('header.detect')}
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('detect.title')}
      >
        <div className="space-y-6">
          {detectResults.length === 0 ? (
            <>
              <p className="text-sm text-slate-400">
                {t('detect.description')}
              </p>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={t('detect.placeholder')}
                className="w-full h-48 px-4 py-3 text-sm bg-black/40 border border-white/10 rounded-xl 
                  text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 
                  focus:border-cyan-500/50 resize-none font-mono transition-all duration-300"
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white
                    transition-all duration-200"
                >
                  {t('detect.cancel')}
                </button>
                <button
                  onClick={handleDetect}
                  disabled={!urlInput.trim() || isDetecting || countdown > 0}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all duration-300
                    ${!urlInput.trim() || isDetecting || countdown > 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white hover:shadow-cyan-500/20'
                    }`}
                >
                  {isDetecting ? t('header.detecting') : 
                   countdown > 0 ? t('header.detectCountdown', { countdown }) : 
                   t('detect.confirm')}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {detectResults.map((result) => (
                  <div key={result.server} className={`p-5 glass-card rounded-2xl ${result.loading ? 'animate-pulse' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <a
                          href={result.server}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors duration-200"
                        >
                          {result.server}
                        </a>
                        {result.status === 'error' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {t('detect.error')}
                          </span>
                        )}
                        {result.status === 'success' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {t('detect.success')}
                          </span>
                        )}
                        {result.status === 'fake' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {t('detect.fake')}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-mono text-slate-400">
                        {result.loading ? (
                          <div className="h-4 bg-slate-700/50 rounded animate-pulse w-16"></div>
                        ) : result.status === 'error' ? (
                          <span className="text-rose-400">-</span>
                        ) : (
                          t('service.tps', { value: result.tps.toFixed(2) })
                        )}
                      </span>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('service.availableModels')}</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.loading ? (
                          <div className="h-6 bg-slate-700/50 rounded animate-pulse w-24"></div>
                        ) : result.status === 'error' ? (
                          <span className="text-rose-400/70 text-sm">{t('detect.unavailable')}</span>
                        ) : (
                          result.models.map((model, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium
                                bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            >
                              {model}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-4 pt-6 border-t border-white/5">
                <button
                  onClick={handleNewDetection}
                  disabled={countdown > 0}
                  className={`px-5 py-2.5 text-sm font-medium transition-all duration-200
                    ${countdown > 0
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {countdown > 0 
                    ? t('header.detectCountdown', { countdown })
                    : t('detect.newDetection')}
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-semibold
                    bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all duration-300"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  {t('detect.download')}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}