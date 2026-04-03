import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { PAGE_SIZE_OPTIONS } from '@/constants';
import { useParams } from 'next/navigation';
import { OllamaService } from '@/types';
import { 
  BeakerIcon, 
  ArrowPathIcon, 
  TrashIcon, 
  Square2StackIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { ModelTestModal } from './ModelTestModal';
import { Disclosure, Transition } from '@headlessui/react';

interface ServiceListProps {
  services: OllamaService[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isClient: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onBenchmark: (url: string) => void;
  onRemove: (url: string) => void;
}

export function ServiceList({
  services,
  currentPage,
  pageSize,
  totalPages,
  isClient,
  onPageChange,
  onPageSizeChange,
  onBenchmark,
  onRemove,
}: ServiceListProps) {
  const t = useTranslations();
  useParams();

  const [selectedService, setSelectedService] = useState<OllamaService | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Generate page numbers array
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleTest = (e: React.MouseEvent, service: OllamaService) => {
    e.stopPropagation();
    setSelectedService(service);
    setIsTestModalOpen(true);
  };

  const handleCopyUrl = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    const btn = e.currentTarget as HTMLButtonElement;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
    setTimeout(() => {
      btn.innerHTML = originalContent;
    }, 2000);
  };

  const handleRefresh = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    onBenchmark(url);
  };

  const handleRemove = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    onRemove(url);
  };

  return (
    <>
      <div className="bg-white/5 backdrop-blur-xl rounded-b-2xl overflow-hidden border-t border-white/10">
        <div className="p-6 space-y-5">
          
          {services.map((service) => {
            const isOffline = service.status === 'error';
            const isOnline = service.status === 'success' || service.status === 'fake';
            
            return (
              <Disclosure key={service.server} as="div" className={`
                relative group overflow-hidden rounded-3xl border transition-all duration-500
                ${isOffline 
                  ? 'bg-rose-500/[0.02] border-rose-500/10 shadow-[0_0_30px_rgba(239,68,68,0.05)]' 
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05] shadow-lg shadow-black/20'}
              `}>
                {({ open }) => (
                  <>
                    <Disclosure.Button 
                      className={`w-full text-left px-7 py-6 flex items-center justify-between group/btn
                        ${isOffline ? 'cursor-default' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-center space-x-8 flex-1 overflow-hidden">
                        {/* Status Icon with Pulse */}
                        <div className="relative flex-shrink-0">
                          <div className={`p-3 rounded-2xl transition-all duration-500
                            ${isOffline 
                              ? 'bg-rose-500/10 text-rose-500 opacity-60' 
                              : 'bg-emerald-500/10 text-emerald-400 animate-heartbeat-pulse'}
                          `}>
                            <SignalIcon className="w-6 h-6" />
                          </div>
                        </div>

                        <div className="flex flex-col space-y-1 overflow-hidden">
                          <div className="flex items-center space-x-3">
                            <a
                              href={service.server}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`text-lg font-bold tracking-tight transition-colors duration-200 truncate
                                ${isOffline ? 'text-slate-500' : 'text-white hover:text-cyan-400'}`}
                            >
                              {service.server.replace('http://', '').replace('https://', '')}
                            </a>
                            {service.isFake && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black
                                bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                                {t('detect.fake')}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {isOffline ? (
                              <span className="text-rose-400 opacity-80 flex items-center">
                                <ExclamationCircleIcon className="w-4 h-4 mr-1.5" />
                                Offline
                              </span>
                            ) : (
                              <>
                                <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/5 text-cyan-400 shadow-inner">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                  <span>{service.models.length} Models</span>
                                </span>
                                <span className="text-slate-400">{service.tps.toFixed(2)} TPS</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 ml-6">
                        {/* Quick Actions */}
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <button
                            onClick={(e) => handleCopyUrl(e, service.server)}
                            className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/10 active:scale-95"
                            title="Copy URL"
                          >
                            <Square2StackIcon className="h-6 w-6" />
                          </button>
                          <button
                            onClick={(e) => handleRefresh(e, service.server)}
                            disabled={service.loading}
                            className={`p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/10 active:scale-95
                              ${service.loading ? 'animate-spin opacity-50' : ''}
                            `}
                            title="Refresh benchmark"
                          >
                            <ArrowPathIcon className="h-6 w-6" />
                          </button>
                          <button
                            onClick={(e) => handleTest(e, service)}
                            disabled={service.loading || isOffline || service.models.length === 0}
                            className={`hidden lg:inline-flex items-center px-6 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 uppercase tracking-widest
                              ${service.loading || isOffline || service.models.length === 0
                                ? 'bg-white/5 text-slate-600 cursor-not-allowed opacity-50'
                                : 'bg-white/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/10'}
                            `}
                          >
                            <BeakerIcon className="h-5 w-5 mr-2" />
                            Test
                          </button>
                          {/* Always functional Delete button */}
                          <button
                            onClick={(e) => handleRemove(e, service.server)}
                            className="p-3 rounded-2xl text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 border border-transparent hover:border-rose-500/20 active:scale-95"
                            title="Remove Server"
                          >
                            <TrashIcon className="h-6 w-6" />
                          </button>
                        </div>
                        {isOnline && !service.loading && (
                          <div className={`transition-transform duration-500 ease-out p-1
                            ${open ? 'rotate-180 text-cyan-400' : 'text-slate-600 group-hover/btn:text-slate-400'}
                          `}>
                            <ChevronDownIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </Disclosure.Button>

                    <Transition
                      show={open && isOnline}
                      enter="transition-all duration-500 ease-out"
                      enterFrom="max-h-0 opacity-0"
                      enterTo="max-h-[1000px] opacity-100"
                      leave="transition-all duration-300 ease-in"
                      leaveFrom="max-h-[1000px] opacity-100"
                      leaveTo="max-h-0 opacity-0"
                    >
                      <Disclosure.Panel static className="px-8 pb-8 pt-2">
                        <div className="space-y-6 pt-4 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                              Deployed Models
                            </h4>
                            {isClient && (
                              <span className="text-[10px] text-slate-600 font-mono italic">
                                Updated {formatDistanceToNow(new Date(service.lastUpdate), { addSuffix: true, locale: enUS })}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {service.models.map((model, idx) => (
                              <div
                                key={idx}
                                className="px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs font-bold text-slate-300 
                                  hover:bg-white/[0.08] hover:border-cyan-500/30 hover:text-cyan-400 hover:-translate-y-1 
                                  transition-all duration-300 text-center truncate cursor-default shadow-sm hover:shadow-cyan-500/10"
                                title={model}
                              >
                                {model}
                              </div>
                            ))}
                          </div>
                        </div>
                      </Disclosure.Panel>
                    </Transition>
                  </>
                )}
              </Disclosure>
            );
          })}
        </div>

        {/* Footer info & pagination */}
        <div className="px-8 py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 bg-black/10">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col space-y-1">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('pagination.perPage')}</span>
              <div className="relative group">
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="appearance-none bg-white/5 border border-white/10 rounded-2xl text-slate-200 pl-5 pr-12 py-2.5 text-xs font-black
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer hover:bg-white/10 transition-all duration-300"
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size} className="bg-slate-900 border-none">{size}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-slate-400 transition-colors">
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="h-10 w-px bg-white/10 mx-2"></div>
            
            <div className="flex flex-col space-y-1">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Global Status</span>
              <div className="text-xs font-black text-slate-400 tracking-tighter">
                {t('pagination.showing', {
                  from: services.length === 0 ? 0 : (currentPage - 1) * pageSize + 1,
                  to: Math.min(currentPage * pageSize, services.length),
                  total: services.length
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onPageChange(1)}
                  disabled={currentPage === 1}
                  className={`flex items-center px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
                    ${currentPage === 1
                      ? 'text-slate-800 cursor-not-allowed opacity-20'
                      : 'text-slate-500 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {t('pagination.first')}
                </button>

                <div className="flex items-center space-x-1.5 px-2 my-2 py-1.5 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && onPageChange(page)}
                      disabled={page === '...'}
                      className={`min-w-[40px] h-10 rounded-2xl text-[11px] font-black transition-all duration-500 uppercase tracking-tighter
                        ${page === currentPage
                          ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105'
                          : page === '...'
                            ? 'text-slate-700 cursor-default'
                            : 'text-slate-500 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
                    ${currentPage === totalPages
                      ? 'text-slate-800 cursor-not-allowed opacity-20'
                      : 'text-slate-500 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {t('pagination.last')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedService && (
        <ModelTestModal
          isOpen={isTestModalOpen}
          onClose={() => {
            setIsTestModalOpen(false);
            setSelectedService(null);
          }}
          server={selectedService.server}
          models={selectedService.models}
        />
      )}
    </>
  );
}