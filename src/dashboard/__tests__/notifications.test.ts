// src/dashboard/__tests__/notifications.test.ts
// Tests for badge counting and read-state logic.
// These are pure-function tests — no DOM, no React, no Supabase.

import { describe, it, expect } from "vitest";
import {
  computeUnreadCount,
  markOneRead,
  markAllRead,
} from "../hooks/useNotifications";
import type { Notification } from "../types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeNotif(
  id: string,
  priority: Notification["priority"] = "medium"
): Notification {
  return {
    id,
    type:       "stock_critical",
    module:     "erp",
    message:    `Notification ${id}`,
    priority,
    created_at: new Date().toISOString(),
  };
}

const N1 = makeNotif("n1", "high");
const N2 = makeNotif("n2", "critical");
const N3 = makeNotif("n3", "medium");
const ALL = [N1, N2, N3];

// ── computeUnreadCount ────────────────────────────────────────────────────────

describe("computeUnreadCount", () => {
  it("returns total count when nothing is read", () => {
    expect(computeUnreadCount(ALL, new Set())).toBe(3);
  });

  it("decrements when a notification is marked read", () => {
    const readIds = new Set(["n1"]);
    expect(computeUnreadCount(ALL, readIds)).toBe(2);
  });

  it("returns 0 when all notifications are read", () => {
    const readIds = new Set(["n1", "n2", "n3"]);
    expect(computeUnreadCount(ALL, readIds)).toBe(0);
  });

  it("returns 0 for empty notification list", () => {
    expect(computeUnreadCount([], new Set())).toBe(0);
  });

  it("ignores stale read IDs that no longer exist in notifications", () => {
    const readIds = new Set(["old-id-not-in-list"]);
    expect(computeUnreadCount(ALL, readIds)).toBe(3);
  });
});

// ── markOneRead ───────────────────────────────────────────────────────────────

describe("markOneRead", () => {
  it("adds the id to the read set", () => {
    const result = markOneRead(new Set(), "n1");
    expect(result.has("n1")).toBe(true);
  });

  it("badge decrements after markOneRead", () => {
    const readIds = markOneRead(new Set(), "n1");
    expect(computeUnreadCount(ALL, readIds)).toBe(2);
  });

  it("is idempotent — marking twice does not change count", () => {
    const once  = markOneRead(new Set(), "n1");
    const twice = markOneRead(once, "n1");
    expect(computeUnreadCount(ALL, twice)).toBe(2);
  });

  it("does not mutate the original set", () => {
    const original = new Set<string>();
    markOneRead(original, "n1");
    expect(original.size).toBe(0);
  });
});

// ── markAllRead ───────────────────────────────────────────────────────────────

describe("markAllRead", () => {
  it("badge drops to 0 after markAllRead", () => {
    const result = markAllRead(new Set(), ALL);
    expect(computeUnreadCount(ALL, result)).toBe(0);
  });

  it("preserves existing read ids", () => {
    const existing = new Set(["n1"]);
    const result   = markAllRead(existing, [N2, N3]);
    expect(result.has("n1")).toBe(true);
    expect(result.has("n2")).toBe(true);
    expect(result.has("n3")).toBe(true);
  });

  it("handles empty notifications gracefully", () => {
    const result = markAllRead(new Set(["n1"]), []);
    expect(result.has("n1")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("does not mutate the original set", () => {
    const original = new Set<string>();
    markAllRead(original, ALL);
    expect(original.size).toBe(0);
  });
});

// ── Realtime simulation ───────────────────────────────────────────────────────
// Validates that adding a new notification increments the badge.

describe("realtime badge increment", () => {
  it("badge increments when a new notification arrives", () => {
    const readIds = new Set<string>();
    const before  = computeUnreadCount(ALL, readIds);

    const newNotif = makeNotif("n4", "critical");
    const after    = computeUnreadCount([...ALL, newNotif], readIds);

    expect(after).toBe(before + 1);
  });

  it("arriving notification that is already read does not change badge", () => {
    // Simulate a notification that was pre-marked read (e.g. from another tab via localStorage)
    const readIds = new Set(["n4"]);
    const newNotif = makeNotif("n4", "critical");
    const count   = computeUnreadCount([...ALL, newNotif], readIds);
    expect(count).toBe(3); // n1 + n2 + n3 only
  });
});
