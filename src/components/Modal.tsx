"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/components/icons";
import { Button, ErrorNote, cn } from "@/components/ui";

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
  closeDisabled = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md";
  closeDisabled?: boolean;
}) {
  // Escape-to-close and scroll lock are DOM concerns, so they live in an effect.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !closeDisabled) onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, closeDisabled]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => !closeDisabled && onClose()}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border-subtle bg-white shadow-2xl sm:rounded-2xl ",
          size === "sm" ? "sm:max-w-lg" : "sm:max-w-6xl"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div>
            <h2
              id="modal-title"
              className="text-base font-semibold tracking-tight"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Close dialog"
            className="-mr-1 rounded-lg p-1.5 text-subtle transition hover:bg-surface-muted hover:text-muted disabled:opacity-40"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer ? (
          <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  loadingLabel,
  loading = false,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loadingLabel: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      closeDisabled={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={onConfirm}
            className="bg-danger hover:bg-danger-soft0 focus-visible:ring-danger/30"
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
      {error ? (
        <div className="mt-4">
          <ErrorNote message={error} />
        </div>
      ) : null}
    </Modal>
  );
}
