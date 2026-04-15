// src/dashboard/hooks/useInventoryAlerts.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { InventoryItem } from '../types';

export function useInventoryAlerts() {
  const { data, error, isLoading } = useSWR<InventoryItem[]>('/api/inventory', fetcher, {
    refreshInterval: 300000, // 5 minutos
  });

  const items = Array.isArray(data) ? data : [];
  const criticalCount = items.filter(item => item.status === 'critical' || item.status === 'out').length;

  return {
    alerts: items,
    criticalCount,
    isLoading,
    isError: error
  };
}
