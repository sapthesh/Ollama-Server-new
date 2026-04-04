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
      <ArrowUpIcon className="h-2.5 w-2.5 inline-block ml-1" /> :
      <ArrowDownIcon className="h-2.5 w-2.5 inline-block ml-1" />;
  };

  return (
    <div className="p-4 border-b border-border space-y-4 bg-background transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-[10px] font-black text-muted uppercase tracking-[0.2em]">
            <FunnelIcon className="w-3.5 h-3.5" />
            <span>Target.Filter</span>
          </div>
          
          {/* Flat Status Filter Toggle */}
          <div className="flex items-center border border-border bg-background">
            {(['all', 'online', 'offline'] as const).map((status) => (
              <button
                key={status}
                onClick={() => onStatusFilterChange(status)}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all
                  ${statusFilter === status 
                    ? 'bg-foreground text-background' 
                    : 'text-muted hover:text-foreground'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted">Sort.Priority</span>
          <button
            onClick={() => onToggleSort('tps')}
            className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border transition-all
              ${sortField === 'tps' 
                ? 'bg-foreground text-background border-foreground' 
                : 'bg-transparent text-muted border-border hover:border-muted'}`}
          >
            TPS <SortIcon field="tps" />
          </button>
          <button
            onClick={() => onToggleSort('lastUpdate')}
            className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border transition-all
              ${sortField === 'lastUpdate' 
                ? 'bg-foreground text-background border-foreground' 
                : 'bg-transparent text-muted border-border hover:border-muted'}`}
          >
            Seen <SortIcon field="lastUpdate" />
          </button>
        </div>
      </div>
      
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="SEARCH.MODELS: LLAMA3, DEEPSEEK, PHI3..."
          className="w-full px-3 py-2 bg-background border border-border text-xs font-bold text-foreground 
            placeholder-muted focus:outline-none focus:border-foreground transition-all uppercase tracking-widest"
        />
      </div>

      {/* Selected Models Pill Row */}
      {selectedModels.length > 0 && (
        <div className="flex items-center justify-between py-2 bg-muted/5 px-3 border border-border">
          <div className="flex flex-wrap gap-1.5 items-center">
            {selectedModels.map(model => (
              <span
                key={model}
                className="inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase
                  bg-foreground text-background border border-foreground"
              >
                {model}
                <button onClick={() => onRemoveModel(model)} className="ml-2 hover:opacity-50">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <button
            onClick={onClearModels}
            className="text-[9px] font-black text-rose-500 hover:underline uppercase tracking-widest pl-4"
          >
            Reset
          </button>
        </div>
      )}

      {/* Quick Model Picker */}
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar pr-2 pt-1 font-mono">
        {filteredModels.map(model => (
          <button
            key={model}
            onClick={() => onToggleModel(model)}
            className={`px-2 py-1 text-[9px] font-black uppercase tracking-tighter transition-all border
              ${selectedModels.includes(model)
                ? 'bg-foreground text-background border-foreground'
                : 'bg-transparent text-muted border-border hover:border-muted hover:text-foreground'
              }`}
          >
            {model}
          </button>
        ))}
      </div>
    </div>
  );
}