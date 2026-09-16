"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import {
  fetchNotifications,
  fetchUnreadCount,
  notificationReceived,
  setStreaming,
} from "@/store/notificationsSlice";
import { getToken } from "@/lib/axios";

/**
 * Subscribes to GET /notifications/stream for the signed-in user.
 *
 * The stream is best-effort and at-most-once: anything created while the tab
 * was disconnected is never replayed, so the list and unread count are re-read
 * on every (re)connect rather than trusting the stream alone.
 *
 * EventSource cannot send an Authorization header, so the API takes the access
 * token as a query parameter instead.
 */
export function useNotificationStream(enabled: boolean) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = getToken();
    if (!enabled || !token || typeof window === "undefined") return;

    const base = process.env.BASE_URL ?? "";
    const source = new EventSource(
      `${base}/notifications/stream?token=${encodeURIComponent(token)}`,
    );

    source.onopen = () => {
      dispatch(setStreaming(true));
      // Reconcile: catch anything missed while disconnected.
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());
    };

    source.onmessage = (event) => {
      try {
        dispatch(notificationReceived(JSON.parse(event.data)));
      } catch {
        // A malformed frame is skipped; the next reconcile picks it up.
      }
    };

    // Heartbeats only keep the connection alive — nothing to do with them.
    source.addEventListener("heartbeat", () => {});

    source.onerror = () => {
      // EventSource reconnects on its own; onopen will reconcile again.
      dispatch(setStreaming(false));
    };

    return () => {
      source.close();
      dispatch(setStreaming(false));
    };
  }, [enabled, dispatch]);
}
