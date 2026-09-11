"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/Modal";
import StageFormModal from "@/components/StageFormModal";
import TemplateFormModal from "@/components/TemplateFormModal";
import TransitionFormModal from "@/components/TransitionFormModal";
import VersionSnapshotModal from "@/components/VersionSnapshotModal";
import WorkflowGraph from "@/components/WorkflowGraph";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import {
  Button,
  Card,
  ErrorNote,
  Spinner,
  formatDateTime,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  clearSaveError,
  clearSelectedTemplate,
  deleteStage,
  deleteTemplate,
  deleteTransition,
  fetchTemplateById,
  fetchTemplateVersion,
  fetchTemplateVersions,
  publishTemplate,
} from "@/store/workflowTemplatesSlice";
import { showToast } from "@/store/toastSlice";
import type { WorkflowStage, WorkflowTransition } from "@/types";

export default function WorkflowTemplateDetailPage({
  params,
}: PageProps<"/dashboard/workflow-templates/[id]">) {
  const { id } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.user?.role);
  const {
    selected,
    selectedLoading,
    selectedError,
    versions,
    versionsLoading,
    versionsError,
    saving,
    saveError,
  } = useAppSelector((state) => state.workflowTemplates);

  const [editingTemplate, setEditingTemplate] = useState(false);
  const [stageForm, setStageForm] = useState<
    { mode: "create" } | { mode: "edit"; stage: WorkflowStage } | null
  >(null);
  const [transitionForm, setTransitionForm] = useState<
    | { mode: "create"; defaults?: { srcStageId: string; destStageId: string } }
    | { mode: "edit"; transition: WorkflowTransition }
    | null
  >(null);
  const [pendingStageDelete, setPendingStageDelete] =
    useState<WorkflowStage | null>(null);
  const [pendingTransitionDelete, setPendingTransitionDelete] =
    useState<WorkflowTransition | null>(null);
  const [pendingTemplateDelete, setPendingTemplateDelete] = useState(false);
  const [pendingPublish, setPendingPublish] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchTemplateById(id));
    dispatch(fetchTemplateVersions(id));
    return () => {
      dispatch(clearSelectedTemplate());
    };
  }, [dispatch, id]);

  if (selectedLoading && !selected) {
    return (
      <div className="flex justify-center py-20 text-subtle">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        <ErrorNote
          message={selectedError ?? "This template could not be loaded."}
        />
        <Link
          href="/dashboard/workflow-templates"
          className="text-sm font-medium text-primary hover:text-primary-hover"
        >
          ← Back to workflow templates
        </Link>
      </div>
    );
  }

  const isAdmin = role === "ADMIN";
  const stages = selected.stages;
  const transitions = selected.transitions;
  // Versions come back newest first, so the head is the highest number.
  const nextVersion = (versions[0]?.version ?? 0) + 1;

  function open(action: () => void) {
    dispatch(clearSaveError());
    action();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {selected.name}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            {selected.description || "No description."}
          </p>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => open(() => setEditingTemplate(true))}
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </Button>
            <Button
              disabled={stages.length === 0}
              title={
                stages.length === 0
                  ? "Add at least one stage before publishing"
                  : `Freeze the current draft as version ${nextVersion}`
              }
              onClick={() => open(() => setPendingPublish(true))}
            >
              Publish
            </Button>
            <Button
              variant="secondary"
              aria-label="Delete template"
              title="Delete this template and its stages"
              className="px-2.5 text-muted hover:border-danger hover:bg-danger-soft hover:text-danger"
              onClick={() => open(() => setPendingTemplateDelete(true))}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {selectedError ? <ErrorNote message={selectedError} /> : null}

      {/* Flow: stages as nodes, transitions as edges */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold">Flow</h2>
            <p className="text-xs text-muted">
              {stages.length} stage{stages.length === 1 ? "" : "s"},{" "}
              {transitions.length} transition
              {transitions.length === 1 ? "" : "s"}.
              {isAdmin ? (
                <>
                  {" "}
                  Drag the{" "}
                  <span className="inline-flex h-3.5 w-3.5 translate-y-0.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    +
                  </span>{" "}
                  on a stage onto another to connect them, or use Add
                  transition.
                </>
              ) : null}
            </p>
          </div>

          {isAdmin ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                className="px-3 py-1.5 text-xs"
                disabled={stages.length < 2}
                title={
                  stages.length < 2
                    ? "Add at least two stages first"
                    : "Connect two stages without dragging"
                }
                onClick={() =>
                  open(() => setTransitionForm({ mode: "create" }))
                }
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add transition
              </Button>
              <Button
                className="px-3 py-1.5 text-xs"
                onClick={() => open(() => setStageForm({ mode: "create" }))}
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add stage
              </Button>
            </div>
          ) : null}
        </div>

        <WorkflowGraph
          stages={stages}
          transitions={transitions}
          readOnly={!isAdmin}
          onEditStage={
            isAdmin
              ? (stage) => open(() => setStageForm({ mode: "edit", stage }))
              : undefined
          }
          onDeleteStage={
            isAdmin
              ? (stage) => open(() => setPendingStageDelete(stage))
              : undefined
          }
          onDeleteTransition={
            isAdmin
              ? (transition) =>
                  open(() => setPendingTransitionDelete(transition))
              : undefined
          }
          onAddStage={
            isAdmin
              ? () => open(() => setStageForm({ mode: "create" }))
              : undefined
          }
          onEditTransition={
            isAdmin
              ? (transition) =>
                  open(() => setTransitionForm({ mode: "edit", transition }))
              : undefined
          }
          onConnectStages={
            isAdmin
              ? (srcStageId, destStageId) =>
                  // A transition needs a name, so the drag opens the dialog with
                  // the pair prefilled rather than creating it outright.
                  open(() =>
                    setTransitionForm({
                      mode: "create",
                      defaults: { srcStageId, destStageId },
                    }),
                  )
              : undefined
          }
        />

        {saveError ? (
          <p
            role="alert"
            className="border-t border-border-subtle bg-danger-soft px-5 py-3 text-sm text-danger"
          >
            {saveError}
          </p>
        ) : null}
      </Card>

      {/* Published versions */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold">Published versions</h2>
            <p className="text-xs text-muted">
              Each publish freezes the draft above. Versions never change.
            </p>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted">
            {versions.length} {versions.length === 1 ? "version" : "versions"}
          </span>
        </div>

        {versionsError ? (
          <p
            role="alert"
            className="border-b border-border-subtle bg-danger-soft px-5 py-3 text-sm text-danger"
          >
            {versionsError}
          </p>
        ) : null}

        {versionsLoading && versions.length === 0 ? (
          <div className="space-y-2 px-5 py-4">
            <div className="h-8 animate-pulse rounded-lg bg-surface-muted" />
            <div className="h-8 animate-pulse rounded-lg bg-surface-muted" />
          </div>
        ) : versions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted">Not published yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-subtle">
              Publishing captures the current stages and transitions as version
              1.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {versions.map((entry, index) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
              >
                <span className="flex h-7 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-muted px-2 text-[11px] font-semibold tabular-nums">
                  v{entry.version}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {formatDateTime(entry.publishedAt)}
                  </p>
                  {index === 0 ? (
                    <p className="text-[11px] font-medium uppercase tracking-wide text-success">
                      Latest
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="secondary"
                  className="shrink-0 px-2.5 py-1.5 text-xs"
                  onClick={() => {
                    setViewingVersion(entry.version);
                    dispatch(
                      fetchTemplateVersion({ id, version: entry.version }),
                    );
                  }}
                >
                  View snapshot
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <TemplateFormModal
        key={`edit-${selected.updatedAt}`}
        open={editingTemplate}
        template={selected}
        onClose={() => setEditingTemplate(false)}
      />

      <StageFormModal
        key={
          stageForm?.mode === "edit"
            ? `stage-${stageForm.stage.id}`
            : "stage-new"
        }
        open={Boolean(stageForm)}
        templateId={id}
        stage={stageForm?.mode === "edit" ? stageForm.stage : null}
        onClose={() => setStageForm(null)}
      />

      <TransitionFormModal
        key={
          transitionForm?.mode === "edit"
            ? `transition-${transitionForm.transition.id}`
            : `transition-new-${transitionForm?.defaults?.srcStageId ?? ""}`
        }
        open={Boolean(transitionForm)}
        templateId={id}
        stages={stages}
        transition={
          transitionForm?.mode === "edit" ? transitionForm.transition : null
        }
        defaults={
          transitionForm?.mode === "create" ? transitionForm.defaults : null
        }
        onClose={() => setTransitionForm(null)}
      />

      <VersionSnapshotModal
        version={viewingVersion}
        onClose={() => setViewingVersion(null)}
      />

      <ConfirmModal
        open={Boolean(pendingStageDelete)}
        title="Delete this stage?"
        message={`${pendingStageDelete?.name ?? "This stage"} will be removed from this template, along with any transitions that use it. This cannot be undone.`}
        confirmLabel="Delete stage"
        loadingLabel="Deleting…"
        loading={saving}
        error={saveError}
        onConfirm={async () => {
          if (!pendingStageDelete) return;
          const result = await dispatch(
            deleteStage({ templateId: id, stageId: pendingStageDelete.id }),
          );
          if (deleteStage.fulfilled.match(result)) {
            dispatch(showToast(`Stage “${pendingStageDelete.name}” deleted`));
            setPendingStageDelete(null);
          }
        }}
        onClose={() => setPendingStageDelete(null)}
      />

      <ConfirmModal
        open={Boolean(pendingTransitionDelete)}
        title="Delete this transition?"
        message={
          pendingTransitionDelete
            ? `${pendingTransitionDelete.srcStage.name} → ${pendingTransitionDelete.destStage.name} will be removed from the draft.`
            : ""
        }
        confirmLabel="Delete transition"
        loadingLabel="Deleting…"
        loading={saving}
        error={saveError}
        onConfirm={async () => {
          if (!pendingTransitionDelete) return;
          const result = await dispatch(
            deleteTransition({
              templateId: id,
              transitionId: pendingTransitionDelete.id,
            }),
          );
          if (deleteTransition.fulfilled.match(result)) {
            dispatch(showToast("Transition deleted"));
            setPendingTransitionDelete(null);
          }
        }}
        onClose={() => setPendingTransitionDelete(null)}
      />

      <ConfirmModal
        open={pendingPublish}
        title={`Publish version ${nextVersion}?`}
        message="This freezes the current stages and transitions as an immutable version. Products created from it always use this snapshot. The draft stays editable."
        confirmLabel="Publish"
        loadingLabel="Publishing…"
        loading={saving}
        error={saveError}
        onConfirm={async () => {
          const result = await dispatch(publishTemplate(id));
          if (publishTemplate.fulfilled.match(result)) {
            dispatch(showToast(`Version ${nextVersion} published`));
            setPendingPublish(false);
          }
        }}
        onClose={() => setPendingPublish(false)}
      />

      <ConfirmModal
        open={pendingTemplateDelete}
        title="Delete this template?"
        message={`${selected.name} and its draft stages will be permanently deleted. Published versions already in use by products are unaffected.`}
        confirmLabel="Delete template"
        loadingLabel="Deleting…"
        loading={saving}
        error={saveError}
        onConfirm={async () => {
          const result = await dispatch(deleteTemplate(id));
          if (deleteTemplate.fulfilled.match(result)) {
            dispatch(showToast(`${selected.name} deleted`));
            router.replace("/dashboard/workflow-templates");
          }
        }}
        onClose={() => setPendingTemplateDelete(false)}
      />
    </div>
  );
}
