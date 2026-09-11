"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { TrashIcon } from "@/components/icons";
import {
  Button,
  ErrorNote,
  IconButton,
  TransitionLabel,
  formatBytes,
  labelClass,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { showToast } from "@/store/toastSlice";
import {
  performTransition,
  presignAttachments,
} from "@/store/productWorkflowSlice";
import type { AttachmentRef, ProductTransition } from "@/types";

/**
 * Uploads straight to S3 with the presigned URL — deliberately plain fetch, so
 * the app's Authorization header is never sent to the bucket.
 */
async function uploadToS3(url: string, file: File) {
  const response = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });

  if (!response.ok) {
    throw new Error(`Upload failed for ${file.name} (${response.status})`);
  }
}

export default function PerformTransitionModal({
  productId,
  transition,
  onClose,
  onPerformed,
}: {
  productId: string;
  transition: ProductTransition | null;
  onClose: () => void;
  onPerformed?: () => void;
}) {
  const dispatch = useAppDispatch();
  const { performing, performError } = useAppSelector(
    (state) => state.productWorkflow,
  );

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const allowAttachments = transition?.allowAttachments ?? false;
  const busy = performing || uploading;

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((previous) => [...previous, ...Array.from(list)]);
    setUploadError(null);
  }

  function close() {
    setFiles([]);
    setUploadError(null);
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transition) return;

    let attachments: AttachmentRef[] = [];

    if (allowAttachments && files.length > 0) {
      setUploading(true);
      setUploadError(null);

      try {
        const presigned = await dispatch(
          presignAttachments({
            productId,
            transitionId: transition.id,
            files: files.map((file) => ({
              fileName: file.name,
              mimeType: file.type || "application/octet-stream",
            })),
          }),
        );

        if (!presignAttachments.fulfilled.match(presigned)) {
          setUploadError(presigned.payload ?? "Could not prepare the upload.");
          return;
        }

        const uploads = presigned.payload;

        if (uploads.length !== files.length) {
          setUploadError(
            "The server returned a different number of upload URLs than files selected.",
          );
          return;
        }

        // Presigned targets come back in request order; match by name when given.
        attachments = await Promise.all(
          files.map(async (file, index) => {
            const target =
              uploads.find((item) => item.fileName === file.name) ??
              uploads[index];

            if (!target?.url) {
              throw new Error(`No upload URL was returned for ${file.name}.`);
            }

            await uploadToS3(target.url, file);

            return {
              key: target.key,
              fileName: file.name,
              mimeType: file.type || "application/octet-stream",
              sizeBytes: file.size,
            };
          }),
        );
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Upload failed.",
        );
        return;
      } finally {
        setUploading(false);
      }
    }

    const result = await dispatch(
      performTransition({
        productId,
        transitionId: transition.id,
        attachments,
      }),
    );

    if (performTransition.fulfilled.match(result)) {
      dispatch(
        showToast(
          transition.name
            ? `${transition.name} recorded`
            : `${transition.srcStage.name} → ${transition.destStage.name} recorded`,
        ),
      );
      onPerformed?.();
      close();
    }
  }

  return (
    <Modal
      open={Boolean(transition)}
      title={transition?.name || "Run transition"}
      description="This advances the product's workflow and is recorded against your account."
      onClose={close}
      size="sm"
      closeDisabled={busy}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="perform-form" loading={busy}>
            {uploading
              ? "Uploading…"
              : performing
                ? "Working…"
                : transition?.name || "Confirm"}
          </Button>
        </>
      }
    >
      {transition ? (
        <form id="perform-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-border-subtle px-3 py-2.5">
            <TransitionLabel transition={transition} />
          </div>

          {allowAttachments ? (
            <div>
              <span className={labelClass}>Attachments</span>
              <p className="mt-0.5 text-xs text-muted">
                Files upload directly to storage before the transition is
                recorded. Optional.
              </p>

              <input
                type="file"
                multiple
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
                disabled={busy}
                className="mt-2 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-border-subtle file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
              />

              {files.length > 0 ? (
                <ul className="mt-3 divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {file.name}
                        </span>
                        <span className="block text-xs text-muted">
                          {formatBytes(file.size)}
                        </span>
                      </span>
                      <IconButton
                        label="Remove file"
                        tone="danger"
                        disabled={busy}
                        onClick={() =>
                          setFiles((previous) =>
                            previous.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border-subtle px-3 py-3 text-center text-xs text-muted">
              Attachments are not enabled for this transition&apos;s assignee.
            </p>
          )}

          {uploadError ? <ErrorNote message={uploadError} /> : null}
          {performError ? <ErrorNote message={performError} /> : null}
        </form>
      ) : null}
    </Modal>
  );
}
