// src/dashboard/hooks/useNotifications.ts
// Realtime-only notifications — NO polling.
// Read state is persisted in localStorage per tenant.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { subscribeToNotificationSources } from "@/lib/realtime";
import type { Notification } from "@/types";

// ── Pure helpers (exported so tests can import them) ─────────────────────────

export function computeUnreadCount(
  notifications: Notification[],
  readIds: ReadonlySet<string>
): number {
  return notifications.filter((n) => !readIds.has(n.id)).length;
}

export function markOneRead(
  readIds: ReadonlySet<string>,
  id: string
): Set<string> {
  return new Set([...readIds, id]);
}

export function markAllRead(
  readIds: ReadonlySet<string>,
  notifications: Notification[]
): Set<string> {
  const next = new Set(readIds);
  notifications.forEach((n) => next.add(n.id));
  return next;
}

// ── Local-storage persistence ────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = "kinexis-read-notifs";

function storageKey(tenantId: string) {
  return `${STORAGE_KEY_PREFIX}-${tenantId}`;
}

function loadReadIds(tenantId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(tenantId));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function persistReadIds(tenantId: string, ids: Set<string>) {
  try {
    // Keep at most 500 IDs to avoid unbounded storage growth
    const arr = [...ids].slice(-500);
    localStorage.setItem(storageKey(tenantId), JSON.stringify(arr));
  } catch {
    // Storage quota exceeded — silently fail; worst case badge resets on reload
  }
}

// ── Sound — Web Audio API beep (no external asset needed) ───────────────────

function playCriticalSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);          // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15); // down to A4

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);

    // Close context after sound finishes to free resources
    osc.onended = () => ctx.close();
  } catch {
    // AudioContext not available (SSR, test env) — silently skip
  }
}

// ── Fetcher ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("fetch error");
    return r.json() as Promise<Notification[]>;
  });

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const supabase = createClientComponentClient();

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const prevCountRef = useRef(0);

  // 1. Resolve tenant_id from user_profiles (never from client input)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!cancelled && profile?.tenant_id) {
        setTenantId(profile.tenant_id);
        setReadIds(loadReadIds(profile.tenant_id));
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  // 2. SWR — initial fetch + manual revalidation triggered by Realtime
  //    refreshInterval: 0 means NO polling — only Realtime triggers revalidation
  const { data, isLoading, mutate } = useSWR<Notification[]>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false }
  );

  const notifications = data ?? [];

  // 3. Realtime subscription — reconnects automatically on failure
  useEffect(() => {
    if (!tenantId) return;
    const cleanup = subscribeToNotificationSources(tenantId, () => mutate());
    return cleanup;
  }, [tenantId, mutate]);

  // 4. Play sound when a new critical/high notification arrives
  useEffect(() => {
    if (!notifications.length) return;
    const criticalCount = notifications.filter(
      (n) => (n.priority === "critical" || n.priority === "high") && !readIds.has(n.id)
    ).length;

    if (criticalCount > prevCountRef.current) {
      playCriticalSound();
    }
    prevCountRef.current = criticalCount;
  }, [notifications, readIds]);

  // 5. Mark one notification as read
  const markRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        const next = markOneRead(prev, id);
        if (tenantId) persistReadIds(tenantId, next);
        return next;
      });
    },
    [tenantId]
  );

  // 6. Mark all as read
  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = markAllRead(prev, notifications);
      if (tenantId) persistReadIds(tenantId, next);
      return next;
    });
  }, [tenantId, notifications]);

  const unreadCount = computeUnreadCount(notifications, readIds);
  const criticalCount = notifications.filter(
    (n) => (n.priority === "critical" || n.priority === "high") && !readIds.has(n.id)
  ).length;

  return {
    notifications,
    unreadCount,
    criticalCount,
    isLoading,
    readIds,
    markRead,
    markAllAsRead,
    mutate,
  };
}
