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
    <div className="bg-[#161922] border-t border-[#2d2d2d] overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-[#2d2d2d]">
          <thead>
            <tr className="bg-zinc-900/50">
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Server Node
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Perf
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Metadata
              </th>
              <th scope="col" className="px-4 py-3 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d2d2d]">
            {services.map((service, _index) => (
              <Disclosure key={service.server} as={React.Fragment}>
                {({ open }) => (
                  <>
                    <tr className="row-hover group cursor-pointer transition-colors" onClick={() => !service.loading && service.status !== 'error'}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <Disclosure.Button 
                            disabled={service.loading || service.status === 'error'}
                            className="btn-minimal"
                          >
                            <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180 text-cyan-400' : ''}`} />
                          </Disclosure.Button>
                          <span className="text-sm font-bold text-slate-200 tracking-tight">
                            {service.server.replace('http://', '').replace('https://', '')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={`status-indicator ${
                            service.status === 'error' ? 'bg-rose-500' : 
                            service.loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                          }`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            {service.loading ? 'Syncing' : service.status || 'Active'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-bold text-zinc-300">
                        {service.tps.toFixed(2)} <span className="text-[9px] text-zinc-600">TPS</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                            {service.models.length} Model{service.models.length !== 1 ? 's' : ''}
                          </span>
                          {isClient && (
                            <span className="text-[9px] text-zinc-600 uppercase">
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
                            title="Copy URL"
                          >
                            <Square2StackIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleAction(e, () => onBenchmark(service.server))}
                            disabled={service.loading}
                            className={`btn-minimal ${service.loading ? 'animate-spin opacity-50' : ''}`}
                            title="Retry Check"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="btn-minimal hover:text-rose-500"
                            onClick={(e) => handleAction(e, () => onRemove(service.server))}
                            title="Delete Node"
                          >
                            <TrashIcon className="w-4 h-4" />
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
                      <tr className="bg-zinc-900/30">
                        <td colSpan={5} className="px-12 py-4 border-l-2 border-cyan-500/30">
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {service.models.map((model, _mIdx) => (
                              <span key={_mIdx} className="pill-gray truncate text-center" title={model}>
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
          </tbody>
        </table>
      </div>

      {/* Compact Pagination */}
      <div className="px-4 py-3 border-t border-[#2d2d2d] flex items-center justify-between text-zinc-600 bg-zinc-900/30">
        <div className="flex items-center space-x-4">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer hover:text-zinc-400 transition-colors"
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size} className="bg-zinc-900">{size} Per Page</option>
            ))}
          </select>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
            {currentPage} of {totalPages}
          </span>
        </div>
        <div className="flex space-x-1">
          <button 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="btn-minimal disabled:opacity-20"
          >
            Prev
          </button>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="btn-minimal disabled:opacity-20"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';