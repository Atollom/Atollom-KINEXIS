// src/dashboard/hooks/useInventoryAlerts.ts
import useSWR from 'swr';
import { InventoryItem } from '../types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useInventoryAlerts() {
  const { data, error, isLoading } = useSWR<InventoryItem[]>('/api/inventory', fetcher, {
    refreshInterval: 300000, // 5 minutos
  });

  const criticalCount = data?.filter(item => item.status === 'critical' || item.status === 'out').length || 0;

  return {
    alerts: data || [],
    criticalCount,
    isLoading,
    isError: error
  };
}
