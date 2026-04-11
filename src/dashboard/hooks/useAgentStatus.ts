// src/dashboard/hooks/useAgentStatus.ts
import useSWR from 'swr';
import { Agent } from '../types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useAgentStatus() {
  const { data, error, isLoading } = useSWR<Agent[]>('/api/agents/status', fetcher, {
    refreshInterval: 15000, // 15 segundos
  });

  const activeCount = data?.filter(a => a.status === 'active').length || 0;

  return {
    agents: data || [],
    activeCount,
    isLoading,
    isError: error
  };
}
