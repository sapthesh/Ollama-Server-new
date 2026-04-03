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
  ExclamationCircleIcon
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
    // Simple way to show it worked without a toast
    const btn = e.currentTarget as HTMLButtonElement;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
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
      <div className="bg-white/5 backdrop-blur-md rounded-b-2xl overflow-hidden">
        <div className="p-4 space-y-4">
          {services.map((service) => {
            const isOffline = service.status === 'error';
            
            return (
              <Disclosure key={service.server} as="div" className="glass-card overflow-hidden">
                {({ open }) => (
                  <>
                    <Disclosure.Button 
                      disabled={isOffline || service.loading}
                      className={`w-full text-left px-6 py-5 flex items-center justify-between transition-all duration-300
                        ${isOffline ? 'opacity-75 cursor-not-allowed' : 'hover:bg-white/5 active:bg-white/10'}
                        ${open ? 'bg-white/5 border-b border-white/5' : ''}
                      `}
                    >
                      <div className="flex items-center space-x-6 flex-1 overflow-hidden">
                        <div className="flex-shrink-0 flex items-center space-x-3">
                          <a
                            href={service.server}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors duration-200 truncate max-w-[200px] sm:max-w-md"
                          >
                            {service.server}
                          </a>
                          {service.isFake && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black
                              bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-tighter">
                              {t('detect.fake')}
                            </span>
                          )}
                        </div>

                        <div className="hidden md:flex items-center space-x-4 flex-1">
                          {service.loading ? (
                            <div className="h-6 bg-white/10 rounded-lg animate-pulse w-24"></div>
                          ) : isOffline ? (
                            <span className="flex items-center text-rose-400 text-xs font-bold uppercase tracking-widest">
                              <ExclamationCircleIcon className="w-4 h-4 mr-1.5" />
                              Server Offline
                            </span>
                          ) : (
                            <>
                              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[11px] font-bold border border-cyan-500/20 uppercase tracking-widest">
                                {service.models.length} {service.models.length === 1 ? 'Model' : 'Models'}
                              </span>
                              <span className="text-slate-300 font-mono text-sm font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                {service.tps.toFixed(2)} <span className="text-[10px] text-slate-500 uppercase ml-0.5">TPS</span>
                              </span>
                              {isClient && (
                                <span className="text-slate-500 text-[11px] font-medium uppercase tracking-widest hidden lg:inline">
                                  {formatDistanceToNow(new Date(service.lastUpdate), {
                                    addSuffix: true,
                                    locale: enUS,
                                  })}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                        <div className="flex items-center space-x-2 mr-2">
                          <button
                            onClick={(e) => handleCopyUrl(e, service.server)}
                            className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10"
                            title="Copy URL"
                          >
                            <Square2StackIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => handleRefresh(e, service.server)}
                            disabled={service.loading}
                            className={`p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10
                              ${service.loading ? 'animate-spin cursor-not-allowed opacity-50' : ''}
                            `}
                            title="Refresh benchmark"
                          >
                            <ArrowPathIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => handleTest(e, service)}
                            disabled={service.loading || isOffline || service.models.length === 0}
                            className={`hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest
                              ${service.loading || isOffline || service.models.length === 0
                                ? 'bg-white/5 text-slate-600 cursor-not-allowed opacity-50'
                                : 'bg-white/5 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 border border-white/10'
                              }`}
                          >
                            <BeakerIcon className="h-4 w-4 mr-2" />
                            Test
                          </button>
                          <button
                            onClick={(e) => handleRemove(e, service.server)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 border border-transparent hover:border-white/10"
                            title="Remove Server"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <ChevronDownIcon 
                          className={`w-5 h-5 text-slate-500 transition-transform duration-300 ease-in-out
                            ${open ? 'transform rotate-180 text-cyan-400' : ''}
                            ${isOffline || service.loading ? 'hidden' : ''}
                          `} 
                        />
                      </div>
                    </Disclosure.Button>

                    <Transition
                      show={open}
                      enter="transition duration-100 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-75 ease-out"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      <Disclosure.Panel static className="px-6 py-6 border-t border-white/5 bg-black/20">
                        <div className="space-y-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2 px-1">
                            Available Models
                          </span>
                          <div className="flex flex-wrap gap-2.5">
                            {service.models.map((model, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold
                                  bg-white/2 text-slate-300 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400 transition-all duration-200 cursor-default"
                              >
                                {model}
                              </span>
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

        {/* Pagination Controls */}
        <div className="px-6 py-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 bg-white/2">
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('pagination.perPage')}</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="appearance-none bg-white/5 border border-white/10 rounded-xl text-slate-200 px-5 py-2 pr-12 text-xs font-black
                  focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer hover:bg-white/10 transition-all duration-300"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size} className="bg-slate-900">{size}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronDownIcon className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.1em]">
            {t('pagination.showing', {
              from: services.length === 0 ? 0 : (currentPage - 1) * pageSize + 1,
              to: Math.min(currentPage * pageSize, services.length),
              total: services.length
            })}
          </div>
        </div>

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="px-6 py-8 border-t border-white/5 bg-white/5 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300
                  ${currentPage === 1
                    ? 'text-slate-800 cursor-not-allowed opacity-30 shadow-none'
                    : 'text-slate-500 hover:text-cyan-400 hover:bg-white/5 border border-transparent hover:border-white/10'
                  }`}
              >
                {t('pagination.first')}
              </button>

              <div className="flex items-center space-x-1.5 mx-3">
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    disabled={page === '...'}
                    className={`min-w-[44px] h-11 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-tighter
                      ${page === currentPage
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/20'
                        : page === '...'
                          ? 'text-slate-700 cursor-default shadow-none'
                          : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 shadow-none'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300
                  ${currentPage === totalPages
                    ? 'text-slate-800 cursor-not-allowed opacity-30 shadow-none'
                    : 'text-slate-500 hover:text-cyan-400 hover:bg-white/5 border border-transparent hover:border-white/10'
                  }`}
              >
                {t('pagination.last')}
              </button>
            </div>
          </div>
        )}
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