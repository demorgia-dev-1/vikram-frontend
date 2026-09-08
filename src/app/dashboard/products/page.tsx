"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/Modal";
import ProductFormModal from "@/components/ProductFormModal";
import { BanIcon, EyeIcon, PencilIcon, PlusIcon } from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  IconButton,
  Muted,
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
import { fetchCustomers } from "@/store/customersSlice";
import { fetchMyPendingTransitions } from "@/store/productWorkflowSlice";
import { deleteProduct, fetchProducts } from "@/store/productsSlice";
import { fetchTemplates } from "@/store/workflowTemplatesSlice";
import type { Product } from "@/types";

export default function ProductsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.user?.role);
  const { items, meta, loading, error, deleting, deleteError } = useAppSelector(
    (state) => state.products,
  );
  const customers = useAppSelector((state) => state.customers.items);
  const templates = useAppSelector((state) => state.workflowTemplates.items);
  const pending = useAppSelector((state) => state.productWorkflow.pending);

  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const isAdmin = role === "ADMIN";

  useEffect(() => {
    dispatch(fetchProducts({ page, limit: 20 }));
  }, [dispatch, page]);

  // Products carry only ids, so these lists are needed to show names.
  useEffect(() => {
    dispatch(fetchCustomers({ page: 1, limit: 100 }));
    dispatch(fetchTemplates());
    dispatch(fetchMyPendingTransitions());
  }, [dispatch]);

  // How many transitions on each product are waiting on the signed-in user.
  const waitingByProduct = pending.reduce<Record<string, number>>(
    (counts, item) => {
      counts[item.productId] = (counts[item.productId] ?? 0) + 1;
      return counts;
    },
    {},
  );

  function customerName(customerId: string) {
    return customers.find((customer) => customer.id === customerId)?.name;
  }

  function templateName(templateId: string) {
    return templates.find((template) => template.id === templateId)?.name;
  }

  function refresh() {
    dispatch(fetchProducts({ page, limit: 20 }));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    const result = await dispatch(deleteProduct(deleteTarget.id));

    if (deleteProduct.fulfilled.match(result)) {
      dispatch(showToast(`${deleteTarget.name} deactivated`));
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description="Parts registered against a customer workflow."
        action={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon className="h-4 w-4" />
            Add product
          </Button>
        }
      />

      {error ? <ErrorNote message={error} /> : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border-subtle bg-surface-muted">
              <tr>
                <th className={thClass}>Product</th>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Workflow</th>
                <th className={thClass}>Assignees</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Added</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <TableSkeleton cols={7} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="No products yet"
                      description="Add your first product to get started."
                    />
                  </td>
                </tr>
              ) : (
                items.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-surface-muted"
                  >
                    <td className={`${tdClass} max-w-xs`}>
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{product.name}</p>
                        {waitingByProduct[product.id] ? (
                          <Badge tone="sky">
                            {waitingByProduct[product.id]} waiting on you
                          </Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted">
                        {product.description}
                      </p>
                    </td>
                    <td className={tdClass}>
                      {customerName(product.customerId) ?? (
                        <Muted>Not available</Muted>
                      )}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      {templateName(product.workflowTemplateId) ?? (
                        <Muted>Not available</Muted>
                      )}
                    </td>
                    <td className={`${tdClass} text-muted`}>
                      {product.transitionAssignments.length}
                    </td>
                    <td className={tdClass}>
                      <StatusBadge active={product.isActive} />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-muted`}>
                      {formatDate(product.createdAt)}
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label="View details"
                          onClick={() =>
                            router.push(`/dashboard/products/${product.id}`)
                          }
                        >
                          <EyeIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={isAdmin ? "Edit product" : "Admins only"}
                          disabled={!isAdmin}
                          onClick={() => setEditTarget(product)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={
                            !product.isActive
                              ? "Already inactive"
                              : isAdmin
                                ? "Deactivate product"
                                : "Admins only"
                          }
                          tone="danger"
                          disabled={!isAdmin || !product.isActive}
                          onClick={() => setDeleteTarget(product)}
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

      <ProductFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => {
          // Newest records land on page 1, so go there rather than refetching in place.
          if (page === 1) refresh();
          else setPage(1);
        }}
      />

      <ProductFormModal
        key={editTarget?.id}
        open={Boolean(editTarget)}
        product={editTarget}
        onClose={() => setEditTarget(null)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Deactivate product"
        message={`${deleteTarget?.name ?? "This product"} will be marked inactive and can no longer be used for new work. The record is kept for history and can still be viewed. This cannot be undone from the portal.`}
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
