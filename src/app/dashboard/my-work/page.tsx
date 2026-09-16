"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PerformTransitionModal from "@/components/PerformTransitionModal";
import { DownloadIcon } from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorNote,
  PageHeader,
  Spinner,
  TransitionLabel,
  formatBytes,
  formatDateTime,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchAttachmentUrl,
  fetchMyPendingTransitions,
  fetchMyPerformedTransitions,
} from "@/store/productWorkflowSlice";
import type {
  PendingProduct,
  PendingTransition,
  ProductTransition,
} from "@/types";

export default function MyWorkPage() {
  const dispatch = useAppDispatch();
  const {
    pending,
    pendingLoading,
    pendingError,
    performed,
    performedLoading,
    performedError,
  } = useAppSelector((state) => state.productWorkflow);

  const [target, setTarget] = useState<{
    product: PendingProduct;
    transition: PendingTransition;
  } | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMyPendingTransitions());
    dispatch(fetchMyPerformedTransitions());
  }, [dispatch]);

  /*
   * A pending transition carries only its destination — the source is the
   * product's current stage, reported once per product. Recombine them into the
   * shape the perform dialog works from.
   */
  const asTransition: ProductTransition | null = target
    ? {
        id: target.transition.transitionId,
        name: target.transition.transitionName,
        srcStage: target.product.currentStage,
        destStage: target.transition.destStage,
        allowAttachments: target.transition.allowAttachments,
      }
    : null;

  async function download(
    productId: string,
    logId: string,
    attachmentId: string,
  ) {
    setDownloadError(null);

    try {
      const url = await fetchAttachmentUrl(productId, logId, attachmentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setDownloadError("Could not open that attachment. Please try again.");
    }
  }

  const pendingCount = pending.reduce(
    (total, item) => total + item.pendingTransitions.length,
    0,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="My work"
        description="Transitions assigned to you, and what you have already done."
      />

      <Card className="overflow-hidden">
        <CardHeader
          title={`Waiting on you${pendingCount ? ` (${pendingCount})` : ""}`}
        />

        {pendingError ? (
          <div className="p-5">
            <ErrorNote message={pendingError} />
          </div>
        ) : pendingLoading && pending.length === 0 ? (
          <div className="flex justify-center py-10 text-subtle">
            <Spinner className="h-5 w-5" />
          </div>
        ) : pending.length === 0 ? (
          <EmptyState
            title="Nothing waiting on you"
            description="Transitions assigned to you appear here when they are ready to run."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {pending.map((product) => (
              <li key={product.productId} className="px-5 py-4">
                <ProductHeading
                  productId={product.productId}
                  productName={product.productName}
                  customerName={product.customerName}
                  trailing={
                    <Badge tone="sky">{product.currentStage.name}</Badge>
                  }
                />

                <ul className="mt-3 space-y-2">
                  {product.pendingTransitions.map((transition) => (
                    <li
                      key={transition.transitionId}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-border-subtle px-3 py-2"
                    >
                      <TransitionLabel
                        transition={{
                          id: transition.transitionId,
                          name: transition.transitionName,
                          srcStage: product.currentStage,
                          destStage: transition.destStage,
                        }}
                      />
                      <Button
                        className="shrink-0 px-3 py-1.5 text-xs"
                        onClick={() => setTarget({ product, transition })}
                      >
                        {transition.transitionName || "Run"}
                      </Button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Recently performed" />

        {performedError ? (
          <div className="p-5">
            <ErrorNote message={performedError} />
          </div>
        ) : performedLoading && performed.length === 0 ? (
          <div className="flex justify-center py-10 text-subtle">
            <Spinner className="h-5 w-5" />
          </div>
        ) : performed.length === 0 ? (
          <EmptyState
            title="Nothing performed yet"
            description="Transitions you complete are listed here."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {performed.map((product) => (
              <li key={product.productId} className="px-5 py-4">
                <ProductHeading
                  productId={product.productId}
                  productName={product.productName}
                  customerName={product.customerName}
                />

                <ul className="mt-3 space-y-2">
                  {product.performedTransitions.map((entry) => (
                    <li
                      key={entry.logId}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-border-subtle px-3 py-2"
                    >
                      <TransitionLabel
                        transition={{
                          id: entry.transitionId,
                          name: entry.transitionName,
                          srcStage: entry.srcStage,
                          destStage: entry.destStage,
                        }}
                      />

                      {entry.attachments.map((attachment) => (
                        <button
                          key={attachment.id}
                          type="button"
                          title={`Download ${attachment.fileName}`}
                          onClick={() =>
                            download(
                              product.productId,
                              entry.logId,
                              attachment.id,
                            )
                          }
                          className="flex max-w-56 shrink-0 items-center gap-2 rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
                        >
                          <DownloadIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate font-medium">
                            {attachment.fileName}
                          </span>
                          <span className="shrink-0 text-subtle">
                            {formatBytes(attachment.sizeBytes)}
                          </span>
                        </button>
                      ))}

                      <span className="shrink-0 text-xs text-muted">
                        {formatDateTime(entry.performedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}

        {downloadError ? (
          <div className="px-5 pb-5">
            <ErrorNote message={downloadError} />
          </div>
        ) : null}
      </Card>

      <PerformTransitionModal
        key={`${target?.product.productId}-${target?.transition.transitionId}`}
        productId={target?.product.productId ?? ""}
        transition={asTransition}
        onClose={() => setTarget(null)}
        onPerformed={() => {
          dispatch(fetchMyPendingTransitions());
          dispatch(fetchMyPerformedTransitions());
        }}
      />
    </div>
  );
}

/** Product name, customer and a link through, shared by both groupings. */
function ProductHeading({
  productId,
  productName,
  customerName,
  trailing,
}: {
  productId: string;
  productName: string;
  customerName: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/dashboard/products/${productId}`}
        className="truncate text-sm font-semibold transition-colors hover:text-primary"
      >
        {productName}
      </Link>
      <span className="text-xs text-muted">{customerName}</span>
      {trailing ? <span className="ml-auto">{trailing}</span> : null}
    </div>
  );
}
