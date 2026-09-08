"use client";

import Modal from "@/components/Modal";
import WorkflowGraph from "@/components/WorkflowGraph";
import { Badge, ErrorNote, Spinner, formatDateTime } from "@/components/ui";
import { useAppSelector } from "@/store";

/** Read-only view of the graph a published version froze. */
export default function VersionSnapshotModal({
  version,
  onClose,
}: {
  version: number | null;
  onClose: () => void;
}) {
  const {
    version: snapshot,
    versionLoading,
    versionError,
  } = useAppSelector((state) => state.workflowTemplates);

  const loaded = snapshot?.version === version ? snapshot : null;

  return (
    <Modal
      open={version !== null}
      title={`Version ${version ?? ""}`}
      description={
        loaded
          ? `Published ${formatDateTime(loaded.publishedAt)}. This snapshot is immutable.`
          : "Loading the published snapshot…"
      }
      onClose={onClose}
    >
      {versionError ? (
        <ErrorNote message={versionError} />
      ) : versionLoading || !loaded ? (
        <div className="flex justify-center py-16 text-subtle">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <Badge>
              {loaded.stages.length} stage
              {loaded.stages.length === 1 ? "" : "s"}
            </Badge>
            <Badge>
              {loaded.transitions.length} transition
              {loaded.transitions.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="overflow-hidden rounded-lg border border-border-subtle">
            <WorkflowGraph
              stages={loaded.stages}
              transitions={loaded.transitions}
              readOnly
              heightClass="h-[20rem]"
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
