"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  PageHeader,
  Pagination,
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

export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, meta, loading, error, unreadCount } = useAppSelector(
    (state) => state.notifications,
  );

  const [page, setPage] = useState(1);
  const [showRead, setShowRead] = useState(false);

  useEffect(() => {
    dispatch(
      fetchNotifications({
        page,
        limit: 20,
        // Omitted entirely means unread-only, which is the API's default.
        isRead: showRead ? true : undefined,
      }),
    );
    dispatch(fetchUnreadCount());
  }, [dispatch, page, showRead]);

  function openNotification(notification: Notification) {
    if (!notification.isRead) dispatch(markNotificationRead(notification.id));
    router.push(`/dashboard/products/${notification.productId}`);
  }

  function changeTab(read: boolean) {
    setShowRead(read);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Work assigned to you, and products waiting on your action."
        action={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              onClick={async () => {
                await dispatch(markAllNotificationsRead());
                dispatch(
                  fetchNotifications({
                    page: 1,
                    limit: 20,
                    isRead: showRead ? true : undefined,
                  }),
                );
              }}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {error ? <ErrorNote message={error} /> : null}

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
          <TabButton
            active={!showRead}
            onClick={() => changeTab(false)}
            label="Unread"
            count={unreadCount}
          />
          <TabButton
            active={showRead}
            onClick={() => changeTab(true)}
            label="Read"
          />
        </div>

        {loading && items.length === 0 ? (
          <div className="flex justify-center py-14 text-subtle">
            <Spinner className="h-5 w-5" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={showRead ? "Nothing read yet" : "You are all caught up"}
            description={
              showRead
                ? "Notifications you have read appear here."
                : "New work assigned to you will show up here."
            }
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {items.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => openNotification(notification)}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-muted"
                >
                  <span
                    className={cn(
                      "mt-2 h-2 w-2 shrink-0 rounded-full",
                      notification.isRead ? "bg-transparent" : "bg-primary",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug">
                      {notification.message}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {notification.productName} · {notification.stageName} ·{" "}
                      {formatDateTime(notification.createdAt)}
                    </span>
                  </span>
                  <Badge tone={notification.isRead ? "slate" : "sky"}>
                    {notification.type === "TRANSITION_ASSIGNED"
                      ? "Assigned"
                      : "Pending"}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        )}

        {meta ? (
          <Pagination meta={meta} onPageChange={setPage} disabled={loading} />
        ) : null}
      </Card>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary-soft text-primary"
          : "text-muted hover:bg-surface-muted hover:text-foreground",
      )}
    >
      {label}
      {count ? (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
            active ? "bg-primary text-primary-foreground" : "bg-surface-muted",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
