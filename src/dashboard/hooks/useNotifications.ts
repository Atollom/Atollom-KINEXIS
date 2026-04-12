// src/dashboard/hooks/useNotifications.ts
// Combines HTTP polling (SWR) + Supabase Realtime for instant push.
"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Notification } from "../types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("fetch error");
    return r.json() as Promise<Notification[]>;
  });

// Tables that can generate notifications — all scoped by tenant_id
const REALTIME_TABLES = [
  "cfdi_records",
  "inventory",
  "returns",
  "purchase_orders",
  "crisis_events",
] as const;

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<Notification[]>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: true }
  );

  const supabase = createClientComponentClient();
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  useEffect(() => {
    let tenantId: string | null = null;

    async function setup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      tenantId = profile?.tenant_id ?? null;
      if (!tenantId) return;

      // One Realtime channel per table, all scoped to tenant_id
      for (const table of REALTIME_TABLES) {
        const ch = supabase
          .channel(`kinexis-${tenantId}-notif-${table}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table,
              filter: `tenant_id=eq.${tenantId}`,
            },
            () => {
              // Re-fetch notifications on any relevant DB change
              mutate();
            }
          )
          .subscribe();

        channelsRef.current.push(ch);
      }
    }

    setup();

    return () => {
      for (const ch of channelsRef.current) {
        supabase.removeChannel(ch);
      }
      channelsRef.current = [];
    };
  }, [supabase, mutate]);

  const notifications = data ?? [];
  const criticalCount = notifications.filter(
    (n) => n.priority === "critical" || n.priority === "high"
  ).length;

  return {
    notifications,
    unreadCount: notifications.length,
    criticalCount,
    isLoading,
    isError: !!error,
    mutate,
  };
}
