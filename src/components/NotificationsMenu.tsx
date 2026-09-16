"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "@/components/icons";
import {
  Button,
  ErrorNote,
  Spinner,
  cn,
  formatDateTime,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/store/notificationsSlice";
import type { Notification } from "@/types";

export default function NotificationsMenu() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, loading, error, unreadCount, streaming } = useAppSelector(
    (state) => state.notifications,
  );

  const [open, setOpen] = useState(false);
  const [showRead, setShowRead] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // The unread badge is live even while the panel has never been opened.
  useEffect(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;

    dispatch(fetchNotifications(showRead ? { isRead: true } : undefined));

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, showRead, dispatch]);

  function openNotification(notification: Notification) {
    if (!notification.isRead) dispatch(markNotificationRead(notification.id));
    setOpen(false);
    router.push(`/dashboard/products/${notification.productId}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          unreadCount > 0
            ? `Notifications — ${unreadCount} unread`
            : "Notifications"
        }
        className="relative rounded-lg p-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-[22rem] overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-lg"
        >
          <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {/* Live only while the SSE connection is actually open. */}
            {streaming ? (
              <span
                title="Live updates connected"
                className="h-1.5 w-1.5 rounded-full bg-success"
              />
            ) : null}
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => dispatch(markAllNotificationsRead())}
                className="ml-auto text-xs font-medium text-primary transition-colors hover:text-primary-hover"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="flex gap-1 border-b border-border-subtle px-3 py-2">
            <TabButton
              active={!showRead}
              onClick={() => setShowRead(false)}
              label="Unread"
            />
            <TabButton
              active={showRead}
              onClick={() => setShowRead(true)}
              label="Read"
            />
          </div>

          {error ? (
            <div className="p-4">
              <ErrorNote message={error} />
            </div>
          ) : loading && items.length === 0 ? (
            <div className="flex justify-center py-10 text-subtle">
              <Spinner className="h-5 w-5" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">
              {showRead ? "Nothing read yet" : "You are all caught up"}
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-border-subtle overflow-y-auto">
              {items.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className="flex w-full gap-2.5 px-4 py-3 text-left transition-colors hover:bg-surface-muted"
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        notification.isRead ? "bg-transparent" : "bg-primary",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block text-sm leading-snug">
                        {notification.message}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {formatDateTime(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-border-subtle px-4 py-2.5">
            <Button
              variant="secondary"
              className="w-full px-3 py-1.5 text-xs"
              onClick={() => {
                setOpen(false);
                router.push("/dashboard/my-work");
              }}
            >
              Go to my work
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary-soft text-primary"
          : "text-muted hover:bg-surface-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
