import { useTranslations } from 'next-intl';
import { ArrowUpIcon, ArrowDownIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

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
  statusFilter: 'all' | 'online' | 'offline';
  onStatusFilterChange: (status: 'all' | 'online' | 'offline') => void;
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
  statusFilter,
  onStatusFilterChange,
}: ModelFilterProps) {
  const _t = useTranslations();

  const filteredModels = availableModels.filter(model => 
    model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SortIcon = ({ field }: { field: 'tps' | 'lastUpdate' }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ArrowUpIcon className="h-3 w-3 inline-block ml-0.5" /> :
      <ArrowDownIcon className="h-3 w-3 inline-block ml-0.5" />;
  };

  return (
    <div className="p-4 border-b border-[#2d2d2d] space-y-4 bg-zinc-900/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            <FunnelIcon className="w-3.5 h-3.5" />
            <span>Filter Nodes</span>
          </div>
          
          {/* Status Filter Toggle */}
          <div className="flex items-center border border-[#2d2d2d] rounded-sm overflow-hidden bg-black/40">
            {(['all', 'online', 'offline'] as const).map((status) => (
              <button
                key={status}
                onClick={() => onStatusFilterChange(status)}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-colors
                  ${statusFilter === status 
                    ? 'bg-zinc-800 text-zinc-100' 
                    : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Sort By</span>
          <button
            onClick={() => onToggleSort('tps')}
            className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm border transition-all
              ${sortField === 'tps' 
                ? 'bg-zinc-800 text-cyan-500 border-zinc-700' 
                : 'bg-black/20 text-zinc-500 border-[#2d2d2d] hover:text-zinc-300'}`}
          >
            TPS <SortIcon field="tps" />
          </button>
          <button
            onClick={() => onToggleSort('lastUpdate')}
            className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm border transition-all
              ${sortField === 'lastUpdate' 
                ? 'bg-zinc-800 text-cyan-500 border-zinc-700' 
                : 'bg-black/20 text-zinc-500 border-[#2d2d2d] hover:text-zinc-300'}`}
          >
            Last Seen <SortIcon field="lastUpdate" />
          </button>
        </div>
      </div>
      
      {/* Search Input */}
      <div className="relative group">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="SEARCH MODELS (E.G. LLAMA3, DEEPSEEK)..."
          className="w-full px-3 py-2 bg-black/60 border border-[#2d2d2d] rounded-sm text-xs font-bold text-zinc-300 
            placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-all uppercase tracking-widest"
        />
      </div>

      {/* Selected Models Pill Row */}
      {selectedModels.length > 0 && (
        <div className="flex items-center justify-between py-1 bg-black/20 px-3 rounded-sm border border-[#2d2d2d]/50">
          <div className="flex flex-wrap gap-1.5 items-center">
            {selectedModels.map(model => (
              <span
                key={model}
                className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase
                  bg-zinc-950 text-cyan-500 border border-cyan-500/10"
              >
                {model}
                <button onClick={() => onRemoveModel(model)} className="ml-1.5 text-zinc-600 hover:text-rose-500">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <button
            onClick={onClearModels}
            className="text-[9px] font-black text-rose-500/70 hover:text-rose-500 uppercase tracking-widest pl-4"
          >
            Reset All
          </button>
        </div>
      )}

      {/* Quick Model Picker */}
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar pr-2 pt-1">
        {filteredModels.map(model => (
          <button
            key={model}
            onClick={() => onToggleModel(model)}
            className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter transition-all border
              ${selectedModels.includes(model)
                ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
                : 'bg-black/20 text-zinc-600 border-transparent hover:border-zinc-800 hover:text-zinc-400'
              }`}
          >
            {model}
          </button>
        ))}
      </div>
    </div>
  );
}