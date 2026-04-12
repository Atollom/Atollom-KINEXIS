// src/dashboard/hooks/useInventory.ts
import useSWR from 'swr';
import { InventoryItem } from '../types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useInventory() {
  const { data, error, isLoading } = useSWR<InventoryItem[]>('/api/inventory', fetcher, {
    refreshInterval: 300000, // 5 min
    revalidateOnFocus: true,
  });

  return {
    inventory: data || [],
    isLoading,
    isError: error
  };
}
