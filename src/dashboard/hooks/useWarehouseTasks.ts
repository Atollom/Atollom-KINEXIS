// src/dashboard/hooks/useWarehouseTasks.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useWarehouseTasks() {
  const { data, error, isLoading } = useSWR('/api/warehouse/tasks', fetcher, {
    refreshInterval: 60000, // 60 segundos
  });

  return {
    tasks: data?.orders || [],
    pending: data?.pending_count || 0,
    completed: data?.completed_count || 0,
    isLoading,
    isError: error
  };
}
