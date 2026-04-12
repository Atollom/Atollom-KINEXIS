// src/dashboard/lib/realtime.ts
// Realtime subscriptions — channels MUST be scoped to tenant_id
// to prevent cross-tenant event leakage.

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { RealtimeChannel } from "@supabase/supabase-js";

type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

type RealtimeCallback = (payload: RealtimePayload) => void;

/**
 * Subscribe to a specific table for a given tenant.
 *
 * Channel name is namespaced as `kinexis-{tenant_id}-{table}` to prevent
 * receiving events from other tenants sharing the same Supabase project.
 *
 * Returns an unsubscribe function — call it on component cleanup.
 */
export function subscribeToTable(
  tenantId: string,
  table: string,
  callback: RealtimeCallback
): () => void {
  const supabase = createClientComponentClient();

  const channelName = `kinexis-${tenantId}-${table}`;

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event:  "*",
        schema: "public",
        table,
        filter: `tenant_id=eq.${tenantId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as RealtimePayload["eventType"],
          new: (payload.new ?? {}) as Record<string, unknown>,
          old: (payload.old ?? {}) as Record<string, unknown>,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to agent execution logs for live agent-status updates.
 */
export function subscribeToAgentLogs(
  tenantId: string,
  callback: RealtimeCallback
): () => void {
  return subscribeToTable(tenantId, "agent_execution_logs", callback);
}

/**
 * Subscribe to orders table for warehouse live-feed.
 */
export function subscribeToOrders(
  tenantId: string,
  callback: RealtimeCallback
): () => void {
  return subscribeToTable(tenantId, "orders", callback);
}
