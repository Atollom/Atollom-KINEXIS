// src/dashboard/hooks/useAgentStatus.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Agent } from '../types';

export function useAgentStatus() {
  const { data, error, isLoading } = useSWR<Agent[]>('/api/agents/status', fetcher, {
    refreshInterval: 15000, // 15 segundos
  });

  const agents = Array.isArray(data) ? data : [];
  const activeCount = agents.filter(a => a.agent_status === 'active').length;

  return {
    agents,
    activeCount,
    isLoading,
    isError: error
  };
}
