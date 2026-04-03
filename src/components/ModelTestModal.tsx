import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from './Modal';
import { BeakerIcon, StopIcon } from '@heroicons/react/24/outline';

interface ModelTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: string;
  models: string[];
}

export function ModelTestModal({ isOpen, onClose, server, models }: ModelTestModalProps) {
  const t = useTranslations();
  const [selectedModel, setSelectedModel] = useState(models[0] || '');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const responseEndRef = useRef<HTMLDivElement>(null);
  const [isWaiting, setIsWaiting] = useState(false);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTest = async () => {
    if (!selectedModel || !prompt) return;
    setIsWaiting(true);
    
    setIsGenerating(true);
    // Clear previous response
    setResponse('');

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server,
          model: selectedModel,
          prompt,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        setIsWaiting(false);
        setResponse(prev => prev + text);
        scrollToBottom();
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setResponse(prev => prev + '\n[Generation stopped]');
        return;
      }
      console.error('Generation error:', error);
      setResponse(prev => prev + '\n' + t('modelTest.error'));
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      scrollToBottom();
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modelTest.title')}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            {t('modelTest.selectModel')}
          </label>
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="appearance-none w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl
                text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                hover:border-white/20 transition-all duration-300 cursor-pointer"
            >
              {models.map(model => (
                <option key={model} value={model} className="bg-slate-900">{model}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            {t('modelTest.prompt')}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('modelTest.promptPlaceholder')}
            className="w-full h-28 px-4 py-3 bg-black/20 border border-white/10 rounded-xl
              text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2
              focus:ring-cyan-500/50 resize-none transition-all duration-300"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            {t('modelTest.response')}
          </label>
          <div className="relative group">
            <div className={`w-full h-56 px-4 py-3 bg-black/40 border border-white/10 rounded-xl
              text-slate-200 overflow-y-auto custom-scrollbar font-mono text-sm whitespace-pre-wrap
              transition-all duration-300 ${isGenerating ? 'border-cyan-500/50 ring-2 ring-cyan-500/20' : 'group-hover:border-white/20'}`}>
              <div className={isGenerating ? 'opacity-90' : ''}>
                {isWaiting && !response ? (
                  <span className="text-slate-500 animate-pulse italic">{t('modelTest.responseEmpty')}</span>
                ) : response}
                {isGenerating && <span className="inline-block w-2 h-4 ml-1 bg-cyan-500 animate-pulse align-middle"></span>}
              </div>
              <div ref={responseEndRef} />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-100
              uppercase tracking-widest transition-all duration-200"
          >
            {t('modelTest.close')}
          </button>
          {isGenerating ? (
            <button
              onClick={handleStopGeneration}
              className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest
                bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white
                transition-all duration-300 border border-rose-500/20 shadow-lg shadow-rose-500/10"
            >
              <StopIcon className="h-5 w-5 mr-2" />
              {t('modelTest.stop')}
            </button>
          ) : (
            <button
              onClick={handleTest}
              disabled={!selectedModel || !prompt}
              className={`inline-flex items-center px-8 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300
                ${!selectedModel || !prompt
                  ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-500/20'
                }`}
            >
              <BeakerIcon className="h-5 w-5 mr-2" />
              {t('modelTest.test')}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}