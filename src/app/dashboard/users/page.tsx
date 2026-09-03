"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/Modal";
import UserFormModal from "@/components/UserFormModal";
import { BanIcon, EyeIcon, PencilIcon } from "@/components/icons";
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
import { deleteUser, fetchUsers } from "@/store/usersSlice";
import type { User } from "@/types";

export default function UsersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { items, meta, loading, error, deleting, deleteError } = useAppSelector(
    (state) => state.users,
  );
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const isAdmin = currentUser?.role === "ADMIN";

  async function confirmDelete() {
    if (!deleteTarget) return;

    const result = await dispatch(deleteUser(deleteTarget.id));

    if (deleteUser.fulfilled.match(result)) {
      setDeleteTarget(null);
    }
  }

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
                    <td
                      className={`${tdClass} whitespace-nowrap text-slate-600 dark:text-slate-400`}
                    >
                      {formatDate(user.createdAt)}
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label="View details"
                          onClick={() =>
                            router.push(`/dashboard/users/${user.id}`)
                          }
                        >
                          <EyeIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={isAdmin ? "Edit user" : "Admins only"}
                          disabled={!isAdmin}
                          onClick={() => setEditTarget(user)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={
                            user.id === currentUser?.id
                              ? "You cannot deactivate yourself"
                              : !user.isActive
                                ? "Already inactive"
                                : isAdmin
                                  ? "Deactivate user"
                                  : "Admins only"
                          }
                          tone="danger"
                          disabled={
                            !isAdmin ||
                            !user.isActive ||
                            user.id === currentUser?.id
                          }
                          onClick={() => setDeleteTarget(user)}
                        >
                          <BanIcon className="h-4 w-4" />
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

      <UserFormModal
        key={editTarget?.id}
        user={editTarget}
        onClose={() => setEditTarget(null)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Deactivate user"
        message={`${deleteTarget?.name ?? "This user"} will lose access to the portal. The account is kept for history and can still be viewed.`}
        confirmLabel="Yes, deactivate"
        loadingLabel="Deactivating…"
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
