"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import WorkflowGraph from "@/components/WorkflowGraph";
import {
  Badge,
  Card,
  CardHeader,
  DetailGrid,
  DetailHero,
  DetailItem,
  EmptyState,
  ErrorNote,
  Spinner,
  TransitionLabel,
  cn,
  formatDate,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  clearSelectedTemplate,
  fetchTemplateById,
  fetchTemplateVersion,
  fetchTemplateVersions,
} from "@/store/workflowTemplatesSlice";
import type { WorkflowStage, WorkflowTransition } from "@/types";

export default function WorkflowTemplateDetailPage({
  params,
}: PageProps<"/dashboard/workflow-templates/[id]">) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const {
    selected,
    selectedLoading,
    selectedError,
    versions,
    versionsLoading,
    versionsError,
    version: graph,
    versionLoading,
    versionError,
  } = useAppSelector((state) => state.workflowTemplates);

  const [openVersion, setOpenVersion] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchTemplateById(id));
    dispatch(fetchTemplateVersions(id));
    return () => {
      dispatch(clearSelectedTemplate());
    };
  }, [dispatch, id]);

  function showVersion(version: number) {
    if (openVersion === version) {
      setOpenVersion(null);
      return;
    }

    setOpenVersion(version);
    dispatch(fetchTemplateVersion({ id, version }));
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
          href="/dashboard/workflow-templates"
          className="text-sm font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400"
        >
          ← Back to workflow templates
        </Link>
      </div>
    );
  }

  if (!selected) return null;

  return (
    <div className="space-y-5">
      <DetailHero
        name={selected.name}
        subtitle={selected.description}
        badges={
          <Badge>
            {versions.length} version{versions.length === 1 ? "" : "s"}
          </Badge>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {selected.stages.length > 0 ? (
            <Card className="overflow-hidden">
              <CardHeader title="Current draft" />
              <WorkflowGraph
                stages={selected.stages}
                transitions={selected.transitions}
              />
            </Card>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <CardHeader title={`Stages (${selected.stages.length})`} />
              <StageList stages={selected.stages} />
            </Card>

            <Card>
              <CardHeader
                title={`Transitions (${selected.transitions.length})`}
              />
              <TransitionList transitions={selected.transitions} />
            </Card>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader title="Summary" />
            <DetailGrid columns={1}>
              <DetailItem label="Description">
                {selected.description}
              </DetailItem>
              <DetailItem label="Stages">{selected.stages.length}</DetailItem>
              <DetailItem label="Transitions">
                {selected.transitions.length}
              </DetailItem>
              <DetailItem label="Created">
                {formatDate(selected.createdAt)}
              </DetailItem>
              <DetailItem label="Updated">
                {formatDate(selected.updatedAt)}
              </DetailItem>
              <DetailItem label="Template ID">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {selected.id}
                </span>
              </DetailItem>
            </DetailGrid>
          </Card>
        </aside>
      </div>

      <Card>
        <CardHeader title="Published versions" />

        {versionsError ? (
          <div className="p-5">
            <ErrorNote message={versionsError} />
          </div>
        ) : versionsLoading ? (
          <div className="flex justify-center py-10 text-slate-400">
            <Spinner className="h-5 w-5" />
          </div>
        ) : versions.length === 0 ? (
          <EmptyState
            title="No published versions"
            description="Products can only be created against a published version."
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {versions.map((item) => {
              const isOpen = openVersion === item.version;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => showVersion(item.version)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <Badge tone="sky">v{item.version}</Badge>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Published {formatDate(item.publishedAt)}
                    </span>
                    <span className="ml-auto text-xs font-medium text-sky-600 dark:text-sky-400">
                      {isOpen ? "Hide graph" : "View graph"}
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/20">
                      {versionLoading ? (
                        <div className="flex justify-center py-6 text-slate-400">
                          <Spinner className="h-5 w-5" />
                        </div>
                      ) : versionError ? (
                        <ErrorNote message={versionError} />
                      ) : graph?.version === item.version ? (
                        <div className="space-y-4">
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                            <WorkflowGraph
                              stages={graph.stages}
                              transitions={graph.transitions}
                              className="h-60"
                            />
                          </div>
                          <div className="grid gap-5 lg:grid-cols-2">
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Stages
                              </p>
                              <StageList stages={graph.stages} flush />
                            </div>
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Transitions
                              </p>
                              <TransitionList
                                transitions={graph.transitions}
                                flush
                              />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StageList({
  stages,
  flush = false,
}: {
  stages: WorkflowStage[];
  flush?: boolean;
}) {
  if (stages.length === 0) {
    return flush ? (
      <p className="text-sm text-slate-500 dark:text-slate-400">No stages.</p>
    ) : (
      <EmptyState title="No stages" />
    );
  }

  return (
    <ul className={cn("space-y-2", !flush && "p-5")}>
      {stages.map((stage) => (
        <li
          key={stage.id}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
        >
          <span className="font-medium">{stage.name}</span>
          {stage.isInitial ? <Badge tone="green">Initial</Badge> : null}
          {stage.isTerminal ? <Badge>Terminal</Badge> : null}
        </li>
      ))}
    </ul>
  );
}

function TransitionList({
  transitions,
  flush = false,
}: {
  transitions: WorkflowTransition[];
  flush?: boolean;
}) {
  if (transitions.length === 0) {
    return flush ? (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No transitions.
      </p>
    ) : (
      <EmptyState title="No transitions" />
    );
  }

  return (
    <ul className={cn("space-y-2", !flush && "p-5")}>
      {transitions.map((transition) => (
        <li
          key={transition.id}
          className="flex items-center rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
        >
          <TransitionLabel transition={transition} />
        </li>
      ))}
    </ul>
  );
}
