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
import {
  clearSelectedCustomer,
  fetchCustomerById,
} from "@/store/customersSlice";

export default function CustomerDetailPage({
  params,
}: PageProps<"/dashboard/customers/[id]">) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const { selected, selectedLoading, selectedError } = useAppSelector(
    (state) => state.customers,
  );

  useEffect(() => {
    dispatch(fetchCustomerById(id));
    return () => {
      dispatch(clearSelectedCustomer());
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
          href="/dashboard/customers"
          className="text-sm font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400"
        >
          ← Back to customers
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
            <Badge tone="sky">{selected.type}</Badge>
            <StatusBadge active={selected.isActive} />
          </>
        }
      />

      <Card>
        <CardHeader title="Customer details" />
        <DetailGrid>
          <DetailItem label="Email address">{selected.email}</DetailItem>
          <DetailItem label="Phone">{selected.phone}</DetailItem>

          <DetailItem label="Type">
            <Badge tone="sky">{selected.type}</Badge>
          </DetailItem>

          <DetailItem label="Status">
            <StatusBadge active={selected.isActive} />
          </DetailItem>

          <DetailItem label="Created">
            {formatDate(selected.createdAt)}
          </DetailItem>

          <DetailItem label="Last updated">
            {formatDate(selected.updatedAt)}
          </DetailItem>

          <DetailItem label="Address" className="sm:col-span-2">
            {selected.address}
          </DetailItem>

          <DetailItem label="Customer ID" className="sm:col-span-2">
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {selected.id}
            </span>
          </DetailItem>
        </DetailGrid>
      </Card>
    </div>
  );
}
