import { useTranslations } from 'next-intl';
import { ArrowUpIcon, ArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ModelFilterProps {
  selectedModels: string[];
  availableModels: string[];
  searchTerm: string;
  sortField: 'tps' | 'lastUpdate';
  sortOrder: 'asc' | 'desc';
  onSearchChange: (term: string) => void;
  onToggleModel: (model: string) => void;
  onRemoveModel: (model: string) => void;
  onClearModels: () => void;
  onToggleSort: (field: 'tps' | 'lastUpdate') => void;
}

export function ModelFilter({
  selectedModels,
  availableModels,
  searchTerm,
  sortField,
  sortOrder,
  onSearchChange,
  onToggleModel,
  onRemoveModel,
  onClearModels,
  onToggleSort,
}: ModelFilterProps) {
  const t = useTranslations();

  // Get filtered model list
  const filteredModels = availableModels.filter(model => 
    model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting icon component
  const SortIcon = ({ field }: { field: 'tps' | 'lastUpdate' }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ArrowUpIcon className="h-4 w-4 inline-block ml-1" /> :
      <ArrowDownIcon className="h-4 w-4 inline-block ml-1" />;
  };

  return (
    <div className="p-8 border-b border-white/5 space-y-8 bg-white/5 backdrop-blur-md">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">{t('filter.title')}</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onToggleSort('tps')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all duration-300
                ${sortField === 'tps' 
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' 
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
            >
              {t('filter.sort.tps')}
              <SortIcon field="tps" />
            </button>
            <button
              onClick={() => onToggleSort('lastUpdate')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all duration-300
                ${sortField === 'lastUpdate' 
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' 
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
            >
              {t('filter.sort.lastUpdate')}
              <SortIcon field="lastUpdate" />
            </button>
          </div>
        </div>
        
        {/* Search input */}
        <div className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('filter.search')}
            className="w-full px-5 py-3 bg-black/20 border border-white/10 rounded-2xl text-slate-200 
              placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent
              transition-all duration-300 group-hover:border-white/20"
          />
        </div>

        {/* Selected models */}
        {selectedModels.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('filter.selectedModels')}</span>
              <button
                onClick={onClearModels}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors duration-200"
              >
                {t('filter.clearSelection')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedModels.map(model => (
                <span
                  key={model}
                  className="inline-flex items-center px-4 py-1.5 rounded-xl text-sm font-medium
                    bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm"
                >
                  {model}
                  <button
                    onClick={() => onRemoveModel(model)}
                    className="ml-2 text-cyan-400 hover:text-rose-400 transition-colors duration-200"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Model list */}
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
          {filteredModels.map(model => (
            <button
              key={model}
              onClick={() => onToggleModel(model)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300 border
                ${selectedModels.includes(model)
                  ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-slate-200'
                }`}
            >
              {model}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}