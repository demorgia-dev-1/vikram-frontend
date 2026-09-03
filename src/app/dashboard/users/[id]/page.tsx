"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import {
  Badge,
  Card,
  CardHeader,
  DetailGrid,
  DetailHero,
  DetailItem,
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

  return (
    <div className="space-y-5">
      <DetailHero
        name={selected.name}
        subtitle={selected.email}
        badges={
          <>
            <Badge tone="sky">{selected.role}</Badge>
            <StatusBadge active={selected.isActive} />
          </>
        }
      />

      <Card>
        <CardHeader title="Account details" />
        <DetailGrid>
          <DetailItem label="Full name">{selected.name}</DetailItem>
          <DetailItem label="Email address">{selected.email}</DetailItem>

          <DetailItem label="Role">
            <Badge tone="sky">{selected.role}</Badge>
          </DetailItem>

          <DetailItem label="Status">
            <StatusBadge active={selected.isActive} />
          </DetailItem>

          <DetailItem label="Created">{formatDate(selected.createdAt)}</DetailItem>

          <DetailItem label="Last updated">
            {formatDate(selected.updatedAt)}
          </DetailItem>

          <DetailItem label="User ID" className="sm:col-span-2">
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {selected.id}
            </span>
          </DetailItem>
        </DetailGrid>
      </Card>
    </div>
  );
}
