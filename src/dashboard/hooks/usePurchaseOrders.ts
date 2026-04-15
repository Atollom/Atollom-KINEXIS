// src/dashboard/hooks/usePurchaseOrders.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export function usePurchaseOrders() {
  const { data, error, isLoading, mutate } = useSWR('/api/erp/purchase-orders', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });

  return {
    purchaseOrders: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    mutate
  };
}
