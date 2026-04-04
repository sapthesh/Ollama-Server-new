'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/Header';
import { ModelFilter } from '@/components/ModelFilter';
import { ServiceList } from '@/components/ServiceList';
import { Footer } from '@/components/Footer';
import { OllamaService, SortField, SortOrder } from '@/types';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const _t = useTranslations();
  const [services, setServices] = useState<OllamaService[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [detectingServices, setDetectingServices] = useState<Set<string>>(new Set());
  const [detectedResults, setDetectedResults] = useState<OllamaService[]>([]);
  const [newServerUrl, setNewServerUrl] = useState('');
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('tps');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Filter state
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Client-side rendering flag
  const [isClient, setIsClient] = useState(false);

  // Fetch nodes from Supabase
  const fetchNodes = useCallback(async () => {
    try {
      if (!supabase) return;
      let query = supabase
        .from('nodes')
        .select('*', { count: 'exact' });

      // Apply status filter
      if (statusFilter === 'online') {
        query = query.eq('status', 'success');
      } else if (statusFilter === 'offline') {
        query = query.eq('status', 'error');
      }

      // Apply sorting
      const supabaseSortField = sortField === 'tps' ? 'tps' : 'lastUpdate';
      query = query.order(supabaseSortField, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      if (data) {
        setServices(data.map(node => ({
          server: node.server,
          models: node.models || [],
          tps: node.tps || 0,
          lastUpdate: node.lastUpdate,
          status: node.status,
          loading: false
        })));
        setTotalCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching nodes from Supabase:', error);
    }
  }, [currentPage, pageSize, sortField, sortOrder, statusFilter]);

  // Remove node from Supabase
  const removeNode = async (url: string) => {
    try {
      if (!supabase) return;
      const { error } = await supabase
        .from('nodes')
        .delete()
        .eq('server', url);

      if (error) throw error;
      
      setServices(prev => prev.filter(s => s.server !== url));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  };

  const handleDetect = useCallback(async (urls: string[]): Promise<void> => {
    try {
      setDetectingServices(new Set(urls));
      
      for (const url of urls) {
        try {
          // Fail-Fast: Ping before saving
          const response = await fetch('/api/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });

          const result = await response.json();
          
          if (result.status === 'error') {
            console.log(`Node ${url} is offline. Immediate pruning...`);
            await removeNode(url);
            setDetectedResults(prev => [...prev, result]);
            continue;
          }

          // If alive, upsert to Supabase
          if (!supabase) {
            console.warn('Supabase not initialized, skipping persistence');
            continue;
          }

          const { error } = await supabase
            .from('nodes')
            .upsert({
              server: url,
              models: result.models,
              tps: result.tps,
              lastUpdate: new Date().toISOString(),
              status: result.isFake ? 'fake' : 'success'
            }, { onConflict: 'server' });

          if (error) throw error;

          setServices(prev => {
            const exists = prev.some(s => s.server === url);
            if (exists) {
              return prev.map(s => s.server === url ? { ...result, loading: false } : s);
            }
            return [{ ...result, loading: false }, ...prev];
          });

          setDetectedResults(prev => {
            const next = prev.filter(r => r.server !== url);
            return [...next, result];
          });

        } catch (error) {
          console.error(`Detection/Upsert error: ${url}`, error);
          await removeNode(url);
        } finally {
          setDetectingServices(prev => {
            const next = new Set(prev);
            next.delete(url);
            return next;
          });
        }
      }
      
      setCountdown(5);
      fetchNodes(); // Refresh list after detection batch
    } catch (error) {
      console.error('Error during detection process:', error);
      setDetectingServices(new Set());
    }
  }, [fetchNodes]);

  const handleAddServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerUrl.trim()) return;
    
    let url = newServerUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    
    handleDetect([url]);
    setNewServerUrl('');
  };

  const handleBenchmark = async (url: string) => {
    await handleDetect([url]);
  };

  useEffect(() => {
    setIsClient(true);
    fetchNodes();
  }, [fetchNodes]);

  // Update available models whenever services change
  useEffect(() => {
    const models = new Set<string>();
    services.forEach(service => {
      service.models?.forEach(model => models.add(model));
    });
    setAvailableModels(Array.from(models).sort());
  }, [services]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleModelSelection = (model: string) => {
    setSelectedModels(prev => 
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  };

  const clearSelectedModels = () => {
    setSelectedModels([]);
  };

  // Filter services for UI (if selectedModels used)
  const filteredServices = services.filter(service => 
    (selectedModels.length === 0 || service.models.some(model => selectedModels.includes(model)))
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <main className="min-h-screen bg-[#0f1117]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header
          countdown={countdown}
          detectingServices={detectingServices}
          detectedResults={detectedResults}
          onDetect={handleDetect}
          totalNodes={totalCount}
          onlineNodes={services.filter(s => s.status === 'success' || s.status === 'fake').length}
        />

        {/* Discovery Input */}
        <div className="my-8">
          <form onSubmit={handleAddServer} className="relative flex items-center max-w-2xl group">
            <input
              type="text"
              value={newServerUrl}
              onChange={(e) => setNewServerUrl(e.target.value)}
              placeholder="ENTER NODE IP (E.G. 1.2.3.4:11434)"
              className="block w-full pl-6 pr-32 py-3 bg-zinc-900 border border-[#2d2d2d] rounded-sm 
                text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 
                transition-all text-xs font-bold uppercase tracking-widest"
            />
            <button
              type="submit"
              className="absolute right-1 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 
                text-cyan-500 text-[10px] font-black uppercase tracking-widest rounded-sm border border-[#2d2d2d]
                transition-all active:scale-95"
            >
              Add Node
            </button>
          </form>
        </div>

        <div className="border border-[#2d2d2d] rounded-sm overflow-hidden mb-6 bg-zinc-900/20">
          <ModelFilter
            selectedModels={selectedModels}
            availableModels={availableModels}
            searchTerm={searchTerm}
            sortField={sortField}
            sortOrder={sortOrder}
            onSearchChange={setSearchTerm}
            onToggleModel={toggleModelSelection}
            onRemoveModel={(m) => setSelectedModels(prev => prev.filter(mod => mod !== m))}
            onClearModels={clearSelectedModels}
            onToggleSort={toggleSort}
            statusFilter={statusFilter}
            onStatusFilterChange={(s) => setStatusFilter(s)}
          />

          <ServiceList
            services={filteredServices}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            isClient={isClient}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            onBenchmark={handleBenchmark}
            onRemove={removeNode}
          />
        </div>
        
        <Footer />
      </div>
    </main>
  );
}
