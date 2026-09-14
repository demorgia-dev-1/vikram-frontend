"use client";

/**
 * The API stores no node coordinates, so a hand-arranged graph is remembered
 * per viewer in localStorage. Keys are scoped to one graph (a template draft, a
 * published version, or a product's instance).
 */
const PREFIX = "vikram_graph_layout:";

export type NodePositions = Record<string, { x: number; y: number }>;

export function loadLayout(key?: string): NodePositions {
  if (!key || typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as NodePositions) : {};
  } catch {
    // Corrupt or blocked storage just means the computed layout is used.
    return {};
  }
}

export function saveLayout(key: string | undefined, positions: NodePositions) {
  if (!key || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(positions));
  } catch {
    // Private browsing can block writes; the arrangement is simply not kept.
  }
}

export function clearLayout(key?: string) {
  if (!key || typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing to do — the next load falls back to the computed layout.
  }
}
