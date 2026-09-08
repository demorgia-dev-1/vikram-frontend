"use client";

import { useEffect } from "react";
import { CheckIcon, CloseIcon } from "@/components/icons";
import { useAppDispatch, useAppSelector } from "@/store";
import { dismissToast, type Toast, type ToastTone } from "@/store/toastSlice";

/** Errors stay until dismissed; the rest clear themselves. */
const AUTO_DISMISS_MS: Record<ToastTone, number | null> = {
  success: 4000,
  info: 5000,
  error: null,
};

const TONE_CLASS: Record<ToastTone, string> = {
  success: "border-success/40",
  info: "border-border-strong",
  error: "border-danger/40",
};

const ICON_CLASS: Record<ToastTone, string> = {
  success: "bg-success/15 text-success",
  info: "bg-primary/15 text-primary",
  error: "bg-danger/15 text-danger",
};

/**
 * The app's single toast outlet. Anything can announce a result with
 * `dispatch(showToast("Saved"))` — no prop drilling, no provider per page.
 */
export default function Toaster() {
  const toasts = useAppSelector((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      // Polite: a confirmation should not interrupt what is being read.
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  const timeout = AUTO_DISMISS_MS[toast.tone];

  useEffect(() => {
    if (timeout === null) return;
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), timeout);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id, timeout]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full max-w-sm animate-[toast-in_180ms_ease-out] items-start gap-3 rounded-xl border bg-surface px-4 py-3 text-foreground shadow-lg ${TONE_CLASS[toast.tone]}`}
    >
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ICON_CLASS[toast.tone]}`}
      >
        {toast.tone === "success" ? (
          <CheckIcon className="h-3 w-3" />
        ) : (
          <span className="text-[11px] font-bold leading-none">!</span>
        )}
      </span>

      <p className="min-w-0 flex-1 text-sm">{toast.message}</p>

      <button
        type="button"
        onClick={() => dispatch(dismissToast(toast.id))}
        aria-label="Dismiss"
        className="-mr-1 shrink-0 rounded p-1 text-muted transition-colors hover:text-foreground"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
