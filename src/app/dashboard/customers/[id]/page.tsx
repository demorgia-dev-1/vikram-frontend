"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import CustomerFormModal from "@/components/CustomerFormModal";
import { ConfirmModal } from "@/components/Modal";
import { BanIcon, PencilIcon } from "@/components/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  ErrorNote,
  Spinner,
  StatusBadge,
  formatDate,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  clearSelectedCustomer,
  deleteCustomer,
  fetchCustomerById,
} from "@/store/customersSlice";

export default function CustomerDetailPage({
  params,
}: PageProps<"/dashboard/customers/[id]">) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.user?.role);
  const { selected, selectedLoading, selectedError, deleting, deleteError } =
    useAppSelector((state) => state.customers);

  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomerById(id));
    return () => {
      dispatch(clearSelectedCustomer());
    };
  }, [dispatch, id]);

  async function confirmDelete() {
    const result = await dispatch(deleteCustomer(id));

    if (deleteCustomer.fulfilled.match(result)) {
      setConfirming(false);
    }
  }

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
          href="/dashboard/customers"
          className="text-sm font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400"
        >
          ← Back to customers
        </Link>
      </div>
    );
  }

  if (!selected) return null;

  const isAdmin = role === "ADMIN";
  const details: [string, React.ReactNode][] = [
    ["Email", selected.email],
    ["Phone", selected.phone],
    ["Address", selected.address],
    ["Type", <Badge key="t" tone="sky">{selected.type}</Badge>],
    ["Status", <StatusBadge key="s" active={selected.isActive} />],
    ["Created", formatDate(selected.createdAt)],
    ["Last updated", formatDate(selected.updatedAt)],
    [
      "Customer ID",
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
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Badge tone="sky">{selected.type}</Badge>
            <StatusBadge active={selected.isActive} />
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <PencilIcon className="h-4 w-4" />
              Edit
            </Button>
            {isAdmin && selected.isActive ? (
              <Button
                variant="secondary"
                onClick={() => setConfirming(true)}
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
              >
                <BanIcon className="h-4 w-4" />
                Deactivate
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Customer details" />
        <dl className="divide-y divide-slate-100 dark:divide-slate-800">
          {details.map(([label, value]) => (
            <div
              key={label}
              className="flex items-start justify-between gap-6 px-5 py-3"
            >
              <dt className="shrink-0 text-sm text-slate-500 dark:text-slate-400">
                {label}
              </dt>
              <dd className="text-right text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <CustomerFormModal
        open={editing}
        customer={selected}
        onClose={() => setEditing(false)}
      />

      <ConfirmModal
        open={confirming}
        title="Deactivate customer"
        message={`${selected.name} will be marked inactive. The record is kept for history and can still be viewed.`}
        confirmLabel="Yes, deactivate"
        loadingLabel="Deactivating…"
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}
