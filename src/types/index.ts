export interface OllamaService {
  server: string;
  models: string[];
  tps: number;
  lastUpdate: string;
  status?: 'loading' | 'success' | 'error' | 'fake';
  isFake?: boolean;
  loading?: boolean;
}

export type SortField = 'tps' | 'lastUpdate';
export type SortOrder = 'asc' | 'desc'; 