// src/dashboard/hooks/useLeads.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Lead } from '../types';

export function useLeads() {
  const { data, error, isLoading, mutate } = useSWR<Lead[]>('/api/crm/leads', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });

  return {
    leads: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    mutate
  };
}
