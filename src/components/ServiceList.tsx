import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { PAGE_SIZE_OPTIONS } from '@/constants';
import { OllamaService } from '@/types';
import { 
  ArrowPathIcon, 
  TrashIcon, 
  Square2StackIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Disclosure, Transition } from '@headlessui/react';
import React from 'react';

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
  const _t = useTranslations();

  const handleCopyUrl = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    const btn = e.currentTarget as HTMLButtonElement;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<span class="text-emerald-500 font-bold text-[10px]">COPIED</span>';
    setTimeout(() => {
      btn.innerHTML = originalContent;
    }, 1500);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div className="bg-background border-t border-border overflow-hidden transition-colors">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="bg-background">
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em] border-r border-border">
                Node.Identity
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em] border-r border-border">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em] border-r border-border">
                Perf.Metrics
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em] border-r border-border">
                Fleet.Metadata
              </th>
              <th scope="col" className="px-4 py-3 text-right text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                System.Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map((service, _index) => (
              <Disclosure key={service.server} as={React.Fragment}>
                {({ open }) => (
                  <>
                    <tr 
                      className="row-hover group cursor-pointer transition-colors" 
                      onClick={() => !service.loading && service.status !== 'error'}
                    >
                      <td className="px-4 py-3 whitespace-nowrap border-r border-border">
                        <div className="flex items-center space-x-3">
                          <Disclosure.Button 
                            disabled={service.loading || service.status === 'error'}
                            className={`btn-minimal ${open ? 'rotate-180 text-foreground border-border' : ''}`}
                          >
                            <ChevronDownIcon className="w-3.5 h-3.5 transition-transform duration-200" />
                          </Disclosure.Button>
                          <span className="text-[11px] font-black text-foreground tracking-widest uppercase">
                            {service.server.replace('http://', '').replace('https://', '')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap border-r border-border">
                        <div className="flex items-center space-x-2">
                          <div className={`status-indicator rounded-none ${
                            service.status === 'error' ? 'bg-rose-500' : 
                            service.loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                          }`} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted">
                            {service.loading ? 'Syncing' : service.status || 'Active'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-mono font-black text-foreground border-r border-border">
                        {service.tps.toFixed(2)} <span className="text-[8px] text-muted opacity-50 uppercase">TPS</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap border-r border-border">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-muted uppercase tracking-tighter">
                            {service.models.length} Units.Loaded
                          </span>
                          {isClient && (
                            <span className="text-[8px] text-muted/50 uppercase font-mono">
                              {formatDistanceToNow(new Date(service.lastUpdate), { addSuffix: true, locale: enUS })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={(e) => handleCopyUrl(e, service.server)}
                            className="btn-minimal"
                            title="Copy Handle"
                          >
                            <Square2StackIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleAction(e, () => onBenchmark(service.server))}
                            disabled={service.loading}
                            className={`btn-minimal ${service.loading ? 'animate-spin' : ''}`}
                            title="Sync Node"
                          >
                            <ArrowPathIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="btn-minimal hover:text-rose-500 hover:border-rose-500/20"
                            onClick={(e) => handleAction(e, () => onRemove(service.server))}
                            title="Purge Node"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    <Transition
                      show={open}
                      enter="transition duration-100 ease-out"
                      enterFrom="transform opacity-0 -translate-y-1"
                      enterTo="transform opacity-100 translate-y-0"
                      leave="transition duration-75 ease-out"
                      leaveFrom="transform opacity-100 translate-y-0"
                      leaveTo="transform opacity-0 -translate-y-1"
                    >
                      <tr className="bg-muted/5">
                        <td colSpan={5} className="px-12 py-6 border-b border-border">
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 font-mono">
                            {service.models.map((model, mIdx) => (
                              <span key={mIdx} className="pill-gray truncate text-center text-[9px]" title={model}>
                                {model}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </Transition>
                  </>
                )}
              </Disclosure>
            ))}
            {services.length === 0 && !isClient && (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em] animate-pulse">Initializing.System...</span>
                </td>
              </tr>
            )}
            {services.length === 0 && isClient && (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center space-y-2 opacity-20">
                    <TrashIcon className="w-8 h-8" />
                    <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">Fleet.Empty</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Stealth Pagination */}
      <div className="px-4 py-4 border-t border-border flex items-center justify-between text-muted bg-background">
        <div className="flex items-center space-x-6">
          <div className="relative group">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer 
                hover:text-foreground transition-colors appearance-none pr-4"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size} className="bg-background">{size} per_step</option>
              ))}
            </select>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">
            {currentPage} . {totalPages}
          </span>
        </div>
        <div className="flex space-x-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-4 py-1.5 border border-border text-[9px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background disabled:opacity-10 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-4 py-1.5 border border-border text-[9px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background disabled:opacity-10 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}