"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CustomerFormModal from "@/components/CustomerFormModal";
import { ConfirmModal } from "@/components/Modal";
import { BanIcon, EyeIcon, PencilIcon, PlusIcon } from "@/components/icons";
import { useDebounced } from "@/lib/useDebounced";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ClearFiltersButton,
  ColumnFilter,
  ColumnSearch,
  ErrorNote,
  FilterCell,
  FilterRow,
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
import { showToast } from "@/store/toastSlice";
import { deleteCustomer, fetchCustomers } from "@/store/customersSlice";
import { CUSTOMER_TYPES, type Customer } from "@/types";

export default function CustomersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.user?.role);
  const { items, meta, loading, error, deleting, deleteError } = useAppSelector(
    (state) => state.customers,
  );

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebounced(search);
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const isAdmin = role === "ADMIN";

  // Built where it is used so the effect needs no extra dependencies.
  const buildQuery = () => ({
    page,
    limit: 20,
    search: debouncedSearch,
    type: type as Customer["type"] | "",
    isActive: status === "" ? undefined : status === "active",
  });

  useEffect(() => {
    dispatch(
      fetchCustomers({
        page,
        limit: 20,
        search: debouncedSearch,
        type: type as Customer["type"] | "",
        isActive: status === "" ? undefined : status === "active",
      }),
    );
  }, [dispatch, page, debouncedSearch, type, status]);

  const filtersActive = Boolean(search || type || status);

  function clearFilters() {
    setSearch("");
    setType("");
    setStatus("");
    setPage(1);
  }

  // A narrowed result set can have fewer pages than the one being viewed.
  function changeFilter(apply: () => void) {
    apply();
    setPage(1);
  }

  function refresh() {
    dispatch(fetchCustomers(buildQuery()));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    const result = await dispatch(deleteCustomer(deleteTarget.id));

    if (deleteCustomer.fulfilled.match(result)) {
      dispatch(showToast(`${deleteTarget.name} deactivated`));
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description="Airlines, MROs and OEMs registered with the portal."
        action={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon className="h-4 w-4" />
            Add customer
          </Button>
        }
      />

      {error ? <ErrorNote message={error} /> : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border-subtle bg-surface-muted">
              <tr>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Phone</th>
                <th className={thClass}>Address</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Added</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>

              <FilterRow>
                <FilterCell>
                  <ColumnSearch
                    value={search}
                    onChange={(value) => changeFilter(() => setSearch(value))}
                    placeholder="Name, email or phone"
                  />
                </FilterCell>
                <FilterCell>
                  <ColumnFilter
                    label="Filter by type"
                    value={type}
                    onChange={(value) => changeFilter(() => setType(value))}
                    allLabel="All"
                    options={CUSTOMER_TYPES.map((item) => ({
                      value: item,
                      label: item,
                    }))}
                  />
                </FilterCell>
                <FilterCell />
                <FilterCell />
                <FilterCell>
                  <ColumnFilter
                    label="Filter by status"
                    value={status}
                    onChange={(value) => changeFilter(() => setStatus(value))}
                    allLabel="All"
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                  />
                </FilterCell>
                <FilterCell />
                <FilterCell>
                  {filtersActive ? (
                    <ClearFiltersButton onClick={clearFilters} />
                  ) : null}
                </FilterCell>
              </FilterRow>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <TableSkeleton cols={7} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title={
                        filtersActive
                          ? "No matching customers"
                          : "No customers yet"
                      }
                      description={
                        filtersActive
                          ? "Try a different search, or clear the filters."
                          : "Add your first customer to get started."
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition hover:bg-surface-muted"
                  >
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={customer.name}
                          className="h-9 w-9 text-xs"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {customer.name}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <Badge tone="sky">{customer.type}</Badge>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-muted`}>
                      {customer.phone}
                    </td>
                    <td className={`${tdClass} max-w-xs text-muted`}>
                      <span className="line-clamp-2">{customer.address}</span>
                    </td>
                    <td className={tdClass}>
                      <StatusBadge active={customer.isActive} />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-muted`}>
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label="View details"
                          onClick={() =>
                            router.push(`/dashboard/customers/${customer.id}`)
                          }
                        >
                          <EyeIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label="Edit customer"
                          onClick={() => setEditTarget(customer)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={
                            !customer.isActive
                              ? "Already inactive"
                              : isAdmin
                                ? "Deactivate customer"
                                : "Admins only"
                          }
                          tone="danger"
                          disabled={!isAdmin || !customer.isActive}
                          onClick={() => setDeleteTarget(customer)}
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

      <CustomerFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => {
          // Newest records land on page 1, so go there rather than refetching in place.
          if (page === 1) refresh();
          else setPage(1);
        }}
      />

      <CustomerFormModal
        key={editTarget?.id}
        open={Boolean(editTarget)}
        customer={editTarget}
        onClose={() => setEditTarget(null)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Deactivate customer"
        message={`${deleteTarget?.name ?? "This customer"} will be marked inactive. The record is kept for history and can still be viewed.`}
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
