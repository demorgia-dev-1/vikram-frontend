"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import AssignTransitionModal from "@/components/AssignTransitionModal";
import PerformTransitionModal from "@/components/PerformTransitionModal";
import WorkflowGraph from "@/components/WorkflowGraph";
import { BoxIcon } from "@/components/icons";
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
  fetchMyPendingTransitions,
  fetchMyPerformedTransitions,
  fetchProductHistory,
  fetchProductTransitions,
} from "@/store/productWorkflowSlice";
import { clearSelectedProduct, fetchProductById } from "@/store/productsSlice";
import { fetchUsers } from "@/store/usersSlice";
import type { ProductTransition } from "@/types";
import {
  clearSelectedTemplate,
  fetchTemplateVersions,
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
  const versions = useAppSelector((state) => state.workflowTemplates.versions);
  const {
    transitions: productTransitions,
    transitionsLoading,
    transitionsError,
    history,
    historyLoading,
    historyError,
    pending,
    performed,
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
    dispatch(fetchMyPendingTransitions());
    dispatch(fetchMyPerformedTransitions());
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

  // The product references its version by id, so the versions list is needed to
  // turn that into the version number the graph endpoint takes.
  useEffect(() => {
    if (selected?.workflowTemplateId) {
      dispatch(fetchTemplateVersions(selected.workflowTemplateId));
    }
  }, [dispatch, selected?.workflowTemplateId]);

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
      <div className="flex justify-center py-20 text-subtle">
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
          className="text-sm font-medium text-primary hover:text-primary-hover"
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
  const versionNumber = versions.find(
    (entry) => entry.id === selected.workflowTemplateVersionId,
  )?.version;

  /*
   * Everything on a product lives in its workflow *instance*: the transitions,
   * their stages, the assignments and the history logs all use instance ids.
   * The template version graph is a different id space entirely, so the stages
   * are derived from the transitions themselves rather than fetched separately.
   */
  const transitions = productTransitions;
  const stages = Array.from(
    new Map(
      transitions.flatMap((transition) => [
        [transition.srcStage.id, transition.srcStage] as const,
        [transition.destStage.id, transition.destStage] as const,
      ]),
    ).values(),
  );

  // History is newest first, so its latest destination is where the product sits.
  const currentStageId =
    history[0]?.destStageId ??
    stages.find((stage) => stage.isInitial)?.id ??
    null;

  function stageName(stageId: string) {
    return stages.find((stage) => stage.id === stageId)?.name ?? "a stage";
  }

  /** Transitions on this product the API says are waiting on the signed-in user. */
  const waitingOnYou = new Set(
    pending
      .filter((item) => item.productId === id)
      .map((item) => item.transitionId),
  );

  /** Transitions on this product performed by the signed-in user. */
  const performedByYou = new Set(
    performed
      .filter((item) => item.productId === id)
      .map((item) => item.transitionId),
  );

  /** Transitions already recorded in this product's history. */
  const performedAt = new Map(
    history.map((entry) => [entry.transitionId, entry.performedAt]),
  );

  /**
   * The pending endpoint is the server's own answer for the signed-in user, so
   * it wins outright. The derived rule below only covers admins, who may run a
   * transition assigned to someone else and so never appear in that list.
   */
  function canPerformTransition(transitionId: string) {
    if (waitingOnYou.has(transitionId)) return true;

    const match = productTransitions.find((item) => item.id === transitionId);
    if (!match || performedAt.has(transitionId)) return false;

    return isAdmin && match.srcStage.id === currentStageId;
  }

  return (
    <div className="space-y-5">
      <DetailHero
        name={selected.name}
        icon={<BoxIcon className="h-5 w-5" />}
        meta={[
          resolvedCustomer ? (
            <Link
              key="customer"
              href={`/dashboard/customers/${selected.customerId}`}
              className="transition hover:text-primary"
            >
              {resolvedCustomer.name}
            </Link>
          ) : (
            <Muted key="customer">No customer</Muted>
          ),
          template ? (
            <Link
              key="template"
              href={`/dashboard/workflow-templates/${selected.workflowTemplateId}`}
              className="transition hover:text-primary"
            >
              {template.name}
            </Link>
          ) : (
            <Muted key="template">No template</Muted>
          ),
          <span key="version">
            {versionNumber ? `v${versionNumber}` : "Unversioned"}
          </span>,
        ]}
        badges={
          <>
            {currentStageId ? (
              <Badge tone="sky">{stageName(currentStageId)}</Badge>
            ) : null}
            <StatusBadge active={selected.isActive} />
          </>
        }
      />

      <Card>
        <CardHeader title="Overview" />
        <DetailGrid>
          <DetailItem label="Customer">
            {resolvedCustomer ? (
              <Link
                href={`/dashboard/customers/${selected.customerId}`}
                className="text-primary transition hover:text-primary-hover"
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
                className="text-primary transition hover:text-primary-hover"
              >
                {template.name}
              </Link>
            ) : (
              <Muted>Not available</Muted>
            )}
          </DetailItem>

          <DetailItem label="Template version">
            <Badge>{versionNumber ? `v${versionNumber}` : "—"}</Badge>
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

          <DetailItem label="Description" className="sm:col-span-2">
            {selected.description}
          </DetailItem>
        </DetailGrid>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Workflow" />
        <div>
          {stages.length > 0 ? (
            <div className="border-b border-border-subtle">
              <WorkflowGraph
                stages={stages}
                transitions={transitions}
                readOnly
                heightClass="h-[22rem]"
                currentStageId={currentStageId}
                canPerform={canPerformTransition}
                onPerform={(transitionId) => {
                  const match = productTransitions.find(
                    (item) => item.id === transitionId,
                  );
                  if (match) setPerformTarget(match);
                }}
              />
            </div>
          ) : null}

          {transitionsError ? (
            <div className="p-5">
              <ErrorNote message={transitionsError} />
            </div>
          ) : transitionsLoading ? (
            <div className="flex justify-center py-10 text-subtle">
              <Spinner className="h-5 w-5" />
            </div>
          ) : productTransitions.length === 0 ? (
            <EmptyState title="No transitions available" />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {productTransitions.map((transition) => {
                const available = transition.srcStage.id === currentStageId;
                const canPerform = canPerformTransition(transition.id);
                const performedOn = performedAt.get(transition.id);

                return (
                  <li
                    key={transition.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3"
                  >
                    <TransitionLabel transition={transition} />

                    {waitingOnYou.has(transition.id) ? (
                      <Badge tone="sky">Waiting on you</Badge>
                    ) : null}

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
                          <span className="block truncate text-xs text-muted">
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
                      {performedOn ? (
                        <Badge tone="green">
                          {performedByYou.has(transition.id)
                            ? "Performed by you"
                            : "Performed"}{" "}
                          {formatDate(performedOn)}
                        </Badge>
                      ) : (
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
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="History" />
        <div>
          {historyError ? (
            <div className="p-5">
              <ErrorNote message={historyError} />
            </div>
          ) : historyLoading ? (
            <div className="flex justify-center py-10 text-subtle">
              <Spinner className="h-5 w-5" />
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              title="Nothing performed yet"
              description="Transitions performed on this product will be listed here."
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
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
                      <span className="text-muted">
                        {" "}
                        moved {stageName(entry.srcStageId)} →{" "}
                        {stageName(entry.destStageId)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
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
                              className="text-xs font-medium text-primary transition hover:text-primary-hover"
                            >
                              {attachment.fileName}
                              <span className="ml-1.5 font-normal text-subtle">
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
          {attachmentError ? (
            <div className="px-5 pb-5">
              <ErrorNote message={attachmentError} />
            </div>
          ) : null}
        </div>
      </Card>

      <AssignTransitionModal
        key={`assign-${assignTarget?.id}-${assignTarget?.assigneeId}`}
        productId={id}
        transition={assignTarget}
        onClose={() => setAssignTarget(null)}
      />

      <PerformTransitionModal
        onPerformed={() => {
          dispatch(fetchMyPendingTransitions());
          dispatch(fetchMyPerformedTransitions());
        }}
        key={`perform-${performTarget?.id}`}
        productId={id}
        transition={performTarget}
        onClose={() => setPerformTarget(null)}
      />
    </div>
  );
}
