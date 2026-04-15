// src/dashboard/hooks/useKPIs.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { DashboardKPIs } from '../types';

export function useKPIs() {
  const { data, error, isLoading } = useSWR<DashboardKPIs>('/api/dashboard/kpis', fetcher, {
    refreshInterval: 30000, // 30 segundos
    revalidateOnFocus: true,
  });

  return {
    kpis: data,
    isLoading,
    isError: error
  };
}
