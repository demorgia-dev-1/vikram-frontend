"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/Modal";
import TemplateFormModal from "@/components/TemplateFormModal";
import { EyeIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  IconButton,
  PageHeader,
  TableSkeleton,
  formatDate,
  tdClass,
  thClass,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { showToast } from "@/store/toastSlice";
import { deleteTemplate, fetchTemplates } from "@/store/workflowTemplatesSlice";
import type { WorkflowTemplate } from "@/types";

export default function WorkflowTemplatesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.user?.role);
  const { items, loading, error, saving, saveError } = useAppSelector(
    (state) => state.workflowTemplates,
  );

  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<WorkflowTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkflowTemplate | null>(
    null,
  );

  const isAdmin = role === "ADMIN";

  async function confirmDelete() {
    if (!deleteTarget) return;

    const result = await dispatch(deleteTemplate(deleteTarget.id));

    if (deleteTemplate.fulfilled.match(result)) {
      dispatch(showToast(`${deleteTarget.name} deleted`));
      setDeleteTarget(null);
      dispatch(fetchTemplates());
    }
  }

  useEffect(() => {
    dispatch(fetchTemplates());
  }, [dispatch]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Workflow templates"
        description="Process definitions products are instantiated from."
        action={
          isAdmin ? (
            <Button onClick={() => setCreating(true)}>
              <PlusIcon className="h-4 w-4" />
              New template
            </Button>
          ) : undefined
        }
      />

      {error ? <ErrorNote message={error} /> : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border-subtle bg-surface-muted">
              <tr>
                <th className={thClass}>Template</th>
                <th className={thClass}>Created</th>
                <th className={thClass}>Updated</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <TableSkeleton cols={4} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title="No workflow templates"
                      description="Templates are defined in the workflow service."
                    />
                  </td>
                </tr>
              ) : (
                items.map((template) => (
                  <tr
                    key={template.id}
                    className="transition hover:bg-surface-muted"
                  >
                    <td className={`${tdClass} max-w-md`}>
                      <p className="truncate font-medium">{template.name}</p>
                      <p className="truncate text-xs text-muted">
                        {template.description}
                      </p>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-muted`}>
                      {formatDate(template.createdAt)}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-muted`}>
                      {formatDate(template.updatedAt)}
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label="View details"
                          onClick={() =>
                            router.push(
                              `/dashboard/workflow-templates/${template.id}`,
                            )
                          }
                        >
                          <EyeIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={isAdmin ? "Edit template" : "Admins only"}
                          disabled={!isAdmin}
                          onClick={() => setEditTarget(template)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={isAdmin ? "Delete template" : "Admins only"}
                          tone="danger"
                          disabled={!isAdmin}
                          onClick={() => setDeleteTarget(template)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <TemplateFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => dispatch(fetchTemplates())}
      />

      <TemplateFormModal
        key={editTarget?.id}
        open={Boolean(editTarget)}
        template={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => dispatch(fetchTemplates())}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete template"
        message={`${deleteTarget?.name ?? "This template"} will be permanently deleted. Published versions that products already use are unaffected.`}
        confirmLabel="Yes, delete"
        loadingLabel="Deleting…"
        loading={saving}
        error={saveError}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
