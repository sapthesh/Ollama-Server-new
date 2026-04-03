import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { PAGE_SIZE_OPTIONS } from '@/constants';
import { useParams } from 'next/navigation';
import { OllamaService } from '@/types';
import { BeakerIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { ModelTestModal } from './ModelTestModal';

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

  const handleTest = (service: OllamaService) => {
    setSelectedService(service);
    setIsTestModalOpen(true);
  };

  return (
    <>
      <div className="bg-white/5 backdrop-blur-md rounded-b-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-white/5">
            <thead>
              <tr className="bg-white/5">
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {t('service.server')}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {t('service.models')}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                  TPS
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {t('service.lastUpdate', { value: '' })}
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest sticky right-0 bg-slate-900/90 backdrop-blur-md z-10">
                  {t('service.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {services.map((service, _index) => (
                <tr key={service.server} className={`group transition-colors duration-200 hover:bg-white/5
                  ${service.loading ? 'animate-pulse' : ''}`}>
                  <td className="px-6 py-5 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-3">
                      <a
                        href={service.server}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors duration-200"
                      >
                        {service.server}
                      </a>
                      {service.isFake && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold
                          bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {t('detect.fake')}
                        </span>
                      )}
                      <button
                        onClick={() => onRemove(service.server)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all duration-200"
                        title="Remove Server"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {service.loading ? (
                      <div className="h-6 bg-white/10 rounded-lg animate-pulse w-24"></div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {service.models.length > 0 ? (
                          service.models.map((model, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium
                                bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            >
                              {model}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-xs italic">{t('detect.unavailable')}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-mono text-slate-300">
                    {service.loading ? (
                      <div className="h-4 bg-white/10 rounded animate-pulse w-16"></div>
                    ) : (
                      t('service.tps', { value: service.tps.toFixed(2) })
                    )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-400">
                    {service.loading ? (
                      <div className="h-4 bg-white/10 rounded animate-pulse w-32"></div>
                    ) : (
                      isClient && (
                        <time dateTime={service.lastUpdate} className="font-medium">
                          {t('service.lastUpdateValue', {
                            value: formatDistanceToNow(new Date(service.lastUpdate), {
                              addSuffix: true,
                              locale: enUS,
                            })
                          })}
                        </time>
                      )
                    )}
                  </td>
                  <td className="sticky right-0 px-6 py-5 whitespace-nowrap text-sm text-right bg-slate-900/90 backdrop-blur-md z-10">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onBenchmark(service.server)}
                        disabled={service.loading}
                        className={`inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300
                          ${service.loading
                            ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                            : 'bg-white/5 text-cyan-400 hover:bg-white/10 border border-white/10'
                          }`}
                        title={t('service.benchmark')}
                      >
                        <ArrowPathIcon className={`h-4 w-4 ${service.loading ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleTest(service)}
                        disabled={service.loading || service.models.length === 0}
                        className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300
                          ${service.loading || service.models.length === 0
                            ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-500/20'
                          }`}
                      >
                        <BeakerIcon className="h-4 w-4 mr-2" />
                        {t('service.test')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t('pagination.perPage')}</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="appearance-none bg-white/5 border border-white/10 rounded-xl text-slate-200 px-4 py-2 pr-10 text-sm font-bold
                  focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer hover:bg-white/10 transition-all duration-300"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size} className="bg-slate-900">{size}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            {t('pagination.showing', {
              from: (currentPage - 1) * pageSize + 1,
              to: Math.min(currentPage * pageSize, services.length),
              total: services.length
            })}
          </div>
        </div>

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="px-6 py-8 border-t border-white/5 bg-white/2 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300
                  ${currentPage === 1
                    ? 'text-slate-700 cursor-not-allowed'
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-white/5'
                  }`}
              >
                {t('pagination.first')}
              </button>

              <div className="flex items-center space-x-1 mx-2">
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    disabled={page === '...'}
                    className={`min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all duration-300
                      ${page === currentPage
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                        : page === '...'
                          ? 'text-slate-600 cursor-default'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300
                  ${currentPage === totalPages
                    ? 'text-slate-700 cursor-not-allowed'
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-white/5'
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