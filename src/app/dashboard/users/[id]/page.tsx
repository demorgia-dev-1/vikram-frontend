"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  ErrorNote,
  Spinner,
  StatusBadge,
  formatDate,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearSelectedUser, fetchUserById } from "@/store/usersSlice";

export default function UserDetailPage({
  params,
}: PageProps<"/dashboard/users/[id]">) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const { selected, selectedLoading, selectedError } = useAppSelector(
    (state) => state.users,
  );

  useEffect(() => {
    dispatch(fetchUserById(id));
    return () => {
      dispatch(clearSelectedUser());
    };
  }, [dispatch, id]);

  if (selectedLoading) {
    return (
      <div className="flex justify-center py-20 text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (selectedError) {
    return (
      <div className="space-y-4">
        <ErrorNote message={selectedError} />
        <Link
          href="/dashboard/users"
          className="text-sm font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400"
        >
          ← Back to users
        </Link>
      </div>
    );
  }

  if (!selected) return null;

  const details: [string, React.ReactNode][] = [
    ["Role", <Badge key="r" tone="sky">{selected.role}</Badge>],
    ["Status", <StatusBadge key="s" active={selected.isActive} />],
    ["Created", formatDate(selected.createdAt)],
    ["Last updated", formatDate(selected.updatedAt)],
    [
      "User ID",
      <span key="i" className="font-mono text-xs">
        {selected.id}
      </span>,
    ],
  ];

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={selected.name} className="h-14 w-14 text-xl" />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight">
              {selected.name}
            </h2>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
              {selected.email}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge tone="sky">{selected.role}</Badge>
            <StatusBadge active={selected.isActive} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Account details" />
        <dl className="divide-y divide-slate-100 dark:divide-slate-800">
          {details.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 px-5 py-3"
            >
              <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="text-right text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
