// src/dashboard/hooks/useKPIs.ts
import useSWR from 'swr';
import { DashboardKPIs } from '../types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

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
