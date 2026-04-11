// src/dashboard/hooks/useNotifications.ts
import useSWR from 'swr';
import { Notification } from '../types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useNotifications() {
  const { data, error, isLoading } = useSWR<Notification[]>('/api/notifications', fetcher, {
    refreshInterval: 30000, // 30 segundos
  });

  return {
    notifications: data || [],
    unreadCount: data?.length || 0,
    isLoading,
    isError: error
  };
}
