// src/dashboard/hooks/useLeads.ts
import useSWR from 'swr';
import { Lead } from '../types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useLeads() {
  const { data, error, isLoading, mutate } = useSWR<Lead[]>('/api/crm/leads', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });

  return {
    leads: data || [],
    isLoading,
    isError: error,
    mutate
  };
}
