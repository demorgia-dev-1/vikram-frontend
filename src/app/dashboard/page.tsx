"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BuildingIcon, UsersIcon } from "@/components/icons";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  ErrorNote,
  PageHeader,
  StatusBadge,
  cardClass,
  cn,
  formatDate,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchCustomers } from "@/store/customersSlice";
import { fetchUsers } from "@/store/usersSlice";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const users = useAppSelector((state) => state.users);
  const customers = useAppSelector((state) => state.customers);

  // Small page size: the tiles only need meta.total, the list only the newest few.
  useEffect(() => {
    dispatch(fetchUsers({ page: 1, limit: 5 }));
    dispatch(fetchCustomers({ page: 1, limit: 5 }));
  }, [dispatch]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Here's what's happening across your account today."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Customers"
          value={customers.meta?.total}
          loading={customers.loading}
          hint="Registered organisations"
          icon={<BuildingIcon className="h-4 w-4" />}
          href="/dashboard/customers"
        />
        <StatTile
          label="Users"
          value={users.meta?.total}
          loading={users.loading}
          hint="Portal accounts"
          icon={<UsersIcon className="h-4 w-4" />}
          href="/dashboard/users"
        />
        <Tile label="Your role" hint="Access level">
          <Badge tone="sky">{user.role}</Badge>
        </Tile>
        <Tile label="Account" hint={`Member since ${formatDate(user.createdAt)}`}>
          <StatusBadge active={user.isActive} />
        </Tile>
      </div>

      {customers.error ? <ErrorNote message={customers.error} /> : null}

      <Card>
        <CardHeader
          title="Recent customers"
          action={
            <Link
              href="/dashboard/customers"
              className="text-xs font-medium text-sky-600 transition hover:text-sky-500 dark:text-sky-400"
            >
              View all
            </Link>
          }
        />

        {customers.loading ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 3 }).map((_, index) => (
              <li key={index} className="flex items-center gap-3 px-5 py-3.5">
                <span className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <span className="h-3.5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              </li>
            ))}
          </ul>
        ) : customers.items.length === 0 ? (
          <EmptyState
            title="No customers yet"
            description="Add your first customer to see it here."
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {customers.items.map((customer) => (
              <li
                key={customer.id}
                className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <Avatar name={customer.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{customer.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {customer.email}
                  </p>
                </div>
                <Badge>{customer.type}</Badge>
                <span className="hidden w-24 text-right text-xs text-slate-500 sm:block dark:text-slate-400">
                  {formatDate(customer.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Your profile" />
        <dl className="divide-y divide-slate-100 dark:divide-slate-800">
          {(
            [
              ["Name", user.name],
              ["Email", user.email],
              ["Last updated", formatDate(user.updatedAt)],
              [
                "User ID",
                <span key="id" className="font-mono text-xs">
                  {user.id}
                </span>,
              ],
            ] as [string, React.ReactNode][]
          ).map(([label, value]) => (
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

function Tile({
  label,
  hint,
  icon,
  children,
  className,
}: {
  label: string;
  hint: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(cardClass, "p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {icon ? <span className="text-slate-400 dark:text-slate-500">{icon}</span> : null}
      </div>
      <div className="mt-3 flex h-9 items-center">{children}</div>
      <p className="mt-1.5 truncate text-xs text-slate-400 dark:text-slate-500">
        {hint}
      </p>
    </div>
  );
}

function StatTile({
  label,
  value,
  loading,
  hint,
  icon,
  href,
}: {
  label: string;
  value?: number;
  loading: boolean;
  hint: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/20"
    >
      <Tile label={label} hint={hint} icon={icon} className="h-full">
        {loading && value === undefined ? (
          <span className="h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        ) : (
          <p className="text-3xl font-semibold tabular-nums tracking-tight">
            {(value ?? 0).toLocaleString()}
          </p>
        )}
      </Tile>
    </Link>
  );
}
