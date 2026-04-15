// src/dashboard/hooks/useInventory.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { InventoryItem } from '../types';

export function useInventory() {
  const { data, error, isLoading } = useSWR<InventoryItem[]>('/api/inventory', fetcher, {
    refreshInterval: 300000, // 5 min
    revalidateOnFocus: true,
  });

  return {
    inventory: Array.isArray(data) ? data : [],
    isLoading,
    isError: error
  };
}
