// src/dashboard/lib/realtime.ts
// Realtime subscriptions — channels MUST be scoped to tenant_id
// to prevent cross-tenant event leakage.

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

export type RealtimeCallback = (payload: RealtimePayload) => void;

// Maximum reconnection attempts before giving up
const MAX_RECONNECT_ATTEMPTS = 8;

/**
 * Subscribe to a specific table for a given tenant, with automatic
 * exponential-backoff reconnection on channel closure or error.
 *
 * Channel name: `kinexis-{tenant_id}-{table}` — prevents cross-tenant leakage.
 * Returns an unsubscribe/cleanup function — always call it on component unmount.
 */
export function subscribeToTable(
  tenantId: string,
  table: string,
  callback: RealtimeCallback,
  onStatusChange?: (status: string) => void
): () => void {
  const supabase = createBrowserSupabaseClient();
  const channelName = `kinexis-${tenantId}-${table}`;

  let channel: RealtimeChannel | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let attempts = 0;
  let destroyed = false;

  const clearTimer = () => {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const connect = () => {
    if (destroyed) return;

    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
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
      .subscribe((status: string) => {
        onStatusChange?.(status);

        if (status === "SUBSCRIBED") {
          // Successful connection — reset backoff counter
          attempts = 0;
        }

        if ((status === "CLOSED" || status === "CHANNEL_ERROR") && !destroyed) {
          if (attempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error(
              `[realtime] Channel ${channelName} failed after ${attempts} reconnect attempts — giving up`
            );
            return;
          }
          // Exponential backoff: 1s, 2s, 4s, 8s, … capped at 30s
          const delayMs = Math.min(1_000 * 2 ** attempts, 30_000);
          attempts++;
          console.warn(
            `[realtime] Channel ${channelName} ${status} — reconnecting in ${delayMs}ms (attempt ${attempts})`
          );
          clearTimer();
          reconnectTimer = setTimeout(() => {
            if (channel) supabase.removeChannel(channel);
            connect();
          }, delayMs);
        }
      });
  };

  connect();

  // Return cleanup function
  return () => {
    destroyed = true;
    clearTimer();
    if (channel) supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to all notification source tables for a tenant.
 * Calls `onTrigger` whenever any of the 5 source tables change.
 * Returns a single cleanup function.
 */
const NOTIFICATION_SOURCE_TABLES = [
  "cfdi_records",
  "inventory",
  "returns",
  "purchase_orders",
  "crisis_events",
] as const;

export function subscribeToNotificationSources(
  tenantId: string,
  onTrigger: () => void,
  onStatusChange?: (table: string, status: string) => void
): () => void {
  const cleanups = NOTIFICATION_SOURCE_TABLES.map((table) =>
    subscribeToTable(
      tenantId,
      table,
      () => onTrigger(),
      (status) => onStatusChange?.(table, status)
    )
  );

  return () => cleanups.forEach((fn) => fn());
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
