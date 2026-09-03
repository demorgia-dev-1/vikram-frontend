"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import AssignTransitionModal from "@/components/AssignTransitionModal";
import PerformTransitionModal from "@/components/PerformTransitionModal";
import WorkflowGraph from "@/components/WorkflowGraph";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  DetailGrid,
  DetailHero,
  DetailItem,
  EmptyState,
  ErrorNote,
  Muted,
  Spinner,
  StatusBadge,
  TransitionLabel,
  formatBytes,
  formatDate,
  formatDateTime,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchCustomerById } from "@/store/customersSlice";
import {
  clearProductWorkflow,
  fetchAttachmentUrl,
  fetchProductHistory,
  fetchProductTransitions,
} from "@/store/productWorkflowSlice";
import { clearSelectedProduct, fetchProductById } from "@/store/productsSlice";
import { fetchUsers } from "@/store/usersSlice";
import type { ProductTransition } from "@/types";
import {
  clearSelectedTemplate,
  fetchTemplateVersion,
  fetchTemplates,
} from "@/store/workflowTemplatesSlice";

export default function ProductDetailPage({
  params,
}: PageProps<"/dashboard/products/[id]">) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const role = currentUser?.role;
  const { selected, selectedLoading, selectedError } = useAppSelector(
    (state) => state.products,
  );
  const customer = useAppSelector((state) => state.customers.selected);
  const templates = useAppSelector((state) => state.workflowTemplates.items);
  const graph = useAppSelector((state) => state.workflowTemplates.version);
  const {
    transitions: productTransitions,
    transitionsLoading,
    transitionsError,
    history,
    historyLoading,
    historyError,
  } = useAppSelector((state) => state.productWorkflow);

  const [assignTarget, setAssignTarget] = useState<ProductTransition | null>(
    null,
  );
  const [performTarget, setPerformTarget] = useState<ProductTransition | null>(
    null,
  );
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProductById(id));
    dispatch(fetchTemplates());
    dispatch(fetchProductTransitions(id));
    dispatch(fetchProductHistory(id));
    dispatch(fetchUsers({ page: 1, limit: 100 }));
    return () => {
      dispatch(clearSelectedProduct());
      dispatch(clearSelectedTemplate());
      dispatch(clearProductWorkflow());
    };
  }, [dispatch, id]);

  // The product carries only customerId, so resolve the name for display.
  useEffect(() => {
    if (selected?.customerId) {
      dispatch(fetchCustomerById(selected.customerId));
    }
  }, [dispatch, selected?.customerId]);

  // Assignments carry only a transitionId, so load the published graph it refers
  // to in order to name the stages on each side of the transition.
  useEffect(() => {
    if (selected?.workflowTemplateId && selected.workflowTemplateVersion) {
      dispatch(
        fetchTemplateVersion({
          id: selected.workflowTemplateId,
          version: selected.workflowTemplateVersion,
        }),
      );
    }
  }, [
    dispatch,
    selected?.workflowTemplateId,
    selected?.workflowTemplateVersion,
  ]);

  // The URL is short-lived, so it is fetched on click rather than up front.
  async function openAttachment(logId: string, attachmentId: string) {
    setAttachmentError(null);

    try {
      const url = await fetchAttachmentUrl(id, logId, attachmentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setAttachmentError("Could not open that attachment. Please try again.");
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
          href="/dashboard/products"
          className="text-sm font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400"
        >
          ← Back to products
        </Link>
      </div>
    );
  }

  if (!selected) return null;

  const isAdmin = role === "ADMIN";
  const resolvedCustomer =
    customer?.id === selected.customerId ? customer : null;
  const template = templates.find(
    (item) => item.id === selected.workflowTemplateId,
  );
  // Only trust the graph if it is the version this product was created from.
  const versionMatches = graph?.version === selected.workflowTemplateVersion;
  const transitions = versionMatches ? graph.transitions : [];
  const stages = versionMatches ? graph.stages : [];

  // History is newest first, so its latest destination is where the product sits.
  const currentStageId =
    history[0]?.destStageId ??
    stages.find((stage) => stage.isInitial)?.id ??
    null;

  function stageName(stageId: string) {
    return stages.find((stage) => stage.id === stageId)?.name ?? "a stage";
  }

  return (
    <div className="space-y-5">
      <DetailHero
        name={selected.name}
        subtitle={selected.description}
        badges={
          <>
            <Badge>v{selected.workflowTemplateVersion}</Badge>
            <StatusBadge active={selected.isActive} />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {stages.length > 0 ? (
            <Card className="overflow-hidden">
              <CardHeader title="Workflow" />
              <WorkflowGraph
                stages={stages}
                transitions={transitions}
                currentStageId={currentStageId}
              />
            </Card>
          ) : null}

          <Card className="overflow-hidden">
            <CardHeader title="Transitions" />

            {transitionsError ? (
              <div className="p-5">
                <ErrorNote message={transitionsError} />
              </div>
            ) : transitionsLoading ? (
              <div className="flex justify-center py-10 text-slate-400">
                <Spinner className="h-5 w-5" />
              </div>
            ) : productTransitions.length === 0 ? (
              <EmptyState title="No transitions available" />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {productTransitions.map((transition) => {
                  const isAssignee = transition.assigneeId === currentUser?.id;
                  const available = transition.srcStage.id === currentStageId;
                  const canPerform = (isAssignee || isAdmin) && available;

                  return (
                    <li
                      key={transition.id}
                      className="flex flex-wrap items-center gap-3 px-5 py-3"
                    >
                      <TransitionLabel transition={transition} />

                      {transition.assigneeName ? (
                        <span className="flex shrink-0 items-center gap-2.5">
                          <Avatar
                            name={transition.assigneeName}
                            className="h-8 w-8 text-xs"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {transition.assigneeName}
                            </span>
                            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                              {transition.allowAttachments
                                ? "Attachments allowed"
                                : "No attachments"}
                            </span>
                          </span>
                        </span>
                      ) : (
                        <Muted>Unassigned</Muted>
                      )}

                      <div className="ml-auto flex shrink-0 items-center gap-2">
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          disabled={!isAdmin}
                          title={isAdmin ? undefined : "Admins only"}
                          onClick={() => setAssignTarget(transition)}
                        >
                          {transition.assigneeId ? "Reassign" : "Assign"}
                        </Button>
                        <Button
                          className="px-3 py-1.5 text-xs"
                          disabled={!canPerform}
                          title={
                            !available
                              ? "Not available from the current stage"
                              : canPerform
                                ? undefined
                                : "Only the assignee or an admin can perform this"
                          }
                          onClick={() => setPerformTarget(transition)}
                        >
                          Perform
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="History" />

            {historyError ? (
              <div className="p-5">
                <ErrorNote message={historyError} />
              </div>
            ) : historyLoading ? (
              <div className="flex justify-center py-10 text-slate-400">
                <Spinner className="h-5 w-5" />
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                title="Nothing performed yet"
                description="Transitions performed on this product will be listed here."
              />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((entry) => (
                  <li key={entry.id} className="flex gap-3 px-5 py-4">
                    <Avatar
                      name={entry.performedByName}
                      className="h-8 w-8 text-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          {entry.performedByName}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {" "}
                          moved {stageName(entry.srcStageId)} →{" "}
                          {stageName(entry.destStageId)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {entry.performedByEmail} ·{" "}
                        {formatDateTime(entry.performedAt)}
                      </p>

                      {entry.attachments.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {entry.attachments.map((attachment) => (
                            <li key={attachment.id}>
                              <button
                                onClick={() =>
                                  openAttachment(entry.id, attachment.id)
                                }
                                className="text-xs font-medium text-sky-600 transition hover:text-sky-500 dark:text-sky-400"
                              >
                                {attachment.fileName}
                                <span className="ml-1.5 font-normal text-slate-400">
                                  {formatBytes(attachment.sizeBytes)}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {attachmentError ? (
              <div className="px-5 pb-5">
                <ErrorNote message={attachmentError} />
              </div>
            ) : null}
          </Card>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader title="Summary" />
            <DetailGrid columns={1}>
              <DetailItem label="Customer">
                {resolvedCustomer ? (
                  <Link
                    href={`/dashboard/customers/${selected.customerId}`}
                    className="text-sky-600 transition hover:text-sky-500 dark:text-sky-400"
                  >
                    {resolvedCustomer.name}
                  </Link>
                ) : (
                  <Muted>Not available</Muted>
                )}
              </DetailItem>

              <DetailItem label="Workflow template">
                {template ? (
                  <Link
                    href={`/dashboard/workflow-templates/${selected.workflowTemplateId}`}
                    className="text-sky-600 transition hover:text-sky-500 dark:text-sky-400"
                  >
                    {template.name}
                  </Link>
                ) : (
                  <Muted>Not available</Muted>
                )}
              </DetailItem>

              <DetailItem label="Template version">
                <Badge>v{selected.workflowTemplateVersion}</Badge>
              </DetailItem>

              <DetailItem label="Current stage">
                {currentStageId ? (
                  stageName(currentStageId)
                ) : (
                  <Muted>Not started</Muted>
                )}
              </DetailItem>

              <DetailItem label="Status">
                <StatusBadge active={selected.isActive} />
              </DetailItem>

              <DetailItem label="Created">
                {formatDate(selected.createdAt)}
              </DetailItem>

              <DetailItem label="Description">
                {selected.description}
              </DetailItem>
            </DetailGrid>
          </Card>
        </aside>
      </div>

      <AssignTransitionModal
        key={`assign-${assignTarget?.id}-${assignTarget?.assigneeId}`}
        productId={id}
        transition={assignTarget}
        onClose={() => setAssignTarget(null)}
      />

      <PerformTransitionModal
        key={`perform-${performTarget?.id}`}
        productId={id}
        transition={performTarget}
        onClose={() => setPerformTarget(null)}
      />
    </div>
  );
}
