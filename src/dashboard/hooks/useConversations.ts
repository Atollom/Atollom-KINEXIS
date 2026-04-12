// src/dashboard/hooks/useConversations.ts
import useSWR from 'swr';
import { ConversationSummary } from '../types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useConversations() {
  const { data, error, isLoading } = useSWR<ConversationSummary[]>('/api/meta/conversations', fetcher, {
    refreshInterval: 15000, // 15s for chats
    revalidateOnFocus: true,
  });

  return {
    conversations: data || [],
    isLoading,
    isError: error
  };
}
