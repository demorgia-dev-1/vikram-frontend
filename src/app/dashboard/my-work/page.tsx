"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PerformTransitionModal from "@/components/PerformTransitionModal";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorNote,
  PageHeader,
  Spinner,
  TransitionLabel,
  formatDateTime,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchMyPendingTransitions,
  fetchMyPerformedTransitions,
} from "@/store/productWorkflowSlice";
import type { PendingTransition, ProductTransition } from "@/types";

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

  const [target, setTarget] = useState<PendingTransition | null>(null);

  useEffect(() => {
    dispatch(fetchMyPendingTransitions());
    dispatch(fetchMyPerformedTransitions());
  }, [dispatch]);

  /** The transition dialog works from a product transition, so adapt the row. */
  const asTransition: ProductTransition | null = target
    ? {
        id: target.transitionId,
        name: target.transitionName,
        srcStage: target.srcStage,
        destStage: target.destStage,
        allowAttachments: target.allowAttachments,
      }
    : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="My work"
        description="Transitions assigned to you, and what you have already done."
      />

      <Card className="overflow-hidden">
        <CardHeader
          title={`Waiting on you${pending.length ? ` (${pending.length})` : ""}`}
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
            {pending.map((item) => (
              <li
                key={`${item.productId}-${item.transitionId}`}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/products/${item.productId}`}
                    className="truncate text-sm font-medium transition-colors hover:text-primary"
                  >
                    {item.productName}
                  </Link>
                  <div className="mt-0.5">
                    <TransitionLabel
                      transition={{
                        id: item.transitionId,
                        name: item.transitionName,
                        srcStage: item.srcStage,
                        destStage: item.destStage,
                      }}
                      className="text-xs font-normal text-muted"
                    />
                  </div>
                </div>

                <Button
                  className="shrink-0 px-3 py-1.5 text-xs"
                  onClick={() => setTarget(item)}
                >
                  {item.transitionName || "Run"}
                </Button>
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
            {performed.map((item) => (
              <li
                key={`${item.productId}-${item.transitionId}-${item.performedAt}`}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/products/${item.productId}`}
                    className="truncate text-sm font-medium transition-colors hover:text-primary"
                  >
                    {item.productName}
                  </Link>
                  <div className="mt-0.5">
                    <TransitionLabel
                      transition={{
                        id: item.transitionId,
                        name: item.transitionName,
                        srcStage: item.srcStage,
                        destStage: item.destStage,
                      }}
                      className="text-xs font-normal text-muted"
                    />
                  </div>
                </div>

                <span className="shrink-0 text-xs text-muted">
                  {formatDateTime(item.performedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <PerformTransitionModal
        key={`${target?.productId}-${target?.transitionId}`}
        productId={target?.productId ?? ""}
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
