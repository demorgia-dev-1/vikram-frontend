"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon } from "@/components/icons";
import {
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
import { fetchTemplates } from "@/store/workflowTemplatesSlice";

export default function WorkflowTemplatesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector(
    (state) => state.workflowTemplates,
  );

  useEffect(() => {
    dispatch(fetchTemplates());
  }, [dispatch]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Workflow templates"
        description="Process definitions products are instantiated from."
      />

      {error ? <ErrorNote message={error} /> : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/30">
              <tr>
                <th className={thClass}>Template</th>
                <th className={thClass}>Created</th>
                <th className={thClass}>Updated</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className={`${tdClass} max-w-md`}>
                      <p className="truncate font-medium">{template.name}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {template.description}
                      </p>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-slate-600 dark:text-slate-400`}>
                      {formatDate(template.createdAt)}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-slate-600 dark:text-slate-400`}>
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
