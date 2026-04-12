// src/dashboard/hooks/usePurchaseOrders.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function usePurchaseOrders() {
  const { data, error, isLoading, mutate } = useSWR('/api/erp/purchase-orders', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });

  return {
    purchaseOrders: data || [],
    isLoading,
    isError: error,
    mutate
  };
}
