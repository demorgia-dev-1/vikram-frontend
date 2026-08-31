"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon } from "@/components/icons";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorNote,
  IconButton,
  PageHeader,
  Pagination,
  StatusBadge,
  TableSkeleton,
  formatDate,
  tdClass,
  thClass,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchUsers } from "@/store/usersSlice";

export default function UsersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, meta, loading, error } = useAppSelector((state) => state.users);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchUsers({ page, limit: 20 }));
  }, [dispatch, page]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description="Portal accounts with access to this workspace."
      />

      {error ? <ErrorNote message={error} /> : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/30">
              <tr>
                <th className={thClass}>Name</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Created</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <TableSkeleton cols={5} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="No users found" />
                  </td>
                </tr>
              ) : (
                items.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} className="h-9 w-9 text-xs" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <Badge tone="sky">{user.role}</Badge>
                    </td>
                    <td className={tdClass}>
                      <StatusBadge active={user.isActive} />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-slate-600 dark:text-slate-400`}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label="View details"
                          onClick={() => router.push(`/dashboard/users/${user.id}`)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta ? (
          <Pagination meta={meta} onPageChange={setPage} disabled={loading} />
        ) : null}
      </Card>
    </div>
  );
}
